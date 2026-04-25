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
