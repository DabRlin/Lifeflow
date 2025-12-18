from datetime import datetime
from typing import Optional, Dict, Any, List, Literal
from pydantic import BaseModel, Field


NotificationType = Literal['habit_reminder', 'achievement', 'daily_complete', 'system']


class NotificationCreate(BaseModel):
    """创建通知的请求体"""
    type: NotificationType = Field(..., description="通知类型")
    title: str = Field(..., min_length=1, max_length=100, description="通知标题")
    message: str = Field(default="", max_length=500, description="通知内容")
    data: Optional[Dict[str, Any]] = Field(default=None, description="额外数据")


class NotificationResponse(BaseModel):
    """通知响应"""
    id: str
    type: NotificationType
    title: str
    message: str
    data: Optional[Dict[str, Any]]
    is_read: bool
    created_at: datetime
    user_id: str

    model_config = {"from_attributes": True}


class NotificationListResponse(BaseModel):
    """通知列表响应"""
    notifications: List[NotificationResponse]
    total: int
    unread_count: int


class UnreadCountResponse(BaseModel):
    """未读数量响应"""
    count: int
