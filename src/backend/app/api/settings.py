from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any
import json

from app.database import get_db
from app.models.setting import Setting
from app.models.task_card import TaskCard
from app.models.card_list import CardList
from app.models.life_entry import LifeEntry
from app.models.checkin_record import CheckinRecord

router = APIRouter()


@router.get("")
async def get_settings(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """获取所有设置"""
    result = await db.execute(select(Setting))
    settings = result.scalars().all()
    
    # 转换为字典格式
    settings_dict: Dict[str, Any] = {}
    for setting in settings:
        try:
            settings_dict[setting.key] = json.loads(setting.value) if setting.value else None
        except json.JSONDecodeError:
            settings_dict[setting.key] = setting.value
    
    # 返回默认值（如果设置不存在）
    defaults = {
        "notificationsEnabled": True,
        "theme": "system"
    }
    
    for key, default_value in defaults.items():
        if key not in settings_dict:
            settings_dict[key] = default_value
    
    return settings_dict


@router.put("")
async def update_settings(
    updates: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """更新设置"""
    for key, value in updates.items():
        # 查找现有设置
        result = await db.execute(select(Setting).where(Setting.key == key))
        setting = result.scalar_one_or_none()
        
        # 序列化值
        serialized_value = json.dumps(value) if not isinstance(value, str) else value
        
        if setting:
            setting.value = serialized_value
        else:
            new_setting = Setting(key=key, value=serialized_value)
            db.add(new_setting)
    
    await db.commit()
    
    # 返回更新后的所有设置
    return await get_settings(db)


@router.get("/export")
async def export_data(db: AsyncSession = Depends(get_db)) -> JSONResponse:
    """导出所有用户数据为 JSON 格式"""
    
    # 获取所有卡片列表
    lists_result = await db.execute(select(CardList))
    card_lists = lists_result.scalars().all()
    
    # 获取所有任务卡片（包括已删除的）
    tasks_result = await db.execute(select(TaskCard))
    tasks = tasks_result.scalars().all()
    
    # 获取所有打卡记录
    checkins_result = await db.execute(select(CheckinRecord))
    checkins = checkins_result.scalars().all()
    
    # 获取所有生活记录（包括已删除的）
    entries_result = await db.execute(select(LifeEntry))
    life_entries = entries_result.scalars().all()
    
    # 获取所有设置
    settings_result = await db.execute(select(Setting))
    settings = settings_result.scalars().all()
    
    # 构建导出数据
    export_data = {
        "exportVersion": "1.0",
        "exportDate": __import__("datetime").datetime.utcnow().isoformat(),
        "cardLists": [
            {
                "id": lst.id,
                "name": lst.name,
                "color": lst.color,
                "sortOrder": lst.sort_order,
                "createdAt": lst.created_at.isoformat() if lst.created_at else None
            }
            for lst in card_lists
        ],
        "taskCards": [
            {
                "id": task.id,
                "title": task.title,
                "content": task.content,
                "listId": task.list_id,
                "isHabit": task.is_habit,
                "reminderTime": task.reminder_time.isoformat() if task.reminder_time else None,
                "currentStreak": task.current_streak,
                "longestStreak": task.longest_streak,
                "lastCheckinDate": task.last_checkin_date.isoformat() if task.last_checkin_date else None,
                "createdAt": task.created_at.isoformat() if task.created_at else None,
                "updatedAt": task.updated_at.isoformat() if task.updated_at else None,
                "isDeleted": task.is_deleted
            }
            for task in tasks
        ],
        "checkinRecords": [
            {
                "id": checkin.id,
                "taskId": checkin.task_id,
                "checkinDate": checkin.checkin_date.isoformat() if checkin.checkin_date else None,
                "checkinTime": checkin.checkin_time.isoformat() if checkin.checkin_time else None
            }
            for checkin in checkins
        ],
        "lifeEntries": [
            {
                "id": entry.id,
                "content": entry.content,
                "createdAt": entry.created_at.isoformat() if entry.created_at else None,
                "updatedAt": entry.updated_at.isoformat() if entry.updated_at else None,
                "isDeleted": entry.is_deleted
            }
            for entry in life_entries
        ],
        "settings": {
            setting.key: json.loads(setting.value) if setting.value else None
            for setting in settings
        }
    }
    
    return JSONResponse(content=export_data)
