"""Add budgets

Revision ID: 7c4e7a2b8d1a
Revises: 3e8e13142b9c
Create Date: 2026-04-26 13:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7c4e7a2b8d1a"
down_revision: Union[str, None] = "3e8e13142b9c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "budgets",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("month", sa.String(length=7), nullable=False),
        sa.Column("amount", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "category", "month", name="uq_budgets_user_category_month"),
    )
    op.create_index("ix_budgets_user_month", "budgets", ["user_id", "month"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_budgets_user_month", table_name="budgets")
    op.drop_table("budgets")
