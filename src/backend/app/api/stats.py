from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.task_card import TaskCard
from app.models.checkin_record import CheckinRecord
from app.schemas.stats import DailyRingData, StatsOverview

router = APIRouter()


def get_local_date(timezone_offset_minutes: int = 0) -> date:
    """
    Get the current date in the user's local timezone.
    
    Args:
        timezone_offset_minutes: Offset from UTC in minutes.
            Positive values are west of UTC (e.g., 300 for UTC-5).
            Negative values are east of UTC (e.g., -480 for UTC+8).
    
    Returns:
        The current date in the user's local timezone.
    """
    utc_now = datetime.now(timezone.utc)
    # Convert offset: positive offset means subtract from UTC
    local_time = utc_now - timedelta(minutes=timezone_offset_minutes)
    return local_time.date()


async def calculate_daily_ring(
    db: AsyncSession,
    target_date: date
) -> DailyRingData:
    """
    Calculate the daily ring data for a specific date.
    
    Args:
        db: Database session
        target_date: The date to calculate the ring for
    
    Returns:
        DailyRingData with total habits, completed habits, and percentage
    """
    # Count total active habit tasks
    total_habits_query = select(func.count(TaskCard.id)).where(
        TaskCard.is_habit == True,
        TaskCard.is_deleted == False
    )
    total_result = await db.execute(total_habits_query)
    total_habits = total_result.scalar() or 0
    
    # Count completed habits for the target date
    # A habit is completed if there's a check-in record for that date
    completed_habits_query = (
        select(func.count(func.distinct(CheckinRecord.task_id)))
        .select_from(CheckinRecord)
        .join(TaskCard, CheckinRecord.task_id == TaskCard.id)
        .where(
            CheckinRecord.checkin_date == target_date,
            TaskCard.is_habit == True,
            TaskCard.is_deleted == False
        )
    )
    completed_result = await db.execute(completed_habits_query)
    completed_habits = completed_result.scalar() or 0
    
    # Calculate percentage
    if total_habits == 0:
        percentage = 0.0
    else:
        percentage = (completed_habits / total_habits) * 100
    
    return DailyRingData(
        date=target_date,
        total_habits=total_habits,
        completed_habits=completed_habits,
        percentage=round(percentage, 1)
    )


async def calculate_stats_overview(
    db: AsyncSession,
    target_date: date
) -> StatsOverview:
    """
    Calculate the statistics overview.
    
    Args:
        db: Database session
        target_date: The date to calculate today's check-ins for
    
    Returns:
        StatsOverview with task counts, completion rate, longest streak, and today's check-ins
    """
    # Count total non-deleted tasks
    total_tasks_query = select(func.count(TaskCard.id)).where(
        TaskCard.is_deleted == False
    )
    total_result = await db.execute(total_tasks_query)
    total_tasks = total_result.scalar() or 0
    
    # Count completed tasks (non-habit tasks that are marked as completed via is_deleted=False 
    # and have been checked in, or habit tasks with check-ins today)
    # For this implementation, we consider a task "completed" if it's a habit task 
    # that has been checked in today, or a non-habit task that has any check-in record
    # However, based on the design, "completed" likely means tasks that have been done
    # For simplicity, we'll count tasks that have at least one check-in record as "completed"
    completed_tasks_query = (
        select(func.count(func.distinct(TaskCard.id)))
        .select_from(TaskCard)
        .join(CheckinRecord, CheckinRecord.task_id == TaskCard.id)
        .where(TaskCard.is_deleted == False)
    )
    completed_result = await db.execute(completed_tasks_query)
    completed_tasks = completed_result.scalar() or 0
    
    # Pending tasks = total - completed
    pending_tasks = total_tasks - completed_tasks
    
    # Calculate completion rate
    if total_tasks == 0:
        completion_rate = 0.0
    else:
        completion_rate = (completed_tasks / total_tasks) * 100
    
    # Find the longest streak across all habit tasks
    # This is the maximum of current_streak and longest_streak for all habit tasks
    longest_streak_query = select(
        func.max(
            func.max(TaskCard.current_streak, TaskCard.longest_streak)
        )
    ).where(
        TaskCard.is_habit == True,
        TaskCard.is_deleted == False
    )
    longest_streak_result = await db.execute(longest_streak_query)
    longest_streak = longest_streak_result.scalar() or 0
    
    # Count today's check-ins
    today_checkins_query = select(func.count(CheckinRecord.id)).where(
        CheckinRecord.checkin_date == target_date
    )
    today_checkins_result = await db.execute(today_checkins_query)
    today_checkins = today_checkins_result.scalar() or 0
    
    return StatsOverview(
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        pending_tasks=pending_tasks,
        completion_rate=round(completion_rate, 1),
        longest_streak=longest_streak,
        today_checkins=today_checkins
    )


@router.get("/overview", response_model=StatsOverview)
async def get_stats_overview(
    timezone_offset: int = Query(
        0,
        description="Timezone offset from UTC in minutes. Positive values are west of UTC."
    ),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the statistics overview.
    
    Returns:
        - total_tasks: Total number of non-deleted tasks
        - completed_tasks: Number of tasks that have been completed (have check-in records)
        - pending_tasks: Number of tasks that haven't been completed
        - completion_rate: Percentage of completed tasks
        - longest_streak: The longest streak achieved across all habit tasks
        - today_checkins: Number of check-ins made today
    """
    target_date = get_local_date(timezone_offset)
    return await calculate_stats_overview(db, target_date)


@router.get("/daily-ring", response_model=DailyRingData)
async def get_daily_ring(
    timezone_offset: int = Query(
        0,
        description="Timezone offset from UTC in minutes. Positive values are west of UTC."
    ),
    target_date: Optional[date] = Query(
        None,
        description="Specific date to get ring data for. Defaults to today in user's timezone."
    ),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the daily ring data showing habit completion progress.
    
    The daily ring shows the percentage of habit tasks completed for a given day.
    By default, it returns data for today based on the user's timezone.
    
    The ring resets at midnight in the user's local timezone.
    """
    # Determine the target date
    if target_date is None:
        target_date = get_local_date(timezone_offset)
    
    return await calculate_daily_ring(db, target_date)


@router.get("/streaks")
async def get_streaks():
    return []
