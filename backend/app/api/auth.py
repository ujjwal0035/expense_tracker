from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, get_current_user
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, Token, LoginRequest, UserUpdate

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    try:
        # Check if email exists
        result = await db.execute(select(User).where(User.email == user_data.email))
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="Email already registered")
            
        # Check if this is the first user
        user_count = await db.execute(select(func.count(User.id)))
        is_first_user = user_count.scalar() == 0
        
        user = User(
            email=user_data.email,
            username=user_data.username,
            full_name=user_data.full_name,
            mobile=user_data.mobile,
            password_hash=get_password_hash(user_data.password),
            role="superadmin" if is_first_user else "free"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise e


@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return JWT token."""
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token)


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get profile info for the logged-in user."""
    return current_user


@router.patch("/me", response_model=UserOut)
async def update_me(
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update user profile. Role cannot be updated here."""
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.username is not None:
        current_user.username = user_update.username
    if user_update.mobile is not None:
        current_user.mobile = user_update.mobile
    if user_update.password is not None:
        current_user.password_hash = get_password_hash(user_update.password)
    
    await db.commit()
    await db.refresh(current_user)
    return current_user
