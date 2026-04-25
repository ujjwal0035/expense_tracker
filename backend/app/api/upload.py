import asyncio
import json
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, AsyncSessionLocal
from app.core.security import get_current_user
from app.models.user import User
from app.models.upload_job import UploadJob
from app.schemas.upload_job import UploadJobOut
from app.services.csv_worker import process_csv_upload

router = APIRouter(prefix="/api/v1/expenses", tags=["Upload"])


@router.post("/upload", response_model=UploadJobOut, status_code=202)
async def upload_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Accept a CSV file upload and process it in the background.

    Returns a job ID that can be used to track progress via SSE.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    content = await file.read()

    # Create upload job record
    job = UploadJob(user_id=current_user.id, status="PENDING")
    db.add(job)
    await db.flush()
    await db.refresh(job)

    # Schedule background processing
    background_tasks.add_task(process_csv_upload, job.id, current_user.id, content)

    return job


@router.get("/stream/{job_id}")
async def stream_job_status(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
):
    """SSE endpoint that streams real-time upload job status updates.

    The client connects via EventSource and receives JSON events
    until the job reaches a terminal state (COMPLETED or FAILED).
    """

    async def event_generator():
        while True:
            async with AsyncSessionLocal() as db:
                job = await db.get(UploadJob, job_id)
                if not job or job.user_id != current_user.id:
                    yield f"data: {json.dumps({'error': 'Job not found'})}\n\n"
                    return

                event_data = {
                    "status": job.status,
                    "total_rows": job.total_rows,
                    "processed_rows": job.processed_rows,
                }

                if job.error_log:
                    event_data["error_log"] = job.error_log

                yield f"data: {json.dumps(event_data)}\n\n"

                if job.status in ("COMPLETED", "FAILED"):
                    return

            await asyncio.sleep(0.5)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
