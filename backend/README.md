# ExpenseIQ - Backend

The backend for ExpenseIQ is a high-performance REST API built with FastAPI. It handles JWT authentication, asynchronous database operations, background task processing for bulk CSV uploads, and Server-Sent Events (SSE) to push live status updates to the client.

## Tech Stack
- **Framework:** FastAPI
- **Database:** PostgreSQL with Async SQLAlchemy
- **Migrations:** Alembic
- **Authentication:** JWT + Passlib (Bcrypt)
- **Data Processing:** Pandas (for CSV parsing)

## Getting Started

### Prerequisites
- Python 3.9+
- PostgreSQL Server

### Installation & Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   
   # Windows
   .venv\Scripts\activate
   # macOS/Linux
   source .venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Environment Configuration
Create a `.env` file in the root of the `backend` directory with the following variables (adjust according to your local setup):
```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/expense_tracker
SECRET_KEY=your_super_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
FRONTEND_URL=http://localhost:5173
```

### Database Migrations
Before running the application, ensure your PostgreSQL database is created and run the migrations:
```bash
alembic upgrade head
```

### Running the Development Server
To start the FastAPI server with hot-reloading:
```bash
uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`. 
You can view the interactive API documentation (Swagger UI) at `http://localhost:8000/docs`.
