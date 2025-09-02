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

def _time_bounds(start_iso: str, end_iso: str):
    start = parse_local_dt(start_iso); end = parse_local_dt(end_iso)
    if end < start: raise HTTPException(422, "end before start")
    return start, end

def _get_deduped_base_cte(start_dt: datetime, end_dt: datetime, terminal_filters: str = "") -> str:
    """
    Returns the base CTE that deduplicates by (TerminalID, MoveType, Desig, date, hour)
    and picks the latest updated_at for each combination.
    """
    return f"""
    WITH base AS (
      SELECT
        "TerminalID",
        UPPER(TRIM("MoveType")) AS "MoveType",
        UPPER(TRIM("Desig")) AS "Desig", 
        "MoveDate_pred",
        "MoveHour_pred",
        TIMESTAMPADD(hour, "MoveHour_pred", CAST("MoveDate_pred" AS TIMESTAMP)) AS ts_pred,
        "TokenCount_pred"::FLOAT AS pred,
        "updated_at"
      FROM {settings.VERTICA_TABLE_TOKENS}
      WHERE TIMESTAMPADD(hour, "MoveHour_pred", CAST("MoveDate_pred" AS TIMESTAMP)) BETWEEN ? AND ?
        {terminal_filters}
    ),
    dedup AS (
      SELECT
        b.*,
        ROW_NUMBER() OVER (
          PARTITION BY "TerminalID", "MoveType", "Desig", "MoveDate_pred", "MoveHour_pred"
          ORDER BY "updated_at" DESC
        ) AS rn
      FROM base b
    )
    SELECT * FROM dedup WHERE rn = 1
    """

# 1) Terminal ranking (total tokens in window)
@router.get("/terminal_ranking")
def terminal_ranking(start_iso: str, end_iso: str,
                     move_type: Optional[str] = None, desig: Optional[str] = None):
    start_dt, end_dt = _time_bounds(start_iso, end_iso)
    
    # Build additional filters for the base CTE
    additional_filters = []
    params = [start_dt, end_dt]
    
    mt = norm_move_type(move_type)
    if mt: 
        additional_filters.append('AND UPPER(TRIM("MoveType")) = ?')
        params.append(mt)
    
    dg = norm_desig(desig)
    if dg: 
        additional_filters.append('AND UPPER(TRIM("Desig")) = ?')
        params.append(dg)
    
    terminal_filters = " ".join(additional_filters)
    base_cte = _get_deduped_base_cte(start_dt, end_dt, terminal_filters)
    
    q = f"""
    {base_cte}
    SELECT "TerminalID", SUM(pred) AS total_pred
    FROM dedup
    GROUP BY 1
    ORDER BY 2 DESC
    """

    rows=[]
    with get_conn() as conn:
        cur=conn.cursor(); cur.execute(q, params)
        for t, s in cur.iterate(): rows.append({"terminal": t, "total_pred": float(s or 0.0)})
    return {"ranking": rows}

