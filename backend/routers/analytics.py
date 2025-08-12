from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from datetime import datetime
import zoneinfo

from ..db import get_conn
from ..config import settings
from .forecast import norm_move_type, norm_desig  # reuse normalizers

router = APIRouter(prefix="/analytics", tags=["analytics"])
TZ = zoneinfo.ZoneInfo(settings.DEFAULT_TIMEZONE)

def parse_local_dt(s: str) -> datetime:
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is None: dt = dt.replace(tzinfo=TZ)
    else: dt = dt.astimezone(TZ)
    return dt.replace(minute=0, second=0, microsecond=0)

def _base_where(terminal_id: Optional[str], move_type: Optional[str], desig: Optional[str]):
    wheres, params = [], []
    if terminal_id and terminal_id.upper() not in {"ALL", ""}:
        wheres.append("TerminalID = ?"); params.append(terminal_id)
    mt = norm_move_type(move_type)
    if mt: wheres.append("MoveType = ?"); params.append(mt)
    dg = norm_desig(desig)
    if dg: wheres.append("Desig = ?"); params.append(dg)
    return wheres, params

def _key_bounds(start_iso: str, end_iso: str):
    start = parse_local_dt(start_iso); end = parse_local_dt(end_iso)
    if end < start: raise HTTPException(422, "end before start")
    start_key = int(start.strftime("%Y%m%d%H")); end_key = int(end.strftime("%Y%m%d%H"))
    return start_key, end_key

# 1) Terminal ranking (total tokens in window)
@router.get("/terminal_ranking")
def terminal_ranking(start_iso: str, end_iso: str,
                     move_type: Optional[str] = None, desig: Optional[str] = None):
    start_key, end_key = _key_bounds(start_iso, end_iso)
    wheres, params = _base_where(None, move_type, desig)

    q = f"""
    WITH keyed AS (
      SELECT TerminalID,
             (CAST(TO_CHAR(MoveDate_pred,'YYYYMMDD') AS INTEGER)*100 + MoveHour_pred) AS ymdh_key,
             TokenCount_pred
      FROM {settings.VERTICA_TABLE_TOKENS}
    )
    SELECT TerminalID, SUM(TokenCount_pred) AS total_pred
    FROM keyed
    WHERE {' AND '.join(wheres + ['ymdh_key BETWEEN ? AND ?']) if wheres else 'ymdh_key BETWEEN ? AND ?'}
    GROUP BY 1
    ORDER BY 2 DESC
    """
    params += [start_key, end_key]

    rows=[]
    with get_conn() as conn:
        cur=conn.cursor(); cur.execute(q, params)
        for t, s in cur.iterate(): rows.append({"terminal": t, "total_pred": float(s or 0.0)})
    return {"ranking": rows}

# 2) MoveType share (IN vs OUT, total over window)
@router.get("/movetype_share")
def movetype_share(start_iso: str, end_iso: str,
                   terminal_id: Optional[str] = None, desig: Optional[str] = None):
    start_key, end_key = _key_bounds(start_iso, end_iso)
    wheres, params = _base_where(terminal_id, None, desig)

    q = f"""
    WITH keyed AS (
      SELECT MoveType,
             (CAST(TO_CHAR(MoveDate_pred,'YYYYMMDD') AS INTEGER)*100 + MoveHour_pred) AS ymdh_key,
             TokenCount_pred
      FROM {settings.VERTICA_TABLE_TOKENS}
    )
    SELECT UPPER(MoveType) AS MoveType, SUM(TokenCount_pred) AS sum_pred
    FROM keyed
    WHERE {' AND '.join(wheres + ['ymdh_key BETWEEN ? AND ?']) if wheres else 'ymdh_key BETWEEN ? AND ?'}
    GROUP BY 1
    """
    params += [start_key, end_key]

    out = {"IN": 0.0, "OUT": 0.0}
    with get_conn() as conn:
        cur=conn.cursor(); cur.execute(q, params)
        for mt, s in cur.iterate():
            if mt in out: out[mt] = float(s or 0.0)
    return {"share": out}

