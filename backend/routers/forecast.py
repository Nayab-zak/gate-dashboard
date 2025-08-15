# server/app/routers/forecast.py
from fastapi import APIRouter, Query
from typing import List, Optional, Tuple
from datetime import datetime, timedelta
from backend.db import get_conn
from backend.config import settings
from backend.schemas import Next8HResponse, ForecastPoint
from backend.utils.timebox import next_n_hours, now_local
from fastapi import HTTPException

router = APIRouter(prefix="/forecast", tags=["forecast"])

# normalize inputs
def norm_move_type(s: str | None) -> str | None:
    if not s: return None
    s = s.strip().upper()
    if s in {"ALL", "ANY"}: return None
    return "IN" if s in {"IN","INWARD"} else ("OUT" if s in {"OUT","OUTWARD"} else s)

def norm_desig(s: str | None) -> str | None:
    if not s: return None
    s = s.strip().upper()
    if s in {"ALL", "ANY"}: return None
    mapping = {"EMPTY":"EMPTY", "FULL":"FULL", "EXP":"EXP", "EXPORT":"EXP"}
    return mapping.get(s, s)

@router.get("/next8h", response_model=Next8HResponse)
def next8h(
    terminal_id: str,
    move_type: Optional[str] = Query(None, description="IN or OUT"),
    desig: Optional[str] = Query(None, description="EMPTY, FULL, or EXP"),
):
    horizon = next_n_hours(8)
    start = horizon[0]
    end = horizon[-1]

    mt = norm_move_type(move_type) if move_type else None
    dg = norm_desig(desig) if desig else None

    # handle midnight crossing cleanly by building a synthetic key YYYYMMDDHH
    start_key = int(start.strftime("%Y%m%d%H"))
    end_key   = int(end.strftime("%Y%m%d%H"))

    wheres = ['TerminalID = ?']
    params: List = [terminal_id]
    if mt:
        wheres.append('MoveType = ?'); params.append(mt)
    if dg:
        wheres.append('Desig = ?'); params.append(dg)

    # Build the synthetic key in SQL: YYYYMMDD * 100 + hour
    # Vertica: EXTRACT functions + LPAD are fine; here we do arithmetic to stay numeric.
    query = f"""
    WITH keyed AS (
      SELECT
        TerminalID, MoveType, Desig,
        MoveDate_pred, MoveHour_pred,
        (CAST(TO_CHAR(MoveDate_pred, 'YYYYMMDD') AS INTEGER) * 100 + MoveHour_pred) AS ymdh_key,
        TokenCount_pred, TokenCount_true, updated_at
      FROM {settings.VERTICA_TABLE_TOKENS}
    )
    SELECT TerminalID, MoveType, Desig, MoveDate_pred, MoveHour_pred,
           TokenCount_pred, TokenCount_true, updated_at
    FROM keyed
    WHERE {' AND '.join(wheres)} AND ymdh_key BETWEEN ? AND ?
    ORDER BY MoveDate_pred, MoveHour_pred
    """

    params.extend([start_key, end_key])

    # capacity (simple: per-terminal stored in memory for now; swap with table later)
    capacity = settings.DEFAULT_CAPACITY_PER_HOUR

    rows=[]
    latest_updated = None
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(query, params)
        for r in cur.iterate():
            # r: tuple in the order of SELECT
            terminal, mtv, dgv, d_pred, h_pred, token_count_pred, actual, updated = r
            # Compose localized timestamp
            ts = datetime.combine(d_pred, datetime.min.time()).replace(hour=h_pred)
            # treat as Asia/Dubai; if Vertica stores tz-naive dates/hours, we localize here:
            ts = ts.replace(tzinfo=None).astimezone()  # make aware via system tz first
            # force to Asia/Dubai (safe if machine in UTC)
            import zoneinfo
            ts = ts.astimezone(zoneinfo.ZoneInfo("Asia/Dubai"))

            latest_updated = max(latest_updated, updated) if latest_updated else updated
            rows.append(ForecastPoint(
                ts=ts,
                move_type=str(mtv).upper(),
                desig=str(dgv).upper(),
                terminal_id=terminal,
                pred=float(token_count_pred) if token_count_pred is not None else 0.0,
                actual=float(actual) if actual is not None else None,
                lower=None, upper=None  # fill when you have intervals
            ))

    # fill gaps for any hours missing in DB (so charts stay continuous)
    by_key = {(r.ts, r.move_type, r.desig): r for r in rows}
    filled=[]
    for ts in horizon:
        key = (ts, by_key[next(iter(by_key))].move_type if by_key else (mt or "IN"), by_key[next(iter(by_key))].desig if by_key else (dg or "EXP"))
        # safer: just search by ts regardless of mt/dg if filters null
        match = next((r for r in rows if r.ts.replace(minute=0, second=0, microsecond=0)==ts.replace(minute=0, second=0, microsecond=0)), None)
        if match:
            filled.append(match)
        else:
            filled.append(ForecastPoint(
                ts=ts, move_type=mt or "IN", desig=dg or "EXP",
                terminal_id=terminal_id, pred=0.0
            ))

    return Next8HResponse(
        horizon_hours=sorted(filled, key=lambda x: x.ts),
        generated_at=now_local(),
        updated_at=latest_updated or now_local(),
        capacity_per_hour=capacity
    )
