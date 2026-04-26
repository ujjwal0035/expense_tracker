from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.category import Category
from app.schemas.category import CategoryOut, CategoryCreate

router = APIRouter(prefix="/api/v1/categories", tags=["Categories"])

async def check_superadmin(current_user: User = Depends(get_current_user)):
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only SuperAdmin can manage categories"
        )
    return current_user

@router.get("/", response_model=List[CategoryOut])
async def list_categories(db: AsyncSession = Depends(get_db)):
    """Get all available categories."""
    result = await db.execute(select(Category).order_by(Category.name))
    return result.scalars().all()

@router.post("/", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(check_superadmin)
):
    """Create a new category (SuperAdmin only)."""
    # Check if exists
    result = await db.execute(select(Category).where(Category.name == category_data.name))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Category already exists")
    
    category = Category(name=category_data.name)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category

@router.patch("/{category_id}", response_model=CategoryOut)
async def update_category(
    category_id: str,
    category_data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(check_superadmin)
):
    """Update a category name (SuperAdmin only)."""
    import uuid
    try:
        u_id = uuid.UUID(category_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    result = await db.execute(select(Category).where(Category.id == u_id))
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check if new name exists
    exist_check = await db.execute(select(Category).where(Category.name == category_data.name))
    if exist_check.scalars().first():
        raise HTTPException(status_code=400, detail="Category name already exists")
    
    category.name = category_data.name
    await db.commit()
    await db.refresh(category)
    return category


@router.delete("/{category_id}")
async def delete_category(
    category_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(check_superadmin)
):
    """Delete a category (SuperAdmin only)."""
    import uuid
    try:
        u_id = uuid.UUID(category_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    result = await db.execute(select(Category).where(Category.id == u_id))
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    await db.delete(category)
    await db.commit()
    return {"detail": "Category deleted"}
