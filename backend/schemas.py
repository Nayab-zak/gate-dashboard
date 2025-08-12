from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, date

class ForecastPoint(BaseModel):
    ts: datetime                 # localized to Asia/Dubai in API
    move_type: str               # IN / OUT
    desig: str                   # EMPTY / FULL / EXP
    terminal_id: str
    pred: float = Field(..., ge=0)
    actual: Optional[float] = None
    lower: Optional[float] = None  # 95% PI if you have it; else None
    upper: Optional[float] = None

class Next8HResponse(BaseModel):
    horizon_hours: List[ForecastPoint]
    generated_at: datetime
    updated_at: datetime
    capacity_per_hour: int

class FreshnessResponse(BaseModel):
    updated_at: datetime
    row_count_last_24h: int

class CapacityGetResponse(BaseModel):
    terminal_id: str
    capacity_per_hour: int
    updated_at: datetime

class CapacityPutRequest(BaseModel):
    terminal_id: str
    capacity_per_hour: int
