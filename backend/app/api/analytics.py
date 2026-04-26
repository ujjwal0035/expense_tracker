from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case, String

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.expense import Expense
from app.schemas.expense import AnalyticsSummary, CategoryBreakdown, DailySummary, MonthlySummary

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
async def get_summary(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    group_by: str = Query("month", enum=["day", "week", "month", "quarter", "year"]),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get aggregated analytics summary with dynamic periodic breakdowns."""
    try:
        # Base filter
        base_filter = [Expense.user_id == current_user.id]
        if start_date:
            base_filter.append(Expense.expense_date >= start_date)
        if end_date:
            base_filter.append(Expense.expense_date <= end_date)

        # Total spend and count
        totals_query = select(
            func.coalesce(func.sum(Expense.amount), 0).label("total_spend"),
            func.count(Expense.id).label("expense_count"),
        ).where(*base_filter)
        totals_result = await db.execute(totals_query)
        totals = totals_result.one()

        # Top category
        top_cat_query = (
            select(
                Expense.category,
                func.sum(Expense.amount).label("cat_total"),
            )
            .where(*base_filter)
            .group_by(Expense.category)
            .order_by(func.sum(Expense.amount).desc())
            .limit(1)
        )
        top_cat_result = (await db.execute(top_cat_query)).first()
        top_category = top_cat_result.category if top_cat_result else None
        top_category_amount = float(top_cat_result.cat_total) if top_cat_result else 0.0

        # Periodic breakdown logic
        if group_by == "day":
            period_expr = func.to_char(Expense.expense_date, "YYYY-MM-DD")
        elif group_by == "week":
            period_expr = func.to_char(func.date_trunc('week', Expense.expense_date), "IYYY-\"W\"IW")
        elif group_by == "quarter":
            period_expr = func.concat(
                func.to_char(Expense.expense_date, "YYYY"),
                "-Q",
                func.ceil(func.extract('month', Expense.expense_date) / 3).cast(String)
            )
        elif group_by == "year":
            period_expr = func.to_char(Expense.expense_date, "YYYY")
        else: # default month
            period_expr = func.to_char(Expense.expense_date, "YYYY-MM")

        periodic_query = (
            select(
                period_expr.label("period"),
                func.sum(Expense.amount).label("total"),
            )
            .where(*base_filter)
            .group_by(period_expr)
            .order_by(period_expr)
        )
        periodic_rows = (await db.execute(periodic_query)).all()
        periodic_breakdown = [
            MonthlySummary(month=row.period, total=float(row.total)) for row in periodic_rows
        ]

        # Daily breakdown (for sparklines)
        daily_query = (
            select(
                Expense.expense_date.label("date"),
                func.sum(Expense.amount).label("total"),
            )
            .where(*base_filter)
            .group_by(Expense.expense_date)
            .order_by(Expense.expense_date)
        )
        daily_rows = (await db.execute(daily_query)).all()
        daily_breakdown = [
            DailySummary(date=row.date, total=float(row.total)) for row in daily_rows
        ]

        return AnalyticsSummary(
            total_spend=float(totals.total_spend),
            top_category=top_category,
            top_category_amount=top_category_amount,
            expense_count=totals.expense_count,
            daily_breakdown=daily_breakdown,
            monthly_breakdown=periodic_breakdown, # Reusing schema field for all periodic data
        )
    except Exception as e:
        import traceback
        print(f"ERROR in get_summary: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/category-breakdown", response_model=list[CategoryBreakdown])
async def get_category_breakdown(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get per-category spending breakdown with percentages.

    Uses PostgreSQL window functions for percentage calculation.
    """
    base_filter = [Expense.user_id == current_user.id]
    if start_date:
        base_filter.append(Expense.expense_date >= start_date)
    if end_date:
        base_filter.append(Expense.expense_date <= end_date)

    # Get total for percentage calculation
    total_query = select(
        func.coalesce(func.sum(Expense.amount), 0)
    ).where(*base_filter)
    total_spend = float((await db.execute(total_query)).scalar())

    if total_spend == 0:
        return []

    # Category breakdown
    cat_query = (
        select(
            Expense.category,
            func.sum(Expense.amount).label("total"),
        )
        .where(*base_filter)
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
    )
    rows = (await db.execute(cat_query)).all()

    return [
        CategoryBreakdown(
            category=row.category,
            total=float(row.total),
            percentage=round(float(row.total) / total_spend * 100, 1),
        )
        for row in rows
    ]


@router.get("/stacked-data")
async def get_stacked_data(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    group_by: str = Query("month", enum=["day", "week", "month", "quarter", "year"]),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get category breakdown per period for stacked bar charts."""
    base_filter = [Expense.user_id == current_user.id]
    if start_date:
        base_filter.append(Expense.expense_date >= start_date)
    if end_date:
        base_filter.append(Expense.expense_date <= end_date)

    # Periodic breakdown logic
    if group_by == "day":
        period_expr = func.to_char(Expense.expense_date, "YYYY-MM-DD")
    elif group_by == "week":
        period_expr = func.to_char(func.date_trunc('week', Expense.expense_date), "IYYY-\"W\"IW")
    elif group_by == "quarter":
        period_expr = func.concat(
            func.to_char(Expense.expense_date, "YYYY"),
            "-Q",
            func.ceil(func.extract('month', Expense.expense_date) / 3).cast(String)
        )
    elif group_by == "year":
        period_expr = func.to_char(Expense.expense_date, "YYYY")
    else: # default month
        period_expr = func.to_char(Expense.expense_date, "YYYY-MM")

    query = (
        select(
            period_expr.label("period"),
            Expense.category,
            func.sum(Expense.amount).label("total"),
        )
        .where(*base_filter)
        .group_by(period_expr, Expense.category)
        .order_by(period_expr)
    )
    rows = (await db.execute(query)).all()

    # Reformat for Recharts stacked bar
    data_map = {}
    categories = set()

    for row in rows:
        if row.period not in data_map:
            data_map[row.period] = {"period": row.period}
        data_map[row.period][row.category] = float(row.total)
        categories.add(row.category)

    result = sorted(data_map.values(), key=lambda x: x["period"])
    return {"data": result, "categories": list(categories)}