@router.get("/range", response_model=Next8HResponse)  # reuse schema for now
def range_hours(
    terminal_id: str,
    start_iso: str,
    end_iso: str,
    move_type: Optional[str] = None,
    desig: Optional[str] = None,
):
    from datetime import datetime
    import zoneinfo

    TZ = zoneinfo.ZoneInfo(settings.DEFAULT_TIMEZONE)

    def parse_local_dt(s: str) -> datetime:
        # Accepts 'YYYY-MM-DDTHH:mm' (no timezone)
        # If timezone present, keep it; otherwise, assign Asia/Dubai
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=TZ)
        else:
            dt = dt.astimezone(TZ)
        return dt.replace(minute=0, second=0, microsecond=0)

    try:
        start = parse_local_dt(start_iso)
        end   = parse_local_dt(end_iso)
        if end < start:
            raise ValueError("end before start")
        # guardrail: max 14 days window for now
        if (end - start).days > 14:
            raise ValueError("window too large")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Bad start/end: {e}")

    # compute numeric keys like 2025081209 (YYYYMMDDHH)
    start_key = int(start.strftime("%Y%m%d%H"))
    end_key   = int(end.strftime("%Y%m%d%H"))

    mt = norm_move_type(move_type) if move_type else None
    dg = norm_desig(desig) if desig else None

    wheres = ['"TerminalID" = ?']
    params: List = [terminal_id]
    if mt:
        wheres.append('"MoveType" = ?'); params.append(mt)
    if dg:
        wheres.append('"Desig" = ?'); params.append(dg)

    q = f"""
    WITH keyed AS (
      SELECT
        "TerminalID", "MoveType", "Desig",
        "MoveDate_pred", "MoveHour_pred",
        (CAST(TO_CHAR("MoveDate_pred", 'YYYYMMDD') AS INTEGER) * 100 + "MoveHour_pred") AS ymdh_key,
        "TokenCount_pred", "TokenCount_true", updated_at
      FROM {settings.VERTICA_TABLE_TOKENS}
    )
    SELECT "TerminalID", "MoveType", "Desig", "MoveDate_pred", "MoveHour_pred",
           "TokenCount_pred", "TokenCount_true", updated_at
    FROM keyed
    WHERE {' AND '.join(wheres)} AND ymdh_key BETWEEN ? AND ?
    ORDER BY "MoveDate_pred", "MoveHour_pred"
    """
    params.extend([start_key, end_key])

    rows=[]; latest=None
    with get_conn() as conn:
        cur=conn.cursor(); cur.execute(q, params)
        for r in cur.iterate():
            terminal, mtv, dgv, d_pred, h_pred, pred, actual, upd = r
            ts = datetime.combine(d_pred, datetime.min.time()).replace(hour=h_pred)
            import zoneinfo
            ts = ts.replace(tzinfo=zoneinfo.ZoneInfo(settings.DEFAULT_TIMEZONE))
            latest = upd if latest is None or upd>latest else latest
            rows.append(ForecastPoint(
                ts=ts, move_type=str(mtv).upper(), desig=str(dgv).upper(),
                terminal_id=terminal, pred=float(pred or 0), actual=(float(actual) if actual is not None else None)
            ))

    # fill missing hours in window
    from ..utils.timebox import TZ as _TZ
    cursor = start
    filled=[]
    while cursor <= end:
        m = next((x for x in rows if x.ts==cursor), None)
        if m: filled.append(m)
        else:
            filled.append(ForecastPoint(ts=cursor, move_type=mt or "IN", desig=dg or "EXP",
                                        terminal_id=terminal_id, pred=0.0))
        cursor = cursor.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)

    return Next8HResponse(
        horizon_hours=filled,
        generated_at=now_local(),
        updated_at=latest or now_local(),
        capacity_per_hour=settings.DEFAULT_CAPACITY_PER_HOUR
    )