# 2) MoveType share (IN vs OUT, total over window)
@router.get("/movetype_share")
def movetype_share(start_iso: str, end_iso: str,
                   terminal_id: Optional[str] = None, desig: Optional[str] = None):
    start_dt, end_dt = _time_bounds(start_iso, end_iso)
    
    # Build additional filters for the base CTE
    additional_filters = []
    params = [start_dt, end_dt]
    
    if terminal_id and terminal_id.upper() not in {"ALL", ""}:
        additional_filters.append('AND "TerminalID" = ?')
        params.append(terminal_id)
    
    dg = norm_desig(desig)
    if dg: 
        additional_filters.append('AND UPPER(TRIM("Desig")) = ?')
        params.append(dg)
    
    terminal_filters = " ".join(additional_filters)
    base_cte = _get_deduped_base_cte(start_dt, end_dt, terminal_filters)
    
    q = f"""
    {base_cte}
    SELECT "MoveType", SUM(pred) AS sum_pred
    FROM dedup
    GROUP BY 1
    """

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
    start_dt, end_dt = _time_bounds(start_iso, end_iso)
    
    # Build additional filters for the base CTE
    additional_filters = []
    params = [start_dt, end_dt]
    
    if terminal_id and terminal_id.upper() not in {"ALL", ""}:
        additional_filters.append('AND "TerminalID" = ?')
        params.append(terminal_id)
    
    dg = norm_desig(desig)
    if dg: 
        additional_filters.append('AND UPPER(TRIM("Desig")) = ?')
        params.append(dg)
    
    terminal_filters = " ".join(additional_filters)
    base_cte = _get_deduped_base_cte(start_dt, end_dt, terminal_filters)
    
    q = f"""
    {base_cte}
    SELECT "MoveDate_pred", "MoveHour_pred", "MoveType", SUM(pred) AS sum_pred
    FROM dedup
    GROUP BY 1,2,3
    ORDER BY 1,2
    """
    
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
    start_dt, end_dt = _time_bounds(start_iso, end_iso)
    
    # Build additional filters for the base CTE
    additional_filters = []
    params = [start_dt, end_dt]
    
    if terminal_id and terminal_id.upper() not in {"ALL", ""}:
        additional_filters.append('AND "TerminalID" = ?')
        params.append(terminal_id)
    
    mt = norm_move_type(move_type)
    if mt: 
        additional_filters.append('AND UPPER(TRIM("MoveType")) = ?')
        params.append(mt)
    
    terminal_filters = " ".join(additional_filters)
    base_cte = _get_deduped_base_cte(start_dt, end_dt, terminal_filters)
    
    q = f"""
    {base_cte}
    SELECT "MoveDate_pred", "MoveHour_pred", "Desig", SUM(pred) AS sum_pred
    FROM dedup
    GROUP BY 1,2,3
    ORDER BY 1,2
    """
    
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
    start_dt, end_dt = _time_bounds(start_iso, end_iso)
    
    # Build additional filters for the base CTE
    additional_filters = []
    params = [start_dt, end_dt]
    
    mt = norm_move_type(move_type)
    if mt: 
        additional_filters.append('AND UPPER(TRIM("MoveType")) = ?')
        params.append(mt)
    
    dg = norm_desig(desig)
    if dg: 
        additional_filters.append('AND UPPER(TRIM("Desig")) = ?')
        params.append(dg)
    
    terminal_filters = " ".join(additional_filters)
    base_cte = _get_deduped_base_cte(start_dt, end_dt, terminal_filters)
    
    q = f"""
    {base_cte}
    SELECT "TerminalID", "MoveHour_pred", SUM(pred) AS sum_pred
    FROM dedup
    GROUP BY 1,2
    ORDER BY 1,2
    """
    
    rows=[]
    with get_conn() as conn:
        cur=conn.cursor(); cur.execute(q, params)
        for t, h, s in cur.iterate():
            rows.append({"terminal": t, "hour": int(h), "pred": float(s or 0.0)})
    return {"cells": rows}

