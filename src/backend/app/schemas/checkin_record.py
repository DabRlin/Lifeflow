from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field


class CheckinRequest(BaseModel):
    """Request body for check-in endpoint."""
    timezone_offset: Optional[int] = Field(
        default=0,
        description="Timezone offset in minutes from UTC (e.g., -480 for UTC+8, 300 for UTC-5)"
    )


class CheckinRecordCreate(BaseModel):
    task_id: str


class CheckinRecordResponse(BaseModel):
    id: str
    task_id: str
    checkin_date: date
    checkin_time: datetime

    class Config:
        from_attributes = True
