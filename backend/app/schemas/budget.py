import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class BudgetBase(BaseModel):
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    month: str = Field(..., pattern=r"^\d{4}-\d{2}$")
    amount: float = Field(..., gt=0)

    @field_validator("month")
    @classmethod
    def validate_month(cls, value: str) -> str:
        year, month = value.split("-")
        if not 1 <= int(month) <= 12:
            raise ValueError("Month must be between 01 and 12")
        if int(year) < 1900:
            raise ValueError("Year must be 1900 or later")
        return value


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    amount: float = Field(..., gt=0)


class BudgetOut(BudgetBase):
    id: uuid.UUID
    user_id: uuid.UUID
    budget_type: str
    created_at: datetime

    model_config = {"from_attributes": True}


class BudgetProgress(BudgetOut):
    spent: float
    remaining: float
    percentage: float
    status: str
