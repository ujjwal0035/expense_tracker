from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.cache import init_cache
from app.api import auth, expenses, analytics, upload, admin, categories, budgets

import sys
import asyncio
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown hooks."""
    # Startup
    await init_cache()
    yield
    # Shutdown — dispose engine
    from app.core.database import engine
    await engine.dispose()


app = FastAPI(
    title="Expense Tracker API",
    description="Full-stack expense tracking and analytics application",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(expenses.router)
app.include_router(analytics.router)
app.include_router(upload.router)
app.include_router(admin.router)
app.include_router(categories.router)
app.include_router(budgets.router)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}
