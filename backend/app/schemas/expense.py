import uuid
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class ExpenseCreate(BaseModel):
    amount: float = Field(..., gt=0, description="Expense amount, must be positive")
    category: str = Field(..., min_length=1, max_length=100)
    expense_date: date
    description: Optional[str] = ""


class ExpenseUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    expense_date: Optional[date] = None
    description: Optional[str] = None


class ExpenseOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    amount: float
    category: str
    expense_date: date
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ExpenseBulkCreate(BaseModel):
    expenses: list[ExpenseCreate]


class CategoryBreakdown(BaseModel):
    category: str
    total: float
    percentage: float


class DailySummary(BaseModel):
    date: date
    total: float


class MonthlySummary(BaseModel):
    month: str  # e.g., "2026-04"
    total: float


class AnalyticsSummary(BaseModel):
    total_spend: float
    top_category: Optional[str]
    top_category_amount: float
    expense_count: int
    daily_breakdown: list[DailySummary]
    monthly_breakdown: list[MonthlySummary]
