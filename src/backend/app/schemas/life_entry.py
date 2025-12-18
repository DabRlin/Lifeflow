from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


class LifeEntryCreate(BaseModel):
    content: str = Field(..., min_length=1, description="Entry content")

    @field_validator("content")
    @classmethod
    def content_not_whitespace(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Content cannot be empty or whitespace only")
        return v


class LifeEntryUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, description="Entry content")

    @field_validator("content")
    @classmethod
    def content_not_whitespace(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Content cannot be empty or whitespace only")
        return v


class LifeEntryResponse(BaseModel):
    id: str
    content: str
    created_at: datetime
    updated_at: datetime
    is_deleted: bool

    class Config:
        from_attributes = True


class LifeEntryPaginatedResponse(BaseModel):
    """Paginated response for life entries."""
    items: List[LifeEntryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class DateGroupedEntries(BaseModel):
    """Life entries grouped by date."""
    date: date
    entries: List[LifeEntryResponse]


class LifeEntryGroupedResponse(BaseModel):
    """Response with life entries grouped by date."""
    groups: List[DateGroupedEntries]
    total: int
    page: int
    page_size: int
    total_pages: int
