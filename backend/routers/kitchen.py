from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_

from database import get_db
from models.order import Order, OrderItem
from models.customer import Customer
from models.menu_item import MenuItem
from services.auth_service import get_current_user, require_role
from services.audit_service import create_audit_log

router = APIRouter(prefix="/kitchen", tags=["kitchen"])

@router.get("/active-orders")
async def get_active_orders(
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """Fetch all orders that need fulfillment (Confirmed/In Progress)."""
    # Build query
    stmt = (
        select(Order)
        .where(Order.status.in_(["confirmed", "in_progress", "ready"]))
        .where(Order.is_deleted == 0)
        .order_by(Order.due_date.asc(), Order.id.asc())
    )
    result = await db.execute(stmt)
    orders = result.scalars().all()
    
    # Enrich with items and customers
    # (Reusing a simpler version of _build_response logic or just returning raw nested)
    response = []
    for order in orders:
        # Get customer
        cust_q = await db.execute(select(Customer).where(Customer.id == order.customer_id))
        customer = cust_q.scalar_one_or_none()
        
        # Get all items
        items_q = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
        all_items = items_q.scalars().all()
        
        # Map menu item names
        mi_ids = [i.menu_item_id for i in all_items if i.menu_item_id]
        mi_map = {}
        if mi_ids:
            mi_q = await db.execute(select(MenuItem).where(MenuItem.id.in_(mi_ids)))
            mi_map = {m.id: m for m in mi_q.scalars().all()}
            
        # Build hierarchy
        items_lookup = {i.id: i for i in all_items}
        top_items = []
        for i in all_items:
            item_data = {
                "id": i.id,
                "menu_item_id": i.menu_item_id,
                "name": mi_map[i.menu_item_id].name if i.menu_item_id in mi_map else i.custom_name,
                "quantity": i.quantity,
                "status": i.status,
                "parent_item_id": i.parent_item_id,
                "sub_items": []
            }
            items_lookup[i.id]._data = item_data # Temporary storage
            
        for i in all_items:
            if i.parent_item_id and i.parent_item_id in items_lookup:
                items_lookup[i.parent_item_id]._data["sub_items"].append(i._data)
            else:
                top_items.append(i._data)
        
        response.append({
            "id": order.id,
            "customer_name": customer.name if customer else "Unknown",
            "due_date": order.due_date,
            "status": order.status,
            "fulfillment_type": order.fulfillment_type,
            "total_items": len(all_items),
            "ready_items": len([i for i in all_items if i.status == "ready"]),
            "items": top_items
        })
        
    return response

@router.patch("/items/{item_id}/status")
async def update_item_status(
    item_id: int,
    status: str, # "pending", "ready"
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if status not in ["pending", "ready"]:
        raise HTTPException(400, "Invalid status")
        
    item_res = await db.execute(select(OrderItem).where(OrderItem.id == item_id))
    item = item_res.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Item not found")
        
    # Update item and all children if it's a basket
    def set_status_recursive(target_item, new_status):
        target_item.status = new_status
        # We need to fetch sub-items to be sure
    
    item.status = status
    
    # If it's a basket, mark all children as same status
    child_res = await db.execute(select(OrderItem).where(OrderItem.parent_item_id == item.id))
    children = child_res.scalars().all()
    for child in children:
        child.status = status
        
    # If it's a child being marked ready, check if all siblings are ready to mark parent?
    # Actually, let's keep it simple: manual per-row or manual-per-basket.
        
    await db.flush()
    
    # Check if whole order is ready
    order_id = item.order_id
    all_is_q = await db.execute(select(OrderItem).where(OrderItem.order_id == order_id))
    all_is = all_is_q.scalars().all()
    
    if all(i.status == "ready" for i in all_is):
        order_res = await db.execute(select(Order).where(Order.id == order_id))
        order = order_res.scalar_one()
        if order.status != "ready":
            order.status = "ready"
            await create_audit_log(db, current_user.id, "auto_ready", "order", order_id)
    else:
        # If any item is pending, make sure order isn't "ready"
        order_res = await db.execute(select(Order).where(Order.id == order_id))
        order = order_res.scalar_one()
        if order.status == "ready":
            order.status = "in_progress"
            
    await db.commit()
    return {"ok": True}

