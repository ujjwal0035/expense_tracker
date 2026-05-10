# ExpenseIQ - Smart Expense Tracker & Analytics

ExpenseIQ is a full-stack expense tracking and analytics application that allows users to manage their expenses, upload bulk CSVs, and view interactive financial dashboards in real time.

## Application Structure

The project is split into two main components:
- **[Backend](./backend/README.md)**: A FastAPI application utilizing PostgreSQL, background task processing, and Server-Sent Events (SSE) for live updates.
- **[Frontend](./frontend/README.md)**: A modern React application built with Vite, Tailwind CSS v4, and Recharts for interactive analytics.

## How to Start the Application Flow

To run the application locally, you'll need to start both the backend server and the frontend development server.

### 1. Start the Database
Ensure you have PostgreSQL running locally and create a database named `expense_tracker` (or match your `.env` configuration).

### 2. Start the Backend
Open a terminal, navigate to the `backend` directory, and run the FastAPI server:
```bash
cd backend
# Activate your virtual environment (e.g., .venv\Scripts\activate on Windows)
# Install dependencies if you haven't: pip install -r requirements.txt
uvicorn app.main:app --reload
```
The backend will run on `http://localhost:8000`.

### 3. Start the Frontend
Open a separate terminal, navigate to the `frontend` directory, and run the React app:
```bash
cd frontend
# Install dependencies if you haven't: npm install
npm run dev
```
The frontend will run on `http://localhost:5173`. Open this URL in your browser to access the ExpenseIQ dashboard.

For detailed setup instructions, including environment variables and database migrations, please refer to the respective `README.md` files in the `frontend` and `backend` directories.

## Run with Docker

This repo includes a Docker Compose setup for the FastAPI backend and the production React frontend served by Nginx. The backend connects to your local PostgreSQL database on the host machine.

Before starting Docker, create a local root `.env` file from the committed example:

```bash
copy .env.example .env
```

Then edit `.env` so it matches your local PostgreSQL credentials. On Docker Desktop, use `host.docker.internal` instead of `localhost`:

```env
postgresql+psycopg://postgres:1234@host.docker.internal:5432/postgres
```

The real `.env` file is ignored by Git and should not be pushed.

### Start the full app

```bash
docker compose up --build
```

Then open:
- Frontend: `http://localhost`
- Backend API docs: `http://localhost:8000/docs`

The backend container runs `alembic upgrade head` before starting the API, so any pending migrations are applied to your local PostgreSQL database.

### Stop the app

```bash
docker compose down
```

For production, set `SECRET_KEY` and `DATABASE_URL` through your deployment environment or a private `.env` file. Do not commit real secrets.
