import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models.user import User

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fallback_secret_key")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "12"))
REMEMBER_DAYS = int(os.getenv("JWT_REMEMBER_DAYS", "7"))

import bcrypt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    # Remove expiration by setting it to 100 years in the future
    expire = datetime.utcnow() + timedelta(days=36500)
        
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("username")
        session_version: int = payload.get("session_version")
        if username is None or session_version is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.username == username, User.is_active == 1))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception
        
    if user.session_version != session_version:
        raise credentials_exception
        
    return user

def require_role(allowed_roles: list[str]):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_checker

admin_only = require_role(["admin"])

admin_only = require_role(["admin"])
