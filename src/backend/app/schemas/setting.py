from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class SettingUpdate(BaseModel):
    value: str = Field(..., description="Setting value")


class SettingResponse(BaseModel):
    key: str
    value: Optional[str]
    updated_at: datetime

    class Config:
        from_attributes = True


class SettingsResponse(BaseModel):
    settings: Dict[str, Any]