# 3) MoveType hourly trend (IN & OUT series)
@router.get("/movetype_hourly")
def movetype_hourly(start_iso: str, end_iso: str,
                    terminal_id: Optional[str] = None, desig: Optional[str] = None):
    start_key, end_key = _key_bounds(start_iso, end_iso)
    wheres, params = _base_where(terminal_id, None, desig)

    q = f"""
    WITH keyed AS (
      SELECT MoveType, MoveDate_pred, MoveHour_pred,
             (CAST(TO_CHAR(MoveDate_pred,'YYYYMMDD') AS INTEGER)*100 + MoveHour_pred) AS ymdh_key,
             TokenCount_pred
      FROM {settings.VERTICA_TABLE_TOKENS}
    )
    SELECT MoveDate_pred, MoveHour_pred, UPPER(MoveType) AS MoveType, SUM(TokenCount_pred) AS sum_pred
    FROM keyed
    WHERE {' AND '.join(wheres + ['ymdh_key BETWEEN ? AND ?']) if wheres else 'ymdh_key BETWEEN ? AND ?'}
    GROUP BY 1,2,3
    ORDER BY 1,2
    """
    params += [start_key, end_key]
    rows=[]
    with get_conn() as conn:
        cur=conn.cursor(); cur.execute(q, params)
        for d, h, mt, s in cur.iterate():
            rows.append({"date": str(d), "hour": int(h), "move_type": mt, "pred": float(s or 0.0)})
    return {"points": rows}

# 4) Desig stacked hourly (EXP/FULL/EMPTY)
@router.get("/desig_hourly")
def desig_hourly(start_iso: str, end_iso: str,
                 terminal_id: Optional[str] = None, move_type: Optional[str] = None):
    start_key, end_key = _key_bounds(start_iso, end_iso)
    wheres, params = _base_where(terminal_id, move_type, None)

    q = f"""
    WITH keyed AS (
      SELECT Desig, MoveDate_pred, MoveHour_pred,
             (CAST(TO_CHAR(MoveDate_pred,'YYYYMMDD') AS INTEGER)*100 + MoveHour_pred) AS ymdh_key,
             TokenCount_pred
      FROM {settings.VERTICA_TABLE_TOKENS}
    )
    SELECT MoveDate_pred, MoveHour_pred, UPPER(Desig) AS Desig, SUM(TokenCount_pred) AS sum_pred
    FROM keyed
    WHERE {' AND '.join(wheres + ['ymdh_key BETWEEN ? AND ?']) if wheres else 'ymdh_key BETWEEN ? AND ?'}
    GROUP BY 1,2,3
    ORDER BY 1,2
    """
    params += [start_key, end_key]
    rows=[]
    with get_conn() as conn:
        cur=conn.cursor(); cur.execute(q, params)
        for d, h, dg, s in cur.iterate():
            rows.append({"date": str(d), "hour": int(h), "desig": dg, "pred": float(s or 0.0)})
    return {"points": rows}

# 5) Heatmap: Terminal x Hour (sum over window)
@router.get("/terminal_hour_heatmap")
def terminal_hour_heatmap(start_iso: str, end_iso: str,
                          move_type: Optional[str] = None, desig: Optional[str] = None):
    start_key, end_key = _key_bounds(start_iso, end_iso)
    wheres, params = _base_where(None, move_type, desig)

    q = f"""
    WITH keyed AS (
      SELECT TerminalID, MoveHour_pred,
             (CAST(TO_CHAR(MoveDate_pred,'YYYYMMDD') AS INTEGER)*100 + MoveHour_pred) AS ymdh_key,
             TokenCount_pred
      FROM {settings.VERTICA_TABLE_TOKENS}
    )
    SELECT TerminalID, MoveHour_pred, SUM(TokenCount_pred) AS sum_pred
    FROM keyed
    WHERE {' AND '.join(wheres + ['ymdh_key BETWEEN ? AND ?']) if wheres else 'ymdh_key BETWEEN ? AND ?'}
    GROUP BY 1,2
    ORDER BY 1,2
    """
    params += [start_key, end_key]
    rows=[]
    with get_conn() as conn:
        cur=conn.cursor(); cur.execute(q, params)
        for t, h, s in cur.iterate():
            rows.append({"terminal": t, "hour": int(h), "pred": float(s or 0.0)})
    return {"cells": rows}