# --- SUNBURST: Terminal -> MoveType -> Desig -------------------------------
@router.get("/sunburst")
def sunburst(
    start_iso: str,
    end_iso: str,
    terminal_id: Optional[str] = None,    # "ALL" or specific - "ALL" treated as no filter
    move_type: Optional[str] = None,       # "ALL" | IN | OUT - "ALL" treated as no filter
    desig: Optional[str] = None            # "ALL" | EMPTY | FULL | EXP - "ALL" treated as no filter
):
    """
    Returns hierarchical totals of TokenCount_pred for the window:
      [{ name: TerminalID, value: sum, children: [
           { name: MoveType, value: sum, children: [
              { name: Desig, value: sum }
           ]}
      ]}]
    
    Performance Notes:
    - Uses deduplication CTE to avoid double counting multiple model runs
    - Uses timestamp-based filtering for time-zone safety
    - Query scans only the window and groups by 3 columns - optimized for Vertica
    
    Data Handling:
    - "ALL" parameters are treated as no filter (backend strips them)
    - Unknown/blank desig values are mapped to 'UNK' to prevent dropped rows
    - Children are sorted descending by value for clean visualization
    - Values represent sum of TokenCount_pred over the selected window
    """
    start_dt, end_dt = _time_bounds(start_iso, end_iso)
    
    # Build additional filters for the base CTE
    additional_filters = []
    params = [start_dt, end_dt]
    
    if terminal_id and terminal_id.upper() not in {"ALL", ""}:
        additional_filters.append('AND "TerminalID" = ?')
        params.append(terminal_id)
    
    mt = norm_move_type(move_type)
    if mt: 
        additional_filters.append('AND UPPER(TRIM("MoveType")) = ?')
        params.append(mt)
    
    dg = norm_desig(desig)
    if dg: 
        additional_filters.append('AND UPPER(TRIM("Desig")) = ?')
        params.append(dg)
    
    terminal_filters = " ".join(additional_filters)
    # Modify the base CTE to handle UNK mapping for desig
    base_cte_with_unk = f"""
    WITH base AS (
      SELECT
        "TerminalID",
        UPPER(TRIM("MoveType")) AS "MoveType",
        UPPER(TRIM(COALESCE(NULLIF("Desig", ''), 'UNK'))) AS "Desig", 
        "MoveDate_pred",
        "MoveHour_pred",
        TIMESTAMPADD(hour, "MoveHour_pred", CAST("MoveDate_pred" AS TIMESTAMP)) AS ts_pred,
        "TokenCount_pred"::FLOAT AS pred,
        "updated_at"
      FROM {settings.VERTICA_TABLE_TOKENS}
      WHERE TIMESTAMPADD(hour, "MoveHour_pred", CAST("MoveDate_pred" AS TIMESTAMP)) BETWEEN ? AND ?
        {terminal_filters}
    ),
    dedup AS (
      SELECT
        b.*,
        ROW_NUMBER() OVER (
          PARTITION BY "TerminalID", "MoveType", "Desig", "MoveDate_pred", "MoveHour_pred"
          ORDER BY "updated_at" DESC
        ) AS rn
      FROM base b
    )
    SELECT * FROM dedup WHERE rn = 1
    """
    
    q = f"""
    {base_cte_with_unk}
    SELECT "TerminalID", "MoveType", "Desig", SUM(pred) AS sum_pred
    FROM dedup
    GROUP BY 1,2,3
    """

    # Build hierarchy in Python
    tree: Dict[str, Dict[str, Dict[str, float]]] = {}
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(q, params)
        for t, mt, dg, s in cur.iterate():
            t = str(t)
            mt = str(mt).upper()
            dg = str(dg).upper()
            tree.setdefault(t, {}).setdefault(mt, {}).setdefault(dg, 0.0)
            tree[t][mt][dg] += float(s or 0.0)

    # Convert to [{name, value, children:[...]}] sorted by value desc
    def to_nodes(d: Dict[str, Dict[str, Dict[str, float]]]):
        nodes = []
        for t, mts in d.items():
            mt_nodes = []
            t_total = 0.0
            for mt, dgs in mts.items():
                dg_nodes = [{"name": dg, "value": round(val, 2)} for dg, val in dgs.items()]
                dg_nodes.sort(key=lambda x: x["value"], reverse=True)
                mt_sum = round(sum(x["value"] for x in dg_nodes), 2)
                t_total += mt_sum
                mt_nodes.append({"name": mt, "value": mt_sum, "children": dg_nodes})
            mt_nodes.sort(key=lambda x: x["value"], reverse=True)
            nodes.append({"name": t, "value": round(t_total, 2), "children": mt_nodes})
        nodes.sort(key=lambda x: x["value"], reverse=True)
        return nodes

    return {"sunburst": to_nodes(tree)}

