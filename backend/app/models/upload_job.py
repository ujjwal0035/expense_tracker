import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UploadJob(Base):
    __tablename__ = "upload_jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="PENDING"
    )  # PENDING, PROCESSING, COMPLETED, FAILED
    total_rows: Mapped[int] = mapped_column(Integer, default=0)
    processed_rows: Mapped[int] = mapped_column(Integer, default=0)
    error_log: Mapped[dict] = mapped_column(JSONB, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user = relationship("User", back_populates="upload_jobs")

    def __repr__(self) -> str:
        return f"<UploadJob {self.id} - {self.status}>"
