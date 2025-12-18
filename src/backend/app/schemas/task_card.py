from datetime import datetime, date, timezone
from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator


# Sentinel value to indicate reminder should be cleared
CLEAR_REMINDER = "CLEAR"


def validate_reminder_time(v: Optional[datetime]) -> Optional[datetime]:
    """
    Validate reminder time.
    - Must be a valid datetime if provided
    - Must not be in the past (with 1 minute tolerance for clock skew)
    """
    if v is None:
        return v
    
    # Ensure timezone-aware comparison
    now = datetime.now(timezone.utc)
    reminder_utc = v if v.tzinfo else v.replace(tzinfo=timezone.utc)
    
    # Allow 1 minute tolerance for clock skew
    from datetime import timedelta
    if reminder_utc < now - timedelta(minutes=1):
        raise ValueError("Reminder time cannot be in the past")
    
    return v


class TaskCardCreate(BaseModel):
    title: str = Field(..., min_length=1, description="Task title")
    content: str = Field(default="", description="Markdown content")
    list_id: Optional[str] = Field(None, description="Parent list ID")
    is_habit: bool = Field(default=False, description="Whether this is a habit task")
    reminder_time: Optional[datetime] = Field(None, description="Reminder time in ISO 8601 format")

    @field_validator("title")
    @classmethod
    def title_not_whitespace(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title cannot be empty or whitespace only")
        return v

    @field_validator("reminder_time")
    @classmethod
    def validate_reminder(cls, v: Optional[datetime]) -> Optional[datetime]:
        return validate_reminder_time(v)


class TaskCardUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, description="Task title")
    content: Optional[str] = Field(None, description="Markdown content")
    list_id: Optional[str] = Field(None, description="Parent list ID")
    is_habit: Optional[bool] = Field(None, description="Whether this is a habit task")
    reminder_time: Optional[datetime] = Field(None, description="Reminder time in ISO 8601 format")
    clear_reminder: bool = Field(default=False, description="Set to true to clear the reminder time")

    @field_validator("title")
    @classmethod
    def title_not_whitespace(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Title cannot be empty or whitespace only")
        return v

    @field_validator("reminder_time")
    @classmethod
    def validate_reminder(cls, v: Optional[datetime]) -> Optional[datetime]:
        return validate_reminder_time(v)


class TaskCardResponse(BaseModel):
    id: str
    title: str
    content: str
    list_id: Optional[str]
    is_habit: bool
    reminder_time: Optional[datetime]
    current_streak: int
    longest_streak: int
    last_checkin_date: Optional[date]
    created_at: datetime
    updated_at: datetime
    is_deleted: bool

    class Config:
        from_attributes = True
