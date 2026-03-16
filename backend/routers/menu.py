from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models.menu_item import MenuItem
from schemas.menu_item import MenuItemResponse, MenuItemCreate, MenuItemUpdate, MenuItemAvailabilityUpdate
from services.auth_service import require_role, get_current_user
from services.audit_service import create_audit_log
from services.firebase_sync import push_sync_task
from models.user import User

router = APIRouter(prefix="/menu", tags=["menu"])

admin_only = Depends(require_role(["admin"]))

@router.get("", response_model=List[MenuItemResponse])
async def list_menu(
    category: Optional[str] = None, 
    available_only: bool = False, 
    db: AsyncSession = Depends(get_db)
):
    query = select(MenuItem)
    if category:
        query = query.where(MenuItem.category == category)
    if available_only:
        query = query.where(MenuItem.is_available == 1)
        
    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=MenuItemResponse, dependencies=[admin_only], status_code=status.HTTP_201_CREATED)
async def create_menu_item(
    item_in: MenuItemCreate, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_item = MenuItem(**item_in.model_dump())
    db.add(new_item)
    await db.flush()
    await create_audit_log(
        db, current_user.id, "create", "menu_item", new_item.id,
        new_value={"name": new_item.name, "price": new_item.price_paise}
    )
    await db.commit()
    await db.refresh(new_item)
    
    # Sync to Firebase
    push_sync_task(background_tasks, "menu_item", new_item.id, {
        "name": new_item.name,
        "price_paise": new_item.price_paise,
        "category": new_item.category,
        "is_available": new_item.is_available
    })
    
    return new_item

@router.get("/{item_id}", response_model=MenuItemResponse)
async def get_menu_item(
    item_id: int, 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
    return item

@router.put("/{item_id}", response_model=MenuItemResponse, dependencies=[admin_only])
async def update_menu_item(
    item_id: int, 
    item_update: MenuItemUpdate, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
        
    old_val = {"name": item.name, "price": item.price_paise, "is_available": item.is_available}
    update_data = item_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
        
    await create_audit_log(
        db, current_user.id, "update", "menu_item", item.id,
        old_value=old_val, new_value={"name": item.name, "price": item.price_paise, "is_available": item.is_available}
    )
    await db.commit()
    await db.refresh(item)
    
    # Sync to Firebase
    push_sync_task(background_tasks, "menu_item", item.id, {
        "name": item.name,
        "price_paise": item.price_paise,
        "category": item.category,
        "is_available": item.is_available
    })
    
    return item

@router.patch("/{item_id}/availability", response_model=MenuItemResponse, dependencies=[admin_only])
async def toggle_availability(
    item_id: int, 
    avail_in: MenuItemAvailabilityUpdate, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
        
    old_bool = item.is_available
    item.is_available = avail_in.is_available
    await create_audit_log(
        db, current_user.id, "update", "menu_item", item.id,
        old_value={"is_available": old_bool}, new_value={"is_available": item.is_available}
    )
    await db.commit()
    await db.refresh(item)
    
    # Sync to Firebase
    push_sync_task(background_tasks, "menu_item", item.id, {
        "is_available": item.is_available
    })
    
    return item
