from datetime import date
from pydantic import BaseModel


class DailyRingData(BaseModel):
    date: date
    total_habits: int
    completed_habits: int
    percentage: float


class StatsOverview(BaseModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    completion_rate: float
    longest_streak: int
    today_checkins: int
