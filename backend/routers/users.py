from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models.user import User
from schemas.user import UserResponse, UserCreate, UserUpdate, UserPasswordReset
from services.auth_service import get_password_hash, require_role

router = APIRouter(prefix="/users", tags=["users"])

admin_only = Depends(require_role(["admin"]))

@router.get("", response_model=List[UserResponse], dependencies=[admin_only])
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    return result.scalars().all()

@router.post("", response_model=UserResponse, dependencies=[admin_only], status_code=status.HTTP_201_CREATED)
async def create_user(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == user_in.username))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
        
    new_user = User(
        username=user_in.username,
        display_name=user_in.display_name or user_in.username,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.get("/{user_id}", response_model=UserResponse, dependencies=[admin_only])
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserResponse, dependencies=[admin_only])
async def update_user(user_id: int, user_update: UserUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    update_data = user_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)
        
    await db.commit()
    await db.refresh(user)
    return user

@router.post("/{user_id}/reset-password", dependencies=[admin_only])
async def reset_password(user_id: int, reset_in: UserPasswordReset, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    user.hashed_password = get_password_hash(reset_in.password)
    user.session_version += 1 # Invalidate existing sessions when password changes
    await db.commit()
    return {"ok": True, "message": "Password reset successfully"}

@router.post("/{user_id}/force-logout", dependencies=[admin_only])
async def force_logout(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    user.session_version += 1
    await db.commit()
    return {"ok": True, "message": "User sessions invalidated"}
