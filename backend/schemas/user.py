from pydantic import BaseModel

class UserLogin(BaseModel):
    username: str
    password: str
    remember_me: bool = False

class UserResponse(BaseModel):
    id: int
    username: str
    display_name: str
    role: str
    is_active: bool
    session_version: int
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class UserCreate(BaseModel):
    username: str
    display_name: str | None = None
    password: str
    role: str

class UserUpdate(BaseModel):
    display_name: str | None = None
    role: str | None = None
    is_active: bool | None = None

class UserPasswordReset(BaseModel):
    password: str

