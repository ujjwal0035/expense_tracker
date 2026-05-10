# AI Development Guidelines

This document outlines the strict rules, architectural patterns, and development guidelines for the ExpenseIQ project. **All AI agents must read and adhere to this document before implementing changes.**

## 1. Project Overview

ExpenseIQ is a full-stack expense tracking and analytics application.
- **Root Directory**: `d:\coders\expense_tracker`
- **Frontend Directory**: `./frontend`
- **Backend Directory**: `./backend`

## 2. Frontend Guidelines

The frontend is a modern React SPA using Vite.

### Tech Stack & Architecture
- **Framework**: React 19 + Vite
- **Routing**: `react-router-dom`
- **State Management**: Context API (`ThemeContext.jsx`, `DashboardContext.jsx`) is used for global state. For remote data fetching, `@tanstack/react-query` or `useEffect` hooks with local state are used.
- **API Integration**: All API calls must go through the configured Axios instance in `src/services/api.js`. This instance uses interceptors to automatically attach the JWT token from `localStorage` and handles 401 unauthenticated redirects.
- **UI Components**: `antd` (Ant Design 6)
- **Styling**: `tailwindcss` v4 (with custom `@theme` variables in `index.css`)
- **Icons**: `@ant-design/icons`, `lucide-react`
- **Charts & Data Viz**: `d3`, `recharts`
- **Forms & Toast**: `react-hot-toast`, Ant Design `Form`

### D3.js Integration Pattern
When working with D3.js inside React components:
- Use `useRef` to reference a container `<div>` or `<svg>`.
- Use `useEffect` to execute the D3 manipulation logic. Ensure you clear the SVG contents (`d3.select(svgRef.current).selectAll('*').remove()`) at the start of the effect to prevent duplicate rendering when dependencies change.

### Styling Rules
- **Dark Mode Compatibility**: All new components MUST support dark mode. When using Tailwind utility classes, always provide a `dark:` variant (e.g., `bg-slate-50 dark:bg-slate-800/50`).
- **CSS Variables**: Prefer using CSS variables defined in `index.css` (e.g., `var(--color-bg-card)`, `var(--color-accent)`) when writing custom CSS.
- **Ant Design Overrides**: Ant Design component styles are globally overridden in `index.css` to match the application's dark mode and glassmorphism design. Do not inline styles unless absolutely necessary.
- **Aesthetics**: Follow the "Premium Design" guidelines. Avoid plain designs. Utilize glassmorphic effects (e.g., `backdrop-blur`, subtle borders), smooth transitions, and gradients where appropriate.

## 3. Backend Guidelines

The backend is an asynchronous REST API.

### Tech Stack & Architecture
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy 2.0 with `AsyncSession`
- **Migrations**: Alembic
- **Schemas**: Pydantic v2
- **Caching**: Local memory caching (`app.core.cache`)

### Core Rules
- **Asynchronous Operations**: All database queries must be asynchronous. Use `await db.execute(select(...))` instead of synchronous patterns.
- **ACID Transactions**: For bulk operations or multi-table updates, ensure operations are wrapped in a single transaction (using `db.commit()` only after all `db.add()` calls).
- **Authentication**: Endpoints should use the `get_current_user` dependency from `app.core.security`.
- **Validation**: Use Pydantic `BaseModel` and `Field` for robust request validation in `app/schemas`.
- **Cache Invalidation**: If an endpoint modifies user data (Expense, Budget, Category), it MUST invalidate the user's cache using `await invalidate_user_cache(str(current_user.id))` to ensure the frontend receives fresh data.

### Migrations
If you modify SQLAlchemy models in `app/models`, you MUST generate and apply an Alembic migration.
- Generate: `alembic revision --autogenerate -m "description_of_change"`
- Apply: `alembic upgrade head`
Always run these commands from the `./backend` directory.

## 4. Development Workflow & Commands

- **Environment**: The application runs via Docker Compose.
- **Start the App**: `docker compose up --build`
- **Database Operations**: When running `docker compose up`, the backend container automatically runs `alembic upgrade head` before starting the API.
- **Error Handling**: Use `toast.error()` on the frontend for API errors. On the backend, throw `HTTPException` with clear `detail` messages.

## 5. Security & Isolation
- Do not commit `.env` files or hardcode secrets in the repository.
- Ensure all API endpoints validate that the requested resource (e.g., Expense) actually belongs to `current_user.id` using `where(Model.user_id == current_user.id)`.

**Failure to follow these rules will result in visual inconsistencies, broken database migrations, or authentication vulnerabilities.**
