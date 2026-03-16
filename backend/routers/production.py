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
    today = date.today()
    if date_filter:
        start = end = date_filter
    elif range_from and range_to:
        start, end = range_from, range_to
    elif range_preset == "tomorrow":
        tomorrow = today + timedelta(days=1)
        start = end = tomorrow.isoformat()
    elif range_preset == "week":
        start = today.isoformat()
        end = (today + timedelta(days=6)).isoformat()
    else:
        # Default: today
        start = end = today.isoformat()

    # Query orders in range with active statuses, not deleted
    orders_q = await db.execute(
        select(Order)
        .where(
            and_(
                Order.due_date >= start,
                Order.due_date <= end,
                Order.status.in_(ACTIVE_STATUSES),
                Order.is_deleted == 0,
            )
        )
    )
    orders = orders_q.scalars().all()

    if not orders:
        return {"date_range": {"from": start, "to": end}, "items": []}

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

    # Aggregate by menu_item_id
    agg = {}  # menu_item_id -> { total_quantity, orders: [] }
    for oi in all_items:
        key = oi.menu_item_id
        if key not in agg:
            mi = mi_map.get(key)
            agg[key] = {
                "menu_item_id": key,
                "name": mi.name if mi else f"Item #{key}",
                "size_unit": mi.size_unit if mi else "",
                "is_available": bool(mi.is_available) if mi else True,
                "total_quantity": 0,
                "orders": [],
            }
        agg[key]["total_quantity"] += oi.quantity
        order = order_map.get(oi.order_id)
        agg[key]["orders"].append({
            "order_id": oi.order_id,
            "customer_name": cust_map.get(order.customer_id, "Unknown") if order else "Unknown",
            "quantity": oi.quantity,
            "due_date": order.due_date if order else "",
        })

    # Sort by name
    items_list = sorted(agg.values(), key=lambda x: x["name"])

    return {"date_range": {"from": start, "to": end}, "items": items_list}
