import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    mobile: Optional[str] = None
    password: str


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    username: str
    full_name: str
    mobile: Optional[str]
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    mobile: Optional[str] = None
    password: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
