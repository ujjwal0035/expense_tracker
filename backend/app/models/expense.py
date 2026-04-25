import uuid
from datetime import date, datetime, timezone

from sqlalchemy import String, Date, DateTime, Numeric, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    expense_date: Mapped[date] = mapped_column(Date, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user = relationship("User", back_populates="expenses")

    # Composite indexes for analytical queries
    __table_args__ = (
        Index("ix_expenses_user_date", "user_id", "expense_date"),
        Index("ix_expenses_user_category", "user_id", "category"),
    )

    def __repr__(self) -> str:
        return f"<Expense {self.amount} - {self.category}>"
