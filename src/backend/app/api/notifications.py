import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.database import get_db
from app.models.notification import Notification
from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
    NotificationListResponse,
    UnreadCountResponse,
)
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get("", response_model=NotificationListResponse)
async def get_notifications(
    limit: int = 50,
    offset: int = 0,
    unread_only: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """获取通知列表，按创建时间降序排列"""
    query = select(Notification).order_by(desc(Notification.created_at))
    
    if unread_only:
        query = query.where(Notification.is_read == False)
    
    query = query.limit(limit).offset(offset)
    
    result = await db.execute(query)
    notifications = result.scalars().all()
    
    # 获取总数
    total_query = select(func.count(Notification.id))
    total_result = await db.execute(total_query)
    total = total_result.scalar() or 0
    
    # 获取未读数
    unread_query = select(func.count(Notification.id)).where(Notification.is_read == False)
    unread_result = await db.execute(unread_query)
    unread_count = unread_result.scalar() or 0
    
    return NotificationListResponse(
        notifications=[NotificationResponse.model_validate(n) for n in notifications],
        total=total,
        unread_count=unread_count
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(db: AsyncSession = Depends(get_db)):
    """获取未读通知数量"""
    query = select(func.count(Notification.id)).where(Notification.is_read == False)
    result = await db.execute(query)
    count = result.scalar() or 0
    return UnreadCountResponse(count=count)


@router.post("", response_model=NotificationResponse)
async def create_notification(
    notification: NotificationCreate,
    db: AsyncSession = Depends(get_db)
):
    """创建新通知（内部使用）"""
    new_notification = Notification(
        id=str(uuid.uuid4()),
        type=notification.type,
        title=notification.title,
        message=notification.message,
        data=notification.data,
        is_read=False,
        created_at=datetime.utcnow(),
        user_id="default"
    )
    db.add(new_notification)
    await db.commit()
    await db.refresh(new_notification)
    return NotificationResponse.model_validate(new_notification)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_as_read(
    notification_id: str,
    db: AsyncSession = Depends(get_db)
):
    """标记通知为已读"""
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id)
    )
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    await db.commit()
    await db.refresh(notification)
    return NotificationResponse.model_validate(notification)


@router.post("/read-all")
async def mark_all_as_read(db: AsyncSession = Depends(get_db)):
    """标记所有通知为已读"""
    from sqlalchemy import update
    
    # 使用批量更新，比逐个更新更高效
    result = await db.execute(
        update(Notification)
        .where(Notification.is_read == False)
        .values(is_read=True)
    )
    await db.commit()
    
    return {"message": "All notifications marked as read", "count": result.rowcount}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    db: AsyncSession = Depends(get_db)
):
    """删除通知"""
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id)
    )
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    await db.delete(notification)
    await db.commit()
    return {"message": "Notification deleted"}


@router.post("/generate-reminders", response_model=List[NotificationResponse])
async def generate_habit_reminders(db: AsyncSession = Depends(get_db)):
    """生成今日习惯提醒通知"""
    service = NotificationService(db)
    notifications = await service.generate_habit_reminders()
    return [NotificationResponse.model_validate(n) for n in notifications]


@router.post("/generate-at-risk", response_model=List[NotificationResponse])
async def generate_at_risk_notifications(db: AsyncSession = Depends(get_db)):
    """生成连续打卡风险提醒"""
    service = NotificationService(db)
    notifications = await service.generate_at_risk_notifications()
    return [NotificationResponse.model_validate(n) for n in notifications]
