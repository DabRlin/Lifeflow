import uuid
from datetime import datetime, timezone
from typing import List, Optional
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.life_entry import LifeEntry
from app.schemas.life_entry import (
    LifeEntryCreate,
    LifeEntryUpdate,
    LifeEntryResponse,
    LifeEntryPaginatedResponse,
    LifeEntryGroupedResponse,
    DateGroupedEntries,
)

router = APIRouter()


@router.get("", response_model=LifeEntryPaginatedResponse)
async def get_life_entries(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    include_deleted: bool = Query(False, description="Include soft-deleted entries"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all life entries with pagination.
    
    Returns entries in reverse chronological order (newest first).
    Requirements: 8.2, 8.6
    """
    # Build base query
    base_query = select(LifeEntry)
    if not include_deleted:
        base_query = base_query.where(LifeEntry.is_deleted == False)
    
    # Get total count
    count_query = select(func.count()).select_from(base_query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Calculate pagination
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    offset = (page - 1) * page_size
    
    # Get paginated entries ordered by created_at descending (newest first)
    query = (
        base_query
        .order_by(LifeEntry.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(query)
    entries = result.scalars().all()
    
    return LifeEntryPaginatedResponse(
        items=entries,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )



@router.get("/grouped", response_model=LifeEntryGroupedResponse)
async def get_life_entries_grouped(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    include_deleted: bool = Query(False, description="Include soft-deleted entries"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get life entries grouped by date with pagination.
    
    Returns entries grouped by date in reverse chronological order.
    Requirements: 8.5, 8.6
    """
    # Build base query
    base_query = select(LifeEntry)
    if not include_deleted:
        base_query = base_query.where(LifeEntry.is_deleted == False)
    
    # Get total count
    count_query = select(func.count()).select_from(base_query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Calculate pagination
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    offset = (page - 1) * page_size
    
    # Get paginated entries ordered by created_at descending
    query = (
        base_query
        .order_by(LifeEntry.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(query)
    entries = result.scalars().all()
    
    # Group entries by date
    date_groups: dict = defaultdict(list)
    for entry in entries:
        entry_date = entry.created_at.date()
        date_groups[entry_date].append(entry)
    
    # Convert to response format, sorted by date descending
    groups = [
        DateGroupedEntries(date=date, entries=entries_list)
        for date, entries_list in sorted(date_groups.items(), reverse=True)
    ]
    
    return LifeEntryGroupedResponse(
        groups=groups,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{entry_id}", response_model=LifeEntryResponse)
async def get_life_entry(entry_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single life entry by ID."""
    result = await db.execute(select(LifeEntry).where(LifeEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Life entry with id '{entry_id}' not found"
        )
    return entry


@router.post("", response_model=LifeEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_life_entry(
    entry_data: LifeEntryCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new life entry with current timestamp.
    
    Requirements: 8.1
    """
    now = datetime.now(timezone.utc)
    entry = LifeEntry(
        id=str(uuid.uuid4()),
        content=entry_data.content.strip(),
        created_at=now,
        updated_at=now
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.put("/{entry_id}", response_model=LifeEntryResponse)
async def update_life_entry(
    entry_id: str,
    entry_data: LifeEntryUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update an existing life entry.
    
    Updates content and updated_at timestamp while preserving original created_at.
    Requirements: 8.3
    """
    result = await db.execute(select(LifeEntry).where(LifeEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Life entry with id '{entry_id}' not found"
        )
    
    # Update content if provided
    if entry_data.content is not None:
        entry.content = entry_data.content.strip()
        entry.updated_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_life_entry(
    entry_id: str,
    hard_delete: bool = Query(False, description="Permanently delete instead of soft delete"),
    db: AsyncSession = Depends(get_db)
):
    """
    Soft delete a life entry (or hard delete if specified).
    
    Requirements: 8.4
    """
    result = await db.execute(select(LifeEntry).where(LifeEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Life entry with id '{entry_id}' not found"
        )
    
    if hard_delete:
        await db.delete(entry)
    else:
        entry.is_deleted = True
        entry.updated_at = datetime.now(timezone.utc)
    
    await db.commit()
    return None
