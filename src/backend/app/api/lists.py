import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.card_list import CardList
from app.schemas.card_list import CardListCreate, CardListUpdate, CardListResponse

router = APIRouter()


@router.get("", response_model=List[CardListResponse])
async def get_lists(db: AsyncSession = Depends(get_db)):
    """Get all card lists ordered by sort_order."""
    result = await db.execute(
        select(CardList).order_by(CardList.sort_order, CardList.created_at)
    )
    lists = result.scalars().all()
    return lists


@router.get("/{list_id}", response_model=CardListResponse)
async def get_list(list_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single card list by ID."""
    result = await db.execute(select(CardList).where(CardList.id == list_id))
    card_list = result.scalar_one_or_none()
    if not card_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Card list with id '{list_id}' not found"
        )
    return card_list


@router.post("", response_model=CardListResponse, status_code=status.HTTP_201_CREATED)
async def create_list(
    list_data: CardListCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new card list."""
    # Validate name is not just whitespace
    if not list_data.name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="List name cannot be empty or whitespace only"
        )
    
    card_list = CardList(
        id=str(uuid.uuid4()),
        name=list_data.name.strip(),
        color=list_data.color,
        sort_order=list_data.sort_order
    )
    db.add(card_list)
    await db.commit()
    await db.refresh(card_list)
    return card_list


@router.put("/{list_id}", response_model=CardListResponse)
async def update_list(
    list_id: str,
    list_data: CardListUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an existing card list."""
    result = await db.execute(select(CardList).where(CardList.id == list_id))
    card_list = result.scalar_one_or_none()
    if not card_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Card list with id '{list_id}' not found"
        )
    
    # Update fields if provided
    if list_data.name is not None:
        if not list_data.name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="List name cannot be empty or whitespace only"
            )
        card_list.name = list_data.name.strip()
    
    if list_data.color is not None:
        card_list.color = list_data.color
    
    if list_data.sort_order is not None:
        card_list.sort_order = list_data.sort_order
    
    await db.commit()
    await db.refresh(card_list)
    return card_list


@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_list(list_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a card list."""
    result = await db.execute(select(CardList).where(CardList.id == list_id))
    card_list = result.scalar_one_or_none()
    if not card_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Card list with id '{list_id}' not found"
        )
    
    await db.delete(card_list)
    await db.commit()
    return None
