from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CardListCreate(BaseModel):
    name: str = Field(..., min_length=1, description="List name")
    color: str = Field(default="#3B82F6", description="List color in hex format")
    sort_order: int = Field(default=0, description="Sort order for display")


class CardListUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, description="List name")
    color: Optional[str] = Field(None, description="List color in hex format")
    sort_order: Optional[int] = Field(None, description="Sort order for display")


class CardListResponse(BaseModel):
    id: str
    name: str
    color: str
    sort_order: int
    created_at: datetime

    class Config:
        from_attributes = True
