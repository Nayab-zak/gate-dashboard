from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from datetime import datetime
import zoneinfo
import logging

from ..db import get_conn
from ..config import settings
from .forecast import norm_move_type, norm_desig  # reuse normalizers

# Configure logger for data quality monitoring
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["analytics"])
TZ = zoneinfo.ZoneInfo(settings.DEFAULT_TIMEZONE)

# Data Quality Controls
def validate_prediction(pred: float, context: str = "") -> float:
    """
    Validate and normalize prediction values.
    - Ensures pred >= 0 (clamps negative values to 0 and logs)
    - Returns rounded value for consistency
    """
    if pred is None:
        return 0.0
    
    original_pred = pred
    pred = float(pred)
    
    # Check for negative predictions
    if pred < 0:
        logger.warning(f"Negative prediction detected: {original_pred} in {context}. Clamping to 0.")
        pred = 0.0
    
    # Apply consistent rounding policy (1 decimal place)
    return round(pred, 1)

def normalize_move_type(move_type: str, context: str = "") -> str:
    """
    Normalize MoveType to {IN, OUT} only.
    Maps common variants and logs anomalies.
    """
    if not move_type:
        return "UNK"
    
    original = move_type
    mt = str(move_type).upper().strip()
    
    # Standard mapping
    if mt in {"IN", "INBOUND", "I", "IMPORT", "ENTRY"}:
        if mt != "IN":
            logger.info(f"Normalized MoveType '{original}' -> 'IN' in {context}")
        return "IN"
    elif mt in {"OUT", "OUTBOUND", "O", "EXPORT", "EXIT"}:
        if mt != "OUT":
            logger.info(f"Normalized MoveType '{original}' -> 'OUT' in {context}")
        return "OUT"
    else:
        logger.warning(f"Unknown MoveType '{original}' in {context}. Mapping to 'UNK'")
        return "UNK"

def normalize_designation(desig: str, context: str = "") -> str:
    """
    Normalize Desig to {EMPTY, FULL, EXP} only.
    Maps common variants and logs anomalies.
    """
    if not desig:
        return "UNK"
    
    original = desig
    dg = str(desig).upper().strip()
    
    # Standard mapping
    if dg in {"EMPTY", "E", "MT", "BLANK"}:
        if dg != "EMPTY":
            logger.info(f"Normalized Desig '{original}' -> 'EMPTY' in {context}")
        return "EMPTY"
    elif dg in {"FULL", "F", "LADEN", "LOADED"}:
        if dg != "FULL":
            logger.info(f"Normalized Desig '{original}' -> 'FULL' in {context}")
        return "FULL"
    elif dg in {"EXP", "EXPORT", "X"}:
        if dg != "EXP":
            logger.info(f"Normalized Desig '{original}' -> 'EXP' in {context}")
        return "EXP"
    else:
        logger.warning(f"Unknown Desig '{original}' in {context}. Mapping to 'UNK'")
        return "UNK"

