import uuid
import csv
import io
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseOut, ExpenseBulkCreate, ExpenseUpdate, ExpensePage

router = APIRouter(prefix="/api/v1/expenses", tags=["Expenses"])


@router.post("/", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
async def create_expense(
    expense_data: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a single expense entry."""
    expense = Expense(
        user_id=current_user.id,
        amount=expense_data.amount,
        category=expense_data.category,
        expense_date=expense_data.expense_date,
        description=expense_data.description,
    )
    db.add(expense)
    await db.flush()
    await db.refresh(expense)
    return expense


@router.post("/bulk", response_model=list[ExpenseOut], status_code=status.HTTP_201_CREATED)
async def create_bulk_expenses(
    bulk_data: ExpenseBulkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create multiple expenses in a single ACID transaction."""
    expenses = []
    for item in bulk_data.expenses:
        expense = Expense(
            user_id=current_user.id,
            amount=item.amount,
            category=item.category,
            expense_date=item.expense_date,
            description=item.description,
        )
        db.add(expense)
        expenses.append(expense)

    await db.flush()
    for exp in expenses:
        await db.refresh(exp)
    return expenses


@router.get("/", response_model=ExpensePage)
async def list_expenses(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    category: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List expenses for the current user with optional filtering and search."""
    filters = [Expense.user_id == current_user.id]

    if category:
        filters.append(Expense.category == category)
    if search:
        search_filter = f"%{search}%"
        filters.append(
            (Expense.description.ilike(search_filter)) | 
            (Expense.category.ilike(search_filter))
        )
    if start_date:
        filters.append(Expense.expense_date >= start_date)
    if end_date:
        filters.append(Expense.expense_date <= end_date)

    total_query = select(func.count(Expense.id)).where(*filters)
    total = (await db.execute(total_query)).scalar_one()

    query = (
        select(Expense)
        .where(*filters)
        .order_by(Expense.expense_date.desc(), Expense.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    return ExpensePage(
        items=result.scalars().all(),
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/export")
async def export_expenses(
    category: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export the current user's expenses as CSV, respecting optional filters."""
    filters = [Expense.user_id == current_user.id]
    if category:
        filters.append(Expense.category == category)
    if search:
        search_filter = f"%{search}%"
        filters.append(
            (Expense.description.ilike(search_filter)) |
            (Expense.category.ilike(search_filter))
        )
    if start_date:
        filters.append(Expense.expense_date >= start_date)
    if end_date:
        filters.append(Expense.expense_date <= end_date)

    result = await db.execute(
        select(Expense)
        .where(*filters)
        .order_by(Expense.expense_date.desc(), Expense.created_at.desc())
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["amount", "category", "expense_date", "description"])
    for expense in result.scalars().all():
        writer.writerow([
            float(expense.amount),
            expense.category,
            expense.expense_date.isoformat(),
            expense.description or "",
        ])

    filename = "expenses_export.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.delete("/clear", status_code=status.HTTP_204_NO_CONTENT)
async def clear_expenses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete all expenses belonging to the current user."""
    await db.execute(delete(Expense).where(Expense.user_id == current_user.id))


@router.patch("/{expense_id}", response_model=ExpenseOut)
async def update_expense(
    expense_id: uuid.UUID,
    expense_data: ExpenseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a specific expense belonging to the current user."""
    result = await db.execute(
        select(Expense).where(
            Expense.id == expense_id, Expense.user_id == current_user.id
        )
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    if expense_data.amount is not None:
        expense.amount = expense_data.amount
    if expense_data.category is not None:
        expense.category = expense_data.category
    if expense_data.expense_date is not None:
        expense.expense_date = expense_data.expense_date
    if expense_data.description is not None:
        expense.description = expense_data.description

    await db.commit()
    await db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a specific expense belonging to the current user."""
    result = await db.execute(
        select(Expense).where(
            Expense.id == expense_id, Expense.user_id == current_user.id
        )
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    await db.delete(expense)
    await db.flush()
