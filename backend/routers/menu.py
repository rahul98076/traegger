from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models.menu_item import MenuItem
from models.menu_item_constituent import MenuItemConstituent
from schemas.menu_item import (
    MenuItemResponse, MenuItemCreate, MenuItemUpdate, 
    MenuItemAvailabilityUpdate, MenuItemConstituentCreate, 
    MenuItemConstituentResponse
)
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
        "size_unit": new_item.size_unit,
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
        "size_unit": item.size_unit,
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

@router.get("/{item_id}/constituents", response_model=List[MenuItemConstituentResponse])
async def get_constituents(item_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(MenuItemConstituent, MenuItem.name)
        .join(MenuItem, MenuItemConstituent.child_item_id == MenuItem.id)
        .where(MenuItemConstituent.parent_item_id == item_id)
    )
    constituents = []
    for row in result:
        const = row[0]
        child_name = row[1]
        constituents.append({
            "parent_item_id": const.parent_item_id,
            "child_item_id": const.child_item_id,
            "quantity": const.quantity,
            "child_item_name": child_name
        })
    return constituents

@router.post("/{item_id}/constituents", response_model=MenuItemConstituentResponse, dependencies=[admin_only], status_code=status.HTTP_201_CREATED)
async def add_constituent(
    item_id: int, 
    constituent_in: MenuItemConstituentCreate, 
    db: AsyncSession = Depends(get_db)
):
    # Verify child item exists
    child_res = await db.execute(select(MenuItem).where(MenuItem.id == constituent_in.child_item_id))
    child_item = child_res.scalar_one_or_none()
    if not child_item:
        raise HTTPException(status_code=404, detail="Child menu item not found")

    # Check if already exists, if so update quantity
    existing_res = await db.execute(
        select(MenuItemConstituent)
        .where(MenuItemConstituent.parent_item_id == item_id, MenuItemConstituent.child_item_id == constituent_in.child_item_id)
    )
    existing = existing_res.scalar_one_or_none()
    
    if existing:
        existing.quantity = constituent_in.quantity
        await db.commit()
        await db.refresh(existing)
        return {
            "parent_item_id": existing.parent_item_id,
            "child_item_id": existing.child_item_id,
            "quantity": existing.quantity,
            "child_item_name": child_item.name
        }
    else:
        new_const = MenuItemConstituent(
            parent_item_id=item_id,
            child_item_id=constituent_in.child_item_id,
            quantity=constituent_in.quantity
        )
        db.add(new_const)
        await db.commit()
        await db.refresh(new_const)
        return {
            "parent_item_id": new_const.parent_item_id,
            "child_item_id": new_const.child_item_id,
            "quantity": new_const.quantity,
            "child_item_name": child_item.name
        }

@router.delete("/{item_id}/constituents/{child_id}", dependencies=[admin_only])
async def remove_constituent(item_id: int, child_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(MenuItemConstituent)
        .where(MenuItemConstituent.parent_item_id == item_id, MenuItemConstituent.child_item_id == child_id)
    )
    const = res.scalar_one_or_none()
    if not const:
        raise HTTPException(status_code=404, detail="Constituent not found")
        
    await db.delete(const)
    await db.commit()
    return {"ok": True}
