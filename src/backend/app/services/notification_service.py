"""
通知服务 - 处理习惯提醒、成就通知和每日完成通知的生成逻辑
"""
import uuid
from datetime import datetime, date
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.notification import Notification
from app.models.task_card import TaskCard


# 成就里程碑
ACHIEVEMENT_MILESTONES = [7, 14, 30, 60, 100]


class NotificationService:
    """通知服务类"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def generate_habit_reminders(self) -> List[Notification]:
        """
        生成今日习惯提醒通知
        为所有未完成且没有连续打卡记录的习惯生成提醒
        （有连续打卡记录的由 generate_at_risk_notifications 处理）
        """
        today = date.today()
        
        # 获取所有活跃的习惯（未删除且是习惯类型）
        result = await self.db.execute(
            select(TaskCard).where(
                and_(
                    TaskCard.is_habit == True,
                    TaskCard.is_deleted == False
                )
            )
        )
        habits = result.scalars().all()
        
        created_notifications = []
        
        for habit in habits:
            # 检查今天是否已打卡
            if habit.last_checkin_date == today:
                continue
            
            # 如果有连续打卡记录，跳过（由 at_risk 处理）
            if habit.current_streak > 0:
                continue
            
            # 检查是否已经为这个习惯生成过今日提醒
            existing = await self._check_existing_reminder(habit.id, today)
            if existing:
                continue
            
            # 生成提醒通知
            notification = await self._create_notification(
                notification_type='habit_reminder',
                title=f'习惯提醒: {habit.title}',
                message=f'别忘了完成今天的「{habit.title}」习惯打卡！',
                data={
                    'habit_id': habit.id,
                    'habit_title': habit.title,
                    'current_streak': habit.current_streak
                }
            )
            created_notifications.append(notification)
        
        return created_notifications
    
    async def generate_at_risk_notifications(self) -> List[Notification]:
        """
        生成连续打卡风险提醒
        为有连续打卡记录但今天未打卡的习惯生成警告
        """
        today = date.today()
        
        # 获取有连续打卡记录但今天未打卡的习惯
        result = await self.db.execute(
            select(TaskCard).where(
                and_(
                    TaskCard.is_habit == True,
                    TaskCard.is_deleted == False,
                    TaskCard.current_streak > 0,
                    TaskCard.last_checkin_date != today
                )
            )
        )
        habits = result.scalars().all()
        
        created_notifications = []
        
        for habit in habits:
            # 检查是否已经为这个习惯生成过今日风险提醒
            existing = await self._check_existing_at_risk(habit.id, today)
            if existing:
                continue
            
            notification = await self._create_notification(
                notification_type='habit_reminder',
                title=f'⚠️ 连续打卡即将中断',
                message=f'「{habit.title}」已连续打卡 {habit.current_streak} 天，今天还没打卡哦！',
                data={
                    'habit_id': habit.id,
                    'habit_title': habit.title,
                    'current_streak': habit.current_streak,
                    'at_risk': True
                }
            )
            created_notifications.append(notification)
        
        return created_notifications
    
    async def check_streak_achievement(
        self, 
        habit_id: str, 
        streak: int,
        habit_title: str
    ) -> Optional[Notification]:
        """
        检查并生成成就通知
        当习惯达到里程碑时生成成就通知
        """
        if streak not in ACHIEVEMENT_MILESTONES:
            return None
        
        # 检查是否已经为这个里程碑生成过通知
        existing = await self._check_existing_achievement(habit_id, streak)
        if existing:
            return None
        
        notification = await self._create_notification(
            notification_type='achievement',
            title=f'🎉 成就解锁！',
            message=f'恭喜！「{habit_title}」已连续打卡 {streak} 天！',
            data={
                'habit_id': habit_id,
                'habit_title': habit_title,
                'streak': streak,
                'milestone': streak
            }
        )
        
        return notification
    
    async def check_daily_complete(self) -> Optional[Notification]:
        """
        检查是否完成所有习惯并生成通知
        """
        today = date.today()
        
        # 获取所有活跃习惯
        result = await self.db.execute(
            select(TaskCard).where(
                and_(
                    TaskCard.is_habit == True,
                    TaskCard.is_deleted == False
                )
            )
        )
        habits = result.scalars().all()
        
        if not habits:
            return None
        
        # 检查是否所有习惯都已完成
        all_completed = all(habit.last_checkin_date == today for habit in habits)
        
        if not all_completed:
            return None
        
        # 检查今天是否已经生成过完成通知
        existing = await self._check_existing_daily_complete(today)
        if existing:
            return None
        
        notification = await self._create_notification(
            notification_type='daily_complete',
            title=f'🌟 今日习惯全部完成！',
            message=f'太棒了！你已完成今天的所有 {len(habits)} 个习惯！',
            data={
                'completed_count': len(habits),
                'date': today.isoformat()
            }
        )
        
        return notification
    
    async def _create_notification(
        self,
        notification_type: str,
        title: str,
        message: str,
        data: dict = None
    ) -> Notification:
        """创建并保存通知"""
        notification = Notification(
            id=str(uuid.uuid4()),
            type=notification_type,
            title=title,
            message=message,
            data=data,
            is_read=False,
            created_at=datetime.utcnow(),
            user_id="default"
        )
        self.db.add(notification)
        await self.db.commit()
        await self.db.refresh(notification)
        return notification
    
    async def _check_existing_reminder(self, habit_id: str, today: date) -> bool:
        """检查今天是否已为该习惯生成过提醒"""
        # 使用 UTC 时间范围，与 created_at 保持一致
        from datetime import timezone, timedelta
        utc_now = datetime.now(timezone.utc)
        # 获取今天 UTC 00:00 到明天 UTC 00:00
        start_of_day_utc = datetime(utc_now.year, utc_now.month, utc_now.day, 0, 0, 0)
        end_of_day_utc = start_of_day_utc + timedelta(days=1)
        
        result = await self.db.execute(
            select(Notification).where(
                and_(
                    Notification.type == 'habit_reminder',
                    Notification.created_at >= start_of_day_utc,
                    Notification.created_at < end_of_day_utc
                )
            )
        )
        notifications = result.scalars().all()
        
        for n in notifications:
            if n.data and n.data.get('habit_id') == habit_id and not n.data.get('at_risk'):
                return True
        return False
    
    async def _check_existing_at_risk(self, habit_id: str, today: date) -> bool:
        """检查今天是否已为该习惯生成过风险提醒"""
        from datetime import timezone, timedelta
        utc_now = datetime.now(timezone.utc)
        start_of_day_utc = datetime(utc_now.year, utc_now.month, utc_now.day, 0, 0, 0)
        end_of_day_utc = start_of_day_utc + timedelta(days=1)
        
        result = await self.db.execute(
            select(Notification).where(
                and_(
                    Notification.type == 'habit_reminder',
                    Notification.created_at >= start_of_day_utc,
                    Notification.created_at < end_of_day_utc
                )
            )
        )
        notifications = result.scalars().all()
        
        for n in notifications:
            if n.data and n.data.get('habit_id') == habit_id and n.data.get('at_risk'):
                return True
        return False
    
    async def _check_existing_achievement(self, habit_id: str, milestone: int) -> bool:
        """检查是否已为该习惯的该里程碑生成过成就通知"""
        # 只查询该习惯的成就通知，而不是所有成就
        from sqlalchemy import text
        
        # 使用 SQLite 的 json_extract 函数进行高效查询
        result = await self.db.execute(
            select(Notification).where(
                and_(
                    Notification.type == 'achievement',
                    text(f"json_extract(data, '$.habit_id') = :habit_id"),
                    text(f"json_extract(data, '$.milestone') = :milestone")
                )
            ).params(habit_id=habit_id, milestone=milestone).limit(1)
        )
        notification = result.scalar_one_or_none()
        return notification is not None
    
    async def _check_existing_daily_complete(self, today: date) -> bool:
        """检查今天是否已生成过每日完成通知"""
        from datetime import timezone, timedelta
        utc_now = datetime.now(timezone.utc)
        start_of_day_utc = datetime(utc_now.year, utc_now.month, utc_now.day, 0, 0, 0)
        end_of_day_utc = start_of_day_utc + timedelta(days=1)
        
        result = await self.db.execute(
            select(Notification).where(
                and_(
                    Notification.type == 'daily_complete',
                    Notification.created_at >= start_of_day_utc,
                    Notification.created_at < end_of_day_utc
                )
            )
        )
        notification = result.scalar_one_or_none()
        return notification is not None
