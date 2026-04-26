from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
import uuid

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.user import UserOut

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])

async def check_superadmin(current_user: User = Depends(get_current_user)):
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only SuperAdmin can access this resource"
        )
    return current_user

@router.get("/users", response_model=List[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(check_superadmin)
):
    """List all users in the system."""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()

@router.patch("/users/{user_id}/role", response_model=UserOut)
async def update_user_role(
    user_id: uuid.UUID,
    role: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(check_superadmin)
):
    """Update a user's role. Allowed roles: superadmin, premium, free."""
    if role not in ["superadmin", "premium", "free"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = role
    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(check_superadmin)
):
    """Delete a user."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
    await db.delete(user)
    await db.commit()
    return {"detail": "User deleted"}
