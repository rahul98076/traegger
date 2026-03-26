from pydantic import BaseModel
from typing import Optional, List

class MenuItemBase(BaseModel):
    name: str
    category: str
    size_unit: str
    price_paise: int
    is_available: int = 1
    notes: Optional[str] = None

class MenuItemCreate(MenuItemBase):
    pass

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    size_unit: Optional[str] = None
    price_paise: Optional[int] = None
    notes: Optional[str] = None

class MenuItemAvailabilityUpdate(BaseModel):
    is_available: int

class MenuItemResponse(MenuItemBase):
    id: int
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True

class MenuItemConstituentCreate(BaseModel):
    child_item_id: int
    quantity: int

class MenuItemConstituentResponse(BaseModel):
    parent_item_id: int
    child_item_id: int
    quantity: int
    child_item_name: Optional[str] = None
    
    class Config:
        from_attributes = True
