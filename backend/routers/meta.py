# server/app/routers/meta.py
from fastapi import APIRouter
from backend.db import get_conn
from backend.config import settings
from backend.schemas import FreshnessResponse
from backend.utils.timebox import now_local
from datetime import date

router = APIRouter(prefix="/meta", tags=["meta"])

@router.get("/freshness", response_model=FreshnessResponse)
def freshness():
    q = f"""
    SELECT MAX(updated_at), COUNT(*)
    FROM {settings.VERTICA_TABLE_TOKENS}
    WHERE "MoveDate_pred" >= CURRENT_DATE - INTERVAL '1 day'
    """
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(q)
        max_upd, cnt = cur.fetchone()
    return FreshnessResponse(updated_at=max_upd or now_local(), row_count_last_24h=int(cnt or 0))

@router.get("/enums")
def enums():
    from backend.config import settings
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(f"SELECT DISTINCT TerminalID FROM {settings.VERTICA_TABLE_TOKENS} ORDER BY 1")
        terminals = [r[0] for r in cur.fetchall()]
    return {
        "terminals": terminals,                    # e.g., ["T1","T2","T3","T4"]
        "move_types": ["ALL","IN","OUT"],
        "desigs": ["ALL","EMPTY","FULL","EXP"],
    }