def get_metadata() -> Dict[str, Any]:
    """
    Return consistent metadata for all responses.
    """
    now = datetime.now(TZ)
    return {
        "tz": str(TZ),
        "as_of": now.isoformat(),
        "data_quality": {
            "negative_pred_policy": "clamp_to_zero",
            "rounding_policy": "1_decimal_place",
            "move_type_normalization": "IN|OUT|UNK",
            "desig_normalization": "EMPTY|FULL|EXP|UNK"
        }
    }

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
    
    Data Quality Features:
    - Clamps negative predictions to 0
    - Normalizes MoveType to {IN, OUT, UNK}
    - Normalizes Desig to {EMPTY, FULL, EXP, UNK}
    - Deduplicates by latest updated_at
    
    NOTE: This returns just the CTE definition, not a complete query.
    """
    return f"""
    WITH base AS (
      SELECT
        "TerminalID",
        CASE 
          WHEN UPPER(TRIM("MoveType")) IN ('IN', 'INBOUND', 'I', 'IMPORT', 'ENTRY') THEN 'IN'
          WHEN UPPER(TRIM("MoveType")) IN ('OUT', 'OUTBOUND', 'O', 'EXPORT', 'EXIT') THEN 'OUT'
          ELSE 'UNK'
        END AS "MoveType",
        CASE 
          WHEN UPPER(TRIM("Desig")) IN ('EMPTY', 'E', 'MT', 'BLANK') THEN 'EMPTY'
          WHEN UPPER(TRIM("Desig")) IN ('FULL', 'F', 'LADEN', 'LOADED') THEN 'FULL'
          WHEN UPPER(TRIM("Desig")) IN ('EXP', 'EXPORT', 'X') THEN 'EXP'
          ELSE 'UNK'
        END AS "Desig",
        "MoveDate_pred",
        "MoveHour_pred",
        TIMESTAMPADD(hour, "MoveHour_pred", CAST("MoveDate_pred" AS TIMESTAMP)) AS ts_pred,
        GREATEST(0.0, "TokenCount_pred"::FLOAT) AS pred,  -- Clamp negative to 0
        "updated_at"
      FROM {settings.VERTICA_TABLE_TOKENS}
      WHERE TIMESTAMPADD(hour, "MoveHour_pred", CAST("MoveDate_pred" AS TIMESTAMP)) >= ? 
        AND TIMESTAMPADD(hour, "MoveHour_pred", CAST("MoveDate_pred" AS TIMESTAMP)) < ?
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
    )"""

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
        additional_filters.append('AND "MoveType" = ?')
        params.append(mt)
    
    dg = norm_desig(desig)
    if dg: 
        additional_filters.append('AND "Desig" = ?')
        params.append(dg)
    
    terminal_filters = " ".join(additional_filters)
    base_cte = _get_deduped_base_cte(start_dt, end_dt, terminal_filters)
    
    q = f"""
    {base_cte}
    SELECT "TerminalID", SUM(pred) AS total_pred
    FROM dedup
    WHERE rn = 1
    GROUP BY 1
    ORDER BY 2 DESC
    """

    rows = []
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(q, params)
        for t, s in cur.iterate():
            pred_validated = validate_prediction(s, f"terminal_ranking:{t}")
            rows.append({"terminal": t, "total_pred": pred_validated})
    
    return {
        "ranking": rows,
        "meta": get_metadata()
    }

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
        additional_filters.append('AND "Desig" = ?')
        params.append(dg)
    
    terminal_filters = " ".join(additional_filters)
    base_cte = _get_deduped_base_cte(start_dt, end_dt, terminal_filters)
    
    q = f"""
    {base_cte}
    SELECT "MoveType", SUM(pred) AS pred
    FROM dedup
    WHERE rn = 1
    GROUP BY 1
    """

    out = {"IN": 0.0, "OUT": 0.0}
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(q, params)
        for mt, s in cur.iterate():
            validated_pred = validate_prediction(s, f"movetype_share:{mt}")
            if mt in out: 
                out[mt] = validated_pred
    
    return {
        "share": out,
        "meta": get_metadata()
    }

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
        additional_filters.append('AND "Desig" = ?')
        params.append(dg)
    
    terminal_filters = " ".join(additional_filters)
    base_cte = _get_deduped_base_cte(start_dt, end_dt, terminal_filters)
    
    q = f"""
    {base_cte}
    SELECT "MoveDate_pred", "MoveHour_pred", "MoveType", SUM(pred) AS pred
    FROM dedup
    WHERE rn = 1
    GROUP BY 1,2,3
    ORDER BY 1,2
    """
    
    rows = []
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(q, params)
        for d, h, mt, s in cur.iterate():
            validated_pred = validate_prediction(s, f"movetype_hourly:{mt}:{d}:{h}")
            rows.append({
                "date": str(d), 
                "hour": int(h), 
                "move_type": str(mt).lower(), 
                "pred": validated_pred
            })
    
    return {
        "points": rows,
        "meta": get_metadata()
    }

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
        additional_filters.append('AND "MoveType" = ?')
        params.append(mt)
    
    terminal_filters = " ".join(additional_filters)
    base_cte = _get_deduped_base_cte(start_dt, end_dt, terminal_filters)
    
    q = f"""
    {base_cte}
    SELECT "MoveDate_pred", "MoveHour_pred", "Desig", SUM(pred) AS pred
    FROM dedup
    WHERE rn = 1
    GROUP BY 1,2,3
    ORDER BY 1,2
    """
    
    rows = []
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(q, params)
        for d, h, dg, s in cur.iterate():
            validated_pred = validate_prediction(s, f"desig_hourly:{dg}:{d}:{h}")
            rows.append({
                "date": str(d), 
                "hour": int(h), 
                "desig": str(dg).lower(), 
                "pred": validated_pred
            })
    
    return {
        "points": rows,
        "meta": get_metadata()
    }

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
        additional_filters.append('AND "MoveType" = ?')
        params.append(mt)
    
    dg = norm_desig(desig)
    if dg: 
        additional_filters.append('AND "Desig" = ?')
        params.append(dg)
    
    terminal_filters = " ".join(additional_filters)
    base_cte = _get_deduped_base_cte(start_dt, end_dt, terminal_filters)
    
    q = f"""
    {base_cte}
    SELECT "TerminalID", "MoveHour_pred", SUM(pred) AS pred
    FROM dedup
    WHERE rn = 1
    GROUP BY 1,2
    ORDER BY 1,2
    """
    
    rows = []
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(q, params)
        for t, h, s in cur.iterate():
            validated_pred = validate_prediction(s, f"terminal_hour_heatmap:{t}:{h}")
            rows.append({"terminal": str(t), "hour": int(h), "pred": validated_pred})
    
    return {
        "cells": rows,
        "meta": get_metadata()
    }

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
    base_cte = _get_deduped_base_cte(start_dt, end_dt, terminal_filters)
    
    q = f"""
    {base_cte}
    SELECT "TerminalID", "MoveType", "Desig", SUM(pred) AS pred
    FROM dedup
    WHERE rn = 1
    GROUP BY 1,2,3
    """

    # Build hierarchy in Python
    tree: Dict[str, Dict[str, Dict[str, float]]] = {}
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(q, params)
        for t, mt, dg, s in cur.iterate():
            t = str(t)
            mt = str(mt).lower()
            dg = str(dg).lower()
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
        additional_filters.append('AND "MoveType" = ?')
        params.append(mt)
    
    dg = norm_desig(desig)
    if dg: 
        additional_filters.append('AND "Desig" = ?')
        params.append(dg)
    
    terminal_filters = " ".join(additional_filters)
    base_cte = _get_deduped_base_cte(start_dt, end_dt, terminal_filters)
    
    dim = dim.lower()
    if dim not in ("desig", "movetype"):
        dim = "desig"

    # Select the appropriate dimension
    if dim == "desig":
        q = f"""
        {base_cte}
        SELECT "TerminalID", "Desig" AS K, SUM(pred) AS pred
        FROM dedup
        WHERE rn = 1
        GROUP BY 1,2
        ORDER BY 1,2
        """
    else:  # movetype
        q = f"""
        {base_cte}
        SELECT "TerminalID", "MoveType" AS K, SUM(pred) AS pred
        FROM dedup
        WHERE rn = 1
        GROUP BY 1,2
        ORDER BY 1,2
        """

    rows = []
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(q, params)
        for t, k, s in cur.iterate():
            validated_pred = validate_prediction(s, f"composition_by_terminal:{dim}:{t}:{k}")
            rows.append({"terminal": str(t), "key": str(k).lower(), "pred": validated_pred})

    return {
        "dim": dim, 
        "rows": rows,
        "meta": get_metadata()
    }

# 8) Hourly totals (aggregated across MoveType/Desig for KPIs)
@router.get("/hourly_totals")
def hourly_totals(start_iso: str, end_iso: str,
                  terminal_id: Optional[str] = None):
    """
    Returns hourly totals aggregated across all MoveType and Desig combinations.
    This is the proper data source for KPIs like peak hour and total volume calculations
    that need single values per hour.
    
    Example output:
    {
      "points": [
        {"date": "2024-01-15", "hour": 8, "pred": 125.5},
        {"date": "2024-01-15", "hour": 9, "pred": 143.2},
        ...
      ]
    }
    """
    start_dt, end_dt = _time_bounds(start_iso, end_iso)
    
    # Build additional filters for the base CTE
    additional_filters = []
    params = [start_dt, end_dt]
    
    if terminal_id and terminal_id.upper() not in {"ALL", ""}:
        additional_filters.append('AND "TerminalID" = ?')
        params.append(terminal_id)
    
    terminal_filters = " ".join(additional_filters)
    base_cte = _get_deduped_base_cte(start_dt, end_dt, terminal_filters)
    
    q = f"""
    {base_cte}
    SELECT "MoveDate_pred", "MoveHour_pred", SUM(pred) AS pred
    FROM dedup
    WHERE rn = 1
    GROUP BY 1,2
    ORDER BY 1,2
    """
    
    rows = []
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(q, params)
        for d, h, s in cur.iterate():
            validated_pred = validate_prediction(s, f"hourly_totals:{d}:{h}")
            rows.append({"date": str(d), "hour": int(h), "pred": validated_pred})
    
    return {
        "points": rows,
        "meta": get_metadata()
    }

# 9) Total forecast volume (IN+OUT all designations for KPIs)
@router.get("/total_forecast_volume")
def total_forecast_volume(start_iso: str, end_iso: str,
                          terminal_id: Optional[str] = None,
                          move_type: Optional[str] = None,
                          desig: Optional[str] = None):
    """
    Returns total forecast volume (IN+OUT all designations) for the specified time window.
    This is the authoritative calculation for the "Total Forecast Volume" KPI.
    
    Includes:
    - Directions: IN + OUT (sum, not net) unless filtered
    - Designations: EMPTY/FULL/EXP (all included unless filtered) 
    - Scope: All hourly buckets in [start, end), zero-fill missing hours
    - Data hygiene: latest run only per (terminal, move_type, desig, date, hour)
    
    Returns:
    {
      "total_volume": 1093.5,          # Total IN+OUT volume
      "total_in": 560.2,               # Total IN volume  
      "total_out": 533.3,              # Total OUT volume
      "net_flow": 26.9,                # IN - OUT (positive = more IN)
      "window_hours": 8,               # Number of hours in window
      "breakdown": [                   # Hourly breakdown
        {"hour": 0, "total": 125.5, "in": 65.2, "out": 60.3},
        {"hour": 1, "total": 143.2, "in": 75.1, "out": 68.1},
        ...
      ]
    }
    """
    start_dt, end_dt = _time_bounds(start_iso, end_iso)
    
    # Build filters
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
    
    # Use the standardized base CTE with data quality controls
    base_cte = _get_deduped_base_cte(start_dt, end_dt, terminal_filters)
    
    # Main query for totals using the standardized CTE
    q = f"""
    {base_cte},
    hourly AS (
      SELECT "MoveHour_pred" AS hour,
             SUM(pred) AS pred_total,
             SUM(CASE WHEN "MoveType"='IN'  THEN pred ELSE 0 END) AS pred_in,
             SUM(CASE WHEN "MoveType"='OUT' THEN pred ELSE 0 END) AS pred_out
      FROM dedup
      WHERE rn = 1
      GROUP BY 1
      ORDER BY 1
    )
    SELECT
      SUM(pred_total) AS total_volume,
      SUM(pred_in) AS total_in,
      SUM(pred_out) AS total_out
    FROM hourly
    """
    
    # Execute main query for totals
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(q, params)
        result = cur.fetchone()
        
        if result:
            total_volume, total_in, total_out = result
            total_volume = validate_prediction(total_volume, "total_forecast_volume:total")
            total_in = validate_prediction(total_in, "total_forecast_volume:in")
            total_out = validate_prediction(total_out, "total_forecast_volume:out")
        else:
            total_volume = total_in = total_out = 0.0
    
    # Get hourly breakdown using same base CTE
    breakdown_q = f"""
    {base_cte}
    SELECT "MoveHour_pred" AS hour,
           SUM(pred) AS pred_total,
           SUM(CASE WHEN "MoveType"='IN'  THEN pred ELSE 0 END) AS pred_in,
           SUM(CASE WHEN "MoveType"='OUT' THEN pred ELSE 0 END) AS pred_out
    FROM dedup
    WHERE rn = 1
    GROUP BY 1
    ORDER BY 1
    """
    
    breakdown = []
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(breakdown_q, params)
        for hour, total, in_val, out_val in cur.iterate():
            breakdown.append({
                "hour": int(hour),
                "total": validate_prediction(total, f"total_forecast_volume:breakdown:{hour}:total"),
                "in": validate_prediction(in_val, f"total_forecast_volume:breakdown:{hour}:in"),
                "out": validate_prediction(out_val, f"total_forecast_volume:breakdown:{hour}:out")
            })
    
    # Calculate window hours
    window_hours = max(1, int((end_dt - start_dt).total_seconds() / 3600))
    net_flow = total_in - total_out
    
    return {
        "total_volume": total_volume,
        "total_in": total_in,
        "total_out": total_out, 
        "net_flow": round(net_flow, 1),
        "window_hours": window_hours,
        "breakdown": breakdown,
        "meta": get_metadata()
    }
