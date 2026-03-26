from typing import Optional
from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_

from database import get_db
from models.order import Order, OrderItem
from models.menu_item import MenuItem
from models.menu_item_constituent import MenuItemConstituent
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
        return {"days": [], "grand_totals": []}

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

    # Load all constituents mapping
    const_q = await db.execute(select(MenuItemConstituent))
    all_constituents = const_q.scalars().all()
    
    # Map parent_id -> list of child_constituents
    combo_map = {}
    for c in all_constituents:
        if c.parent_item_id not in combo_map:
            combo_map[c.parent_item_id] = []
        combo_map[c.parent_item_id].append(c)

    # We also need to fetch MenuItems to get names of children if they weren't natively in the orders.
    # To be safe, fetch ALL menu items into a dictionary
    mi_q = await db.execute(select(MenuItem))
    mi_map = {m.id: m for m in mi_q.scalars().all()}

    # Aggregate by (due_date, menu_item_id)
    date_agg = {}
    grand_agg = {}

    def track_item(d_date, agg_key, item_name, size_unit, is_available, qty, order_id, oi_menu_id):
        # By Date aggregation
        if d_date not in date_agg:
            date_agg[d_date] = {}
            
        if agg_key not in date_agg[d_date]:
            date_agg[d_date][agg_key] = {
                "key": agg_key,
                "menu_item_id": oi_menu_id,
                "name": item_name,
                "size_unit": size_unit,
                "is_available": is_available,
                "total_quantity": 0,
                "orders": [],
            }
        
        date_agg[d_date][agg_key]["total_quantity"] += qty
        date_agg[d_date][agg_key]["orders"].append({
            "order_id": order_id,
            "customer_name": cust_map.get(order_map[order_id].customer_id, "Unknown"),
            "quantity": qty,
            "due_date": d_date,
        })
        
        # Grand Aggregation
        if agg_key not in grand_agg:
            grand_agg[agg_key] = {
                "key": agg_key,
                "name": item_name,
                "size_unit": size_unit,
                "is_available": is_available,
                "total_quantity": 0
            }
        grand_agg[agg_key]["total_quantity"] += qty

    for oi in all_items:
        order = order_map.get(oi.order_id)
        if not order: continue
        d_date = order.due_date
        
        # Determine if it's a fixed menu item
        if oi.menu_item_id:
            # Check if it has constituents
            recipe = combo_map.get(oi.menu_item_id)
            if recipe:
                # It's a combo! Explode it into parts. (Parent disappears from kitchen view)
                for child in recipe:
                    child_mi = mi_map.get(child.child_item_id)
                    child_qty = oi.quantity * child.quantity
                    
                    agg_key = f"mi_{child.child_item_id}"
                    item_name = child_mi.name if child_mi else f"Item #{child.child_item_id}"
                    size_unit = child_mi.size_unit if child_mi else ""
                    is_available = bool(child_mi.is_available) if child_mi else True
                    
                    track_item(d_date, agg_key, item_name, size_unit, is_available, child_qty, oi.order_id, child.child_item_id)
            else:
                # Normal singular item
                agg_key = f"mi_{oi.menu_item_id}"
                mi = mi_map.get(oi.menu_item_id)
                item_name = mi.name if mi else f"Item #{oi.menu_item_id}"
                size_unit = oi.custom_unit or (mi.size_unit if mi else "")
                is_available = bool(mi.is_available) if mi else True
                
                track_item(d_date, agg_key, item_name, size_unit, is_available, oi.quantity, oi.order_id, oi.menu_item_id)
        else:
            # Custom unmapped basket (cashier typed it natively)
            agg_key = f"custom_{oi.custom_name}"
            item_name = oi.custom_name or "Unnamed Basket"
            size_unit = oi.custom_unit or "basket"
            is_available = True
            
            track_item(d_date, agg_key, item_name, size_unit, is_available, oi.quantity, oi.order_id, None)

    # Format into list grouped by date
    days_list = []
    for d_date in sorted(date_agg.keys()):
        items_list = sorted(date_agg[d_date].values(), key=lambda x: x["name"])
        days_list.append({
            "date": d_date,
            "items": items_list
        })
        
    # Format global totals
    grand_totals_list = sorted(grand_agg.values(), key=lambda x: x["total_quantity"], reverse=True)

    return {"days": days_list, "grand_totals": grand_totals_list}
