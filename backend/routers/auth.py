from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models.user import User
from schemas.user import Token, UserResponse, UserLogin
from services.auth_service import (
    verify_password,
    create_access_token,
    get_current_user,
    EXPIRE_HOURS,
    REMEMBER_DAYS
)

router = APIRouter(prefix="/auth", tags=["auth"])


async def _do_login(username: str, password: str, remember_me: bool, db: AsyncSession):
    """Shared login logic for both JSON and form-data paths."""
    result = await db.execute(select(User).where(User.username == username, User.is_active == 1))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    expires = timedelta(days=REMEMBER_DAYS) if remember_me else timedelta(hours=EXPIRE_HOURS)
    access_token = create_access_token(
        data={"username": user.username, "role": user.role, "session_version": user.session_version},
        expires_delta=expires,
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.post("/login", response_model=Token)
async def login(request: Request, db: AsyncSession = Depends(get_db)):
    content_type = request.headers.get("content-type", "")

    if "application/x-www-form-urlencoded" in content_type:
        # Swagger UI / OAuth2 form-data path
        form = await request.form()
        username = form.get("username", "")
        password = form.get("password", "")
        remember_me = form.get("remember_me", "false").lower() in ("true", "1")
    else:
        # Frontend JSON path
        body = await request.json()
        login_data = UserLogin(**body)
        username = login_data.username
        password = login_data.password
        remember_me = login_data.remember_me

    return await _do_login(username, password, remember_me, db)


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    return {"ok": True}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
