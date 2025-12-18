from datetime import datetime, date
from sqlalchemy import String, DateTime, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class CheckinRecord(Base):
    __tablename__ = "checkin_records"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    task_id: Mapped[str] = mapped_column(String, ForeignKey("task_cards.id"))
    checkin_date: Mapped[date] = mapped_column(Date, nullable=False)
    checkin_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
