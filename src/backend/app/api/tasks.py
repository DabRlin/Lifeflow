import uuid
from datetime import datetime, date, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.task_card import TaskCard
from app.models.checkin_record import CheckinRecord
from app.schemas.task_card import TaskCardCreate, TaskCardUpdate, TaskCardResponse
from app.schemas.checkin_record import CheckinRequest, CheckinRecordResponse
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get("", response_model=List[TaskCardResponse])
async def get_tasks(
    list_id: Optional[str] = Query(None, description="Filter by list ID"),
    include_deleted: bool = Query(False, description="Include soft-deleted tasks"),
    db: AsyncSession = Depends(get_db)
):
    """Get all task cards, optionally filtered by list_id."""
    query = select(TaskCard)
    
    if not include_deleted:
        query = query.where(TaskCard.is_deleted == False)
    
    if list_id is not None:
        query = query.where(TaskCard.list_id == list_id)
    
    query = query.order_by(TaskCard.created_at.desc())
    result = await db.execute(query)
    tasks = result.scalars().all()
    return tasks


@router.get("/{task_id}", response_model=TaskCardResponse)
async def get_task(task_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single task card by ID."""
    result = await db.execute(select(TaskCard).where(TaskCard.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with id '{task_id}' not found"
        )
    return task


@router.post("", response_model=TaskCardResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCardCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new task card."""
    task = TaskCard(
        id=str(uuid.uuid4()),
        title=task_data.title.strip(),
        content=task_data.content,
        list_id=task_data.list_id,
        is_habit=task_data.is_habit,
        reminder_time=task_data.reminder_time
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.put("/{task_id}", response_model=TaskCardResponse)
async def update_task(
    task_id: str,
    task_data: TaskCardUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an existing task card."""
    result = await db.execute(select(TaskCard).where(TaskCard.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with id '{task_id}' not found"
        )
    
    # Update fields if provided
    if task_data.title is not None:
        task.title = task_data.title.strip()
    
    if task_data.content is not None:
        task.content = task_data.content
    
    if task_data.list_id is not None:
        task.list_id = task_data.list_id
    
    if task_data.is_habit is not None:
        task.is_habit = task_data.is_habit
    
    # Handle reminder time: clear_reminder takes precedence
    if task_data.clear_reminder:
        task.reminder_time = None
    elif task_data.reminder_time is not None:
        task.reminder_time = task_data.reminder_time
    
    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    hard_delete: bool = Query(False, description="Permanently delete instead of soft delete"),
    db: AsyncSession = Depends(get_db)
):
    """Soft delete a task card (or hard delete if specified)."""
    result = await db.execute(select(TaskCard).where(TaskCard.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with id '{task_id}' not found"
        )
    
    if hard_delete:
        await db.delete(task)
    else:
        task.is_deleted = True
    
    await db.commit()
    return None


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


def calculate_streak(last_checkin_date: Optional[date], current_streak: int, today: date) -> int:
    """
    Calculate the new streak value based on the last check-in date.
    
    Args:
        last_checkin_date: The date of the last check-in, or None if never checked in.
        current_streak: The current streak count.
        today: Today's date in the user's local timezone.
    
    Returns:
        The new streak value.
    """
    if last_checkin_date is None:
        # First check-in ever
        return 1
    
    if last_checkin_date == today:
        # Already checked in today, streak stays the same
        return current_streak
    
    days_since_last = (today - last_checkin_date).days
    
    if days_since_last == 1:
        # Consecutive day, increment streak
        return current_streak + 1
    else:
        # Missed one or more days, reset streak
        return 1


@router.post("/{task_id}/checkin", response_model=TaskCardResponse)
async def checkin_task(
    task_id: str,
    checkin_data: Optional[CheckinRequest] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Check in on a habit task.
    
    Creates a check-in record and updates the task's streak information.
    The streak is calculated based on consecutive daily check-ins in the user's timezone.
    """
    result = await db.execute(select(TaskCard).where(TaskCard.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with id '{task_id}' not found"
        )
    
    # Get timezone offset from request, default to UTC
    timezone_offset = checkin_data.timezone_offset if checkin_data else 0
    
    # Get today's date in user's local timezone
    today = get_local_date(timezone_offset)
    
    # Check if already checked in today
    existing_checkin = await db.execute(
        select(CheckinRecord).where(
            CheckinRecord.task_id == task_id,
            CheckinRecord.checkin_date == today
        )
    )
    if existing_checkin.scalar_one_or_none():
        # Already checked in today, just return the task
        return task
    
    # Create check-in record
    checkin_record = CheckinRecord(
        id=str(uuid.uuid4()),
        task_id=task_id,
        checkin_date=today,
        checkin_time=datetime.now(timezone.utc)
    )
    db.add(checkin_record)
    
    # Calculate new streak
    new_streak = calculate_streak(task.last_checkin_date, task.current_streak, today)
    
    # Update task streak information
    task.current_streak = new_streak
    task.last_checkin_date = today
    
    # Update longest streak if current exceeds it
    if new_streak > task.longest_streak:
        task.longest_streak = new_streak
    
    await db.commit()
    await db.refresh(task)
    
    # Generate notifications after successful check-in
    notification_service = NotificationService(db)
    
    # Check for achievement milestone
    await notification_service.check_streak_achievement(
        habit_id=task_id,
        streak=new_streak,
        habit_title=task.title
    )
    
    # Check if all habits are completed today
    await notification_service.check_daily_complete()
    
    return task


@router.get("/{task_id}/checkins", response_model=List[CheckinRecordResponse])
async def get_task_checkins(
    task_id: str,
    limit: int = Query(30, ge=1, le=365, description="Maximum number of records to return"),
    db: AsyncSession = Depends(get_db)
):
    """Get check-in records for a task, ordered by date descending."""
    # Verify task exists
    result = await db.execute(select(TaskCard).where(TaskCard.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with id '{task_id}' not found"
        )
    
    # Get check-in records
    query = (
        select(CheckinRecord)
        .where(CheckinRecord.task_id == task_id)
        .order_by(CheckinRecord.checkin_date.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    records = result.scalars().all()
    return records
