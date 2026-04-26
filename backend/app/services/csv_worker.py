import csv
import io
import uuid
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.expense import Expense
from app.models.upload_job import UploadJob
from app.schemas.expense import ExpenseCreate


async def process_csv_upload(job_id: uuid.UUID, user_id: uuid.UUID, file_content: bytes):
    """Background worker that parses a CSV file, validates rows, and inserts expenses.

    This function runs inside a single ACID transaction. If any row fails
    validation, the entire transaction is rolled back to prevent partial data.
    """
    async with AsyncSessionLocal() as db:
        try:
            # Update job status to PROCESSING
            job = await db.get(UploadJob, job_id)
            if not job:
                return
            job.status = "PROCESSING"
            await db.commit()

            # Parse CSV with encoding fallback
            try:
                text = file_content.decode("utf-8")
            except UnicodeDecodeError:
                # Fallback to latin-1 which accepts all byte values
                text = file_content.decode("latin-1", errors="replace")
            reader = csv.DictReader(io.StringIO(text))
            rows = list(reader)

            job.total_rows = len(rows)
            await db.commit()

            if len(rows) > 200:
                job.status = "FAILED"
                job.error_log = {"error": f"CSV has {len(rows)} rows, maximum is 200"}
                await db.commit()
                return

            # Validate all rows with Pydantic before inserting
            validated_expenses = []
            errors = []

            for i, row in enumerate(rows, start=1):
                try:
                    # Normalize column names (strip whitespace, lowercase)
                    normalized = {k.strip().lower(): v.strip() for k, v in row.items()}

                    # Robust Column Mapping
                    def get_val(keys, default=""):
                        for k in keys:
                            if k in normalized: return normalized[k]
                        return default

                    raw_date = get_val(["expense_date", "date", "expense date"])
                    raw_amount = get_val(["amount", "amt", "value", "cost"], "0")
                    raw_category = get_val(["category", "cat", "type"], "Other")
                    raw_description = get_val(["description", "desc", "note", "memo"])

                    parsed_date = None
                    # Try common formats
                    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%m-%d-%Y", "%d/%m/%Y", "%Y/%m/%d", "%b %d, %Y", "%d %b, %Y"):
                        try:
                            from datetime import datetime
                            parsed_date = datetime.strptime(raw_date, fmt).date()
                            break
                        except ValueError:
                            continue
                    
                    if not parsed_date:
                        raise ValueError(f"Invalid date format: {raw_date}. Supported: YYYY-MM-DD, DD-MM-YYYY, MM-DD-YYYY")

                    expense_data = ExpenseCreate(
                        amount=float(raw_amount.replace(",", "")),
                        category=raw_category,
                        expense_date=parsed_date,
                        description=raw_description,
                    )
                    validated_expenses.append(expense_data)
                except Exception as e:
                    errors.append({"row": i, "error": str(e)})

                # Update progress
                job.processed_rows = i
                await db.commit()

            if errors:
                # Validation failed - do NOT insert anything
                job.status = "FAILED"
                job.error_log = {"validation_errors": errors}
                await db.commit()
                return

            # Insert all validated expenses in a single transaction
            for expense_data in validated_expenses:
                expense = Expense(
                    user_id=user_id,
                    amount=expense_data.amount,
                    category=expense_data.category,
                    expense_date=expense_data.expense_date,
                    description=expense_data.description,
                )
                db.add(expense)

            await db.flush()

            job.status = "COMPLETED"
            await db.commit()

        except Exception as e:
            await db.rollback()
            # Try to update job status to FAILED
            try:
                async with AsyncSessionLocal() as error_db:
                    job = await error_db.get(UploadJob, job_id)
                    if job:
                        job.status = "FAILED"
                        job.error_log = {"error": str(e)}
                        await error_db.commit()
            except Exception:
                pass
