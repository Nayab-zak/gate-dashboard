# server/app/routers/capacity.py
from fastapi import APIRouter
from datetime import datetime
from backend.schemas import CapacityGetResponse, CapacityPutRequest
from backend.config import settings
from backend.utils.timebox import now_local

router = APIRouter(prefix="/capacity", tags=["capacity"])
_CAPACITY = {}  # in-memory; replace with DB table later

@router.get("", response_model=CapacityGetResponse)
def get_capacity(terminal_id: str):
    cap = _CAPACITY.get(terminal_id, settings.DEFAULT_CAPACITY_PER_HOUR)
    return CapacityGetResponse(terminal_id=terminal_id, capacity_per_hour=cap, updated_at=now_local())

@router.put("", response_model=CapacityGetResponse)
def put_capacity(payload: CapacityPutRequest):
    _CAPACITY[payload.terminal_id] = payload.capacity_per_hour
    return CapacityGetResponse(terminal_id=payload.terminal_id, capacity_per_hour=payload.capacity_per_hour, updated_at=now_local())
# Note: This is a simple in-memory store; replace with persistent storage in production
# For example, you could use a Vertica table to store terminal capacities
# and update the `get_capacity` and `put_capacity` methods to query that table.
# This would allow you to maintain capacity data across server restarts and scale better.