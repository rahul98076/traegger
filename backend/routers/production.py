from typing import Optional
from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_

from database import get_db
from models.order import Order, OrderItem
from models.menu_item import MenuItem
from models.customer import Customer
from services.auth_service import get_current_user

router = APIRouter(prefix="/production", tags=["production"])

ACTIVE_STATUSES = ("confirmed", "in_progress", "ready")


@router.get("/summary")
async def production_summary(
    date_filter: Optional[str] = Query(None, alias="date"),
    range_from: Optional[str] = Query(None, alias="from"),
    range_to: Optional[str] = Query(None, alias="to"),
    range_preset: Optional[str] = Query(None, alias="range"),
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    # Determine date range
    today_str = date.today().isoformat()
    
    filters = [
        Order.status.in_(ACTIVE_STATUSES),
        Order.is_deleted == 0,
    ]
    
    if date_filter:
        filters.append(Order.due_date == date_filter)
    elif range_from and range_to:
        filters.append(Order.due_date >= range_from)
        filters.append(Order.due_date <= range_to)
    elif range_preset == "tomorrow":
        tomorrow_str = (date.today() + timedelta(days=1)).isoformat()
        filters.append(Order.due_date == tomorrow_str)
    elif range_preset == "week":
        week_str = (date.today() + timedelta(days=6)).isoformat()
        filters.append(Order.due_date >= today_str)
        filters.append(Order.due_date <= week_str)
    elif range_preset == "upcoming":
        filters.append(Order.due_date >= today_str)
    else:
        # Default fallback
        filters.append(Order.due_date >= today_str)

    orders_q = await db.execute(select(Order).where(and_(*filters)))
    orders = orders_q.scalars().all()

    if not orders:
        return {"days": []}

    order_ids = [o.id for o in orders]
    order_map = {o.id: o for o in orders}

    # Fetch customer names
    cust_ids = list(set(o.customer_id for o in orders))
    cust_q = await db.execute(select(Customer).where(Customer.id.in_(cust_ids)))
    cust_map = {c.id: c.name for c in cust_q.scalars().all()}

    # Fetch all order items for these orders
    items_q = await db.execute(
        select(OrderItem).where(OrderItem.order_id.in_(order_ids))
    )
    all_items = items_q.scalars().all()

    # Fetch menu item info
    mi_ids = list(set(oi.menu_item_id for oi in all_items))
    mi_q = await db.execute(select(MenuItem).where(MenuItem.id.in_(mi_ids)))
    mi_map = {m.id: m for m in mi_q.scalars().all()}

    # Aggregate by (due_date, menu_item_id)
    date_agg = {}
    for oi in all_items:
        order = order_map.get(oi.order_id)
        if not order: continue
        d_date = order.due_date
        
        if d_date not in date_agg:
            date_agg[d_date] = {}
            
        # Determine unique key for aggregation (Menu Item vs Custom Basket)
        if oi.menu_item_id:
            agg_key = f"mi_{oi.menu_item_id}"
            mi = mi_map.get(oi.menu_item_id)
            item_name = mi.name if mi else f"Item #{oi.menu_item_id}"
            size_unit = mi.size_unit if mi else ""
            is_available = bool(mi.is_available) if mi else True
        else:
            agg_key = f"custom_{oi.custom_name}"
            item_name = oi.custom_name or "Unnamed Basket"
            size_unit = "basket"
            is_available = True
            
        if agg_key not in date_agg[d_date]:
            date_agg[d_date][agg_key] = {
                "key": agg_key,
                "menu_item_id": oi.menu_item_id,
                "name": item_name,
                "size_unit": size_unit,
                "is_available": is_available,
                "total_quantity": 0,
                "orders": [],
            }
        
        date_agg[d_date][agg_key]["total_quantity"] += oi.quantity
        date_agg[d_date][agg_key]["orders"].append({
            "order_id": oi.order_id,
            "customer_name": cust_map.get(order.customer_id, "Unknown"),
            "quantity": oi.quantity,
            "due_date": d_date,
        })

    # Format into list grouped by date
    days_list = []
    for d_date in sorted(date_agg.keys()):
        items_list = sorted(date_agg[d_date].values(), key=lambda x: x["name"])
        days_list.append({
            "date": d_date,
            "items": items_list
        })

    return {"days": days_list}
