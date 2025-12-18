from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Date, Boolean, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TaskCard(Base):
    __tablename__ = "task_cards"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, default="")
    list_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("card_lists.id"))
    is_habit: Mapped[bool] = mapped_column(Boolean, default=False)
    reminder_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_checkin_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
