import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class UploadJobOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    status: str
    total_rows: int
    processed_rows: int
    error_log: Optional[dict] = None
    created_at: datetime

    model_config = {"from_attributes": True}
