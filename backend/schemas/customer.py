from pydantic import BaseModel
from typing import Optional

class CustomerCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    instagram: Optional[str] = None
    email: Optional[str] = None
    default_address: Optional[str] = None
    notes: Optional[str] = None
    is_vip: bool = False

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    instagram: Optional[str] = None
    email: Optional[str] = None
    default_address: Optional[str] = None
    notes: Optional[str] = None
    is_vip: Optional[bool] = None

class CustomerResponse(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    instagram: Optional[str] = None
    email: Optional[str] = None
    default_address: Optional[str] = None
    notes: Optional[str] = None
    is_vip: bool
    is_active: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