# --- Composition by terminal (percent) --------------------------------------
@router.get("/composition_by_terminal")
def composition_by_terminal(
    start_iso: str,
    end_iso: str,
    dim: str = "desig",                 # "desig" | "movetype"
    terminal_id: Optional[str] = None,  # "ALL" or specific
    move_type: Optional[str] = None,    # overall filter
    desig: Optional[str] = None         # overall filter
):
    """
    Returns totals by TerminalID x (dim) within the window.
    dim = 'desig'  -> keys: EMPTY/FULL/EXP (or UNK)
    dim = 'movetype' -> keys: IN/OUT
    Client can normalize to 100% (recommended).
    """
    start_dt, end_dt = _time_bounds(start_iso, end_iso)
    
    # Build additional filters for the base CTE
    additional_filters = []
    params = [start_dt, end_dt]
    
    if terminal_id and terminal_id.upper() not in {"ALL", ""}:
        additional_filters.append('AND "TerminalID" = ?')
        params.append(terminal_id)
    
    mt = norm_move_type(move_type)
    if mt: 
        additional_filters.append('AND UPPER(TRIM("MoveType")) = ?')
        params.append(mt)
    
    dg = norm_desig(desig)
    if dg: 
        additional_filters.append('AND UPPER(TRIM("Desig")) = ?')
        params.append(dg)
    
    terminal_filters = " ".join(additional_filters)
    
    dim = dim.lower()
    if dim not in ("desig", "movetype"):
        dim = "desig"

    # Modify the base CTE based on dimension
    if dim == "desig":
        base_cte_with_dim = f"""
        WITH base AS (
          SELECT
            "TerminalID",
            UPPER(TRIM("MoveType")) AS "MoveType",
            UPPER(TRIM(COALESCE(NULLIF("Desig", ''), 'UNK'))) AS K, 
            "MoveDate_pred",
            "MoveHour_pred",
            TIMESTAMPADD(hour, "MoveHour_pred", CAST("MoveDate_pred" AS TIMESTAMP)) AS ts_pred,
            "TokenCount_pred"::FLOAT AS pred,
            "updated_at"
          FROM {settings.VERTICA_TABLE_TOKENS}
          WHERE TIMESTAMPADD(hour, "MoveHour_pred", CAST("MoveDate_pred" AS TIMESTAMP)) BETWEEN ? AND ?
            {terminal_filters}
        ),
        dedup AS (
          SELECT
            b.*,
            ROW_NUMBER() OVER (
              PARTITION BY "TerminalID", "MoveType", K, "MoveDate_pred", "MoveHour_pred"
              ORDER BY "updated_at" DESC
            ) AS rn
          FROM base b
        )
        SELECT * FROM dedup WHERE rn = 1
        """
    else:  # movetype
        base_cte_with_dim = f"""
        WITH base AS (
          SELECT
            "TerminalID",
            UPPER(TRIM("MoveType")) AS K,
            UPPER(TRIM("Desig")) AS "Desig", 
            "MoveDate_pred",
            "MoveHour_pred",
            TIMESTAMPADD(hour, "MoveHour_pred", CAST("MoveDate_pred" AS TIMESTAMP)) AS ts_pred,
            "TokenCount_pred"::FLOAT AS pred,
            "updated_at"
          FROM {settings.VERTICA_TABLE_TOKENS}
          WHERE TIMESTAMPADD(hour, "MoveHour_pred", CAST("MoveDate_pred" AS TIMESTAMP)) BETWEEN ? AND ?
            {terminal_filters}
        ),
        dedup AS (
          SELECT
            b.*,
            ROW_NUMBER() OVER (
              PARTITION BY "TerminalID", K, "Desig", "MoveDate_pred", "MoveHour_pred"
              ORDER BY "updated_at" DESC
            ) AS rn
          FROM base b
        )
        SELECT * FROM dedup WHERE rn = 1
        """

    q = f"""
    {base_cte_with_dim}
    SELECT "TerminalID", K, SUM(pred) AS sum_pred
    FROM dedup
    GROUP BY 1,2
    ORDER BY 1,2
    """

    rows = []
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(q, params)
        for t, k, s in cur.iterate():
            rows.append({"terminal": str(t), "key": str(k).upper(), "pred": float(s or 0.0)})

    return {"dim": dim, "rows": rows}
