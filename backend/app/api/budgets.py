import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.budget import Budget
from app.models.expense import Expense
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetOut, BudgetProgress, BudgetUpdate

router = APIRouter(prefix="/api/v1/budgets", tags=["Budgets"])
OVERALL_BUDGET_CATEGORY = "__overall__"


def current_month() -> str:
    return date.today().strftime("%Y-%m")


def month_parts(month: str) -> tuple[int, int]:
    year, month_num = month.split("-")
    return int(year), int(month_num)


def normalize_budget_category(category: Optional[str]) -> str:
    return category.strip() if category and category.strip() else OVERALL_BUDGET_CATEGORY


def public_category(category: str) -> Optional[str]:
    return None if category == OVERALL_BUDGET_CATEGORY else category


def public_budget_type(category: str) -> str:
    return "overall" if category == OVERALL_BUDGET_CATEGORY else "category"


def budget_status(percentage: float) -> str:
    if percentage >= 100:
        return "over"
    if percentage >= 80:
        return "warning"
    return "ok"


async def spend_for_budget(db: AsyncSession, user_id, category: str, month: str) -> float:
    year, month_num = month_parts(month)
    filters = [
            Expense.user_id == user_id,
            extract("year", Expense.expense_date) == year,
            extract("month", Expense.expense_date) == month_num,
    ]
    if category != OVERALL_BUDGET_CATEGORY:
        filters.append(Expense.category == category)

    result = await db.execute(
        select(func.coalesce(func.sum(Expense.amount), 0)).where(*filters)
    )
    return float(result.scalar_one())


async def to_progress(db: AsyncSession, budget: Budget) -> BudgetProgress:
    spent = await spend_for_budget(db, budget.user_id, budget.category, budget.month)
    amount = float(budget.amount)
    percentage = round((spent / amount) * 100, 1) if amount else 0
    return BudgetProgress(
        id=budget.id,
        user_id=budget.user_id,
        category=public_category(budget.category),
        budget_type=public_budget_type(budget.category),
        month=budget.month,
        amount=amount,
        created_at=budget.created_at,
        spent=spent,
        remaining=round(amount - spent, 2),
        percentage=percentage,
        status=budget_status(percentage),
    )


@router.get("/", response_model=list[BudgetProgress])
async def list_budgets(
    month: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List budgets for the current user and month, including actual spend."""
    month = month or current_month()
    result = await db.execute(
        select(Budget)
        .where(Budget.user_id == current_user.id, Budget.month == month)
        .order_by(Budget.category)
    )
    budgets = result.scalars().all()
    return [await to_progress(db, budget) for budget in budgets]


@router.post("/", response_model=BudgetOut, status_code=status.HTTP_201_CREATED)
async def create_budget(
    budget_data: BudgetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a monthly category budget for the current user."""
    category = normalize_budget_category(budget_data.category)
    existing = await db.execute(
        select(Budget).where(
            Budget.user_id == current_user.id,
            Budget.category == category,
            Budget.month == budget_data.month,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Budget already exists for this month")

    budget = Budget(
        user_id=current_user.id,
        category=category,
        month=budget_data.month,
        amount=budget_data.amount,
    )
    db.add(budget)
    await db.flush()
    await db.refresh(budget)
    return BudgetOut(
        id=budget.id,
        user_id=budget.user_id,
        category=public_category(budget.category),
        budget_type=public_budget_type(budget.category),
        month=budget.month,
        amount=float(budget.amount),
        created_at=budget.created_at,
    )


@router.patch("/{budget_id}", response_model=BudgetOut)
async def update_budget(
    budget_id: uuid.UUID,
    budget_data: BudgetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a monthly budget amount."""
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == current_user.id)
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    budget.amount = budget_data.amount
    await db.flush()
    await db.refresh(budget)
    return BudgetOut(
        id=budget.id,
        user_id=budget.user_id,
        category=public_category(budget.category),
        budget_type=public_budget_type(budget.category),
        month=budget.month,
        amount=float(budget.amount),
        created_at=budget.created_at,
    )


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    budget_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a monthly budget."""
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == current_user.id)
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    await db.delete(budget)
