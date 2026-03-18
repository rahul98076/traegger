import json
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_

from database import get_db
from models.order import Order, OrderItem
from models.customer import Customer
from models.menu_item import MenuItem
from models.user import User
from schemas.order import (
    OrderCreate, OrderUpdate, OrderResponse, OrderItemResponse,
    OrderStatusUpdate, OrderPaymentUpdate,
)
from services.auth_service import require_role, get_current_user
from services.audit_service import create_audit_log
from services.firebase_sync import push_sync_task

router = APIRouter(prefix="/orders", tags=["orders"])

editor_or_admin = Depends(require_role(["editor", "admin"]))
admin_only = Depends(require_role(["admin"]))


# ── helpers ──────────────────────────────────────────────────────

def _calc_totals(subtotal: int, discount_type: Optional[str], discount_value: int):
    """Server-side total calculation per SPEC §8."""
    if discount_type == "flat":
        discount_paise = discount_value
    elif discount_type == "percent":
        discount_paise = round(subtotal * discount_value / 10000)
    else:
        discount_paise = 0
    total = subtotal - discount_paise
    return discount_paise, max(total, 0)


def _derive_payment_status(total_paise: int, amount_paid: int) -> str:
    if amount_paid <= 0:
        return "unpaid"
    if amount_paid >= total_paise:
        return "paid"
    return "partial"


async def _build_response(order: Order, db: AsyncSession) -> dict:
    """Build an OrderResponse dict with customer name and item details."""
    # Fetch customer name
    cust_result = await db.execute(select(Customer.name).where(Customer.id == order.customer_id))
    customer_name = cust_result.scalar_one_or_none() or "Unknown"

    # Fetch items with menu item names
    items_result = await db.execute(
        select(OrderItem, MenuItem.name, MenuItem.size_unit)
        .join(MenuItem, OrderItem.menu_item_id == MenuItem.id, isouter=True)
        .where(OrderItem.order_id == order.id)
    )
    items_map = {}
    for oi, mi_name, mi_size in items_result:
        items_map[oi.id] = OrderItemResponse(
            id=oi.id,
            order_id=oi.order_id,
            menu_item_id=oi.menu_item_id,
            custom_name=oi.custom_name,
            parent_item_id=oi.parent_item_id,
            quantity=oi.quantity,
            unit_price_paise=oi.unit_price_paise,
            line_total_paise=oi.line_total_paise,
            menu_item_name=mi_name,
            menu_item_size_unit=mi_size,
            created_at=oi.created_at or "",
            sub_items=[]
        )
        
    top_level_items = []
    for oir in items_map.values():
        if oir.parent_item_id and oir.parent_item_id in items_map:
            items_map[oir.parent_item_id].sub_items.append(oir)
        else:
            top_level_items.append(oir)

    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=customer_name,
        status=order.status,
        order_date=order.order_date or "",
        due_date=order.due_date,
        fulfillment_type=order.fulfillment_type,
        delivery_address=order.delivery_address,
        subtotal_paise=order.subtotal_paise,
        discount_type=order.discount_type,
        discount_value=order.discount_value,
        discount_paise=order.discount_paise,
        total_paise=order.total_paise,
        payment_status=order.payment_status,
        amount_paid_paise=order.amount_paid_paise,
        special_instructions=order.special_instructions,
        internal_notes=order.internal_notes,
        is_deleted=bool(order.is_deleted),
        deleted_at=order.deleted_at,
        deleted_by=order.deleted_by,
        created_by=order.created_by,
        created_at=order.created_at or "",
        updated_at=order.updated_at or "",
        items=top_level_items,
    )


# ── endpoints ────────────────────────────────────────────────────

@router.get("")
async def list_orders(
    status_filter: Optional[str] = None,
    payment_status: Optional[str] = None,
    due_date: Optional[str] = None,
    customer_id: Optional[int] = None,
    search: Optional[str] = None,
    include_deleted: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Order)

    # Only admin can see deleted orders
    if include_deleted and current_user.role == "admin":
        pass  # show all
    else:
        query = query.where(Order.is_deleted == 0)

    if status_filter:
        statuses = [s.strip() for s in status_filter.split(",")]
        query = query.where(Order.status.in_(statuses))

    if payment_status:
        pay_statuses = [s.strip() for s in payment_status.split(",")]
        query = query.where(Order.payment_status.in_(pay_statuses))

    if due_date:
        query = query.where(Order.due_date == due_date)

    if customer_id:
        query = query.where(Order.customer_id == customer_id)

    if search:
        # Search by customer name — join
        query = query.join(Customer, Order.customer_id == Customer.id).where(
            Customer.name.ilike(f"%{search}%")
        )

    query = query.order_by(Order.due_date.desc(), Order.id.desc())
    result = await db.execute(query)
    orders = result.scalars().all()

    responses = []
    for o in orders:
        responses.append(await _build_response(o, db))
    return responses


@router.post("", dependencies=[editor_or_admin], status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate customer
    cust = await db.execute(select(Customer).where(Customer.id == order_in.customer_id))
    if not cust.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Customer not found")

    # Build order items and calculate subtotal
    subtotal = 0
    top_level_items = []

    def process_item_node(item_in: OrderItemCreate, parent_obj: Optional[OrderItem] = None):
        nonlocal subtotal
        unit_price = item_in.unit_price_paise
        calc_basket_unit = 0
        
        # Create the object first
        obj = OrderItem(
            menu_item_id=item_in.menu_item_id,
            custom_name=item_in.custom_name,
            quantity=item_in.quantity,
            # Placeholder for unit_price_paise, will update if basket
        )
        
        # Recursively process sub-items
        if item_in.sub_items:
            obj.sub_items = []
            for child_in in item_in.sub_items:
                c_obj, c_line_tot = process_item_node(child_in, parent_obj=obj)
                calc_basket_unit += c_line_tot
                obj.sub_items.append(c_obj)
            if unit_price is None:
                unit_price = calc_basket_unit
        elif unit_price is None and item_in.menu_item_id:
            # Note: This is a synchronous check against local cache or we might need to fetch
            # But in the router, we should ideally fetch outside or use a dict mapping
            pass

        obj.unit_price_paise = unit_price or 0
        obj.line_total_paise = obj.quantity * obj.unit_price_paise
        
        if parent_obj is None:
            subtotal += obj.line_total_paise
            top_level_items.append(obj)
        
        return obj, obj.line_total_paise

    # Prefetch menu items to avoid N+1 and async issues inside the tree builder
    all_menu_item_ids = []
    def collect_ids(items):
        for i in items:
            if i.menu_item_id: all_menu_item_ids.append(i.menu_item_id)
            if i.sub_items: collect_ids(i.sub_items)
    collect_ids(order_in.items)
    
    mi_map = {}
    if all_menu_item_ids:
        mi_res = await db.execute(select(MenuItem).where(MenuItem.id.in_(all_menu_item_ids)))
        mi_map = {m.id: m for m in mi_res.scalars().all()}

    def finalize_prices(item_in: OrderItemCreate, obj: OrderItem):
        if obj.unit_price_paise == 0 and obj.menu_item_id and not item_in.sub_items:
            mi = mi_map.get(obj.menu_item_id)
            if mi:
                obj.unit_price_paise = mi.price_paise
                obj.line_total_paise = obj.quantity * obj.unit_price_paise

    # Re-run the logic with proper price fetching
    for item_in in order_in.items:
        obj, _ = process_item_node(item_in)
        # Finalize standalone or leaf prices
        def walk_and_fix(node_in, node_obj):
            finalize_prices(node_in, node_obj)
            if node_obj.sub_items and node_in.sub_items:
                # Recalculate basket price if it was 0
                basket_price = 0
                for c_in, c_obj in zip(node_in.sub_items, node_obj.sub_items):
                    walk_and_fix(c_in, c_obj)
                    basket_price += c_obj.line_total_paise
                if node_in.unit_price_paise is None:
                    node_obj.unit_price_paise = basket_price
                    node_obj.line_total_paise = node_obj.quantity * node_obj.unit_price_paise

        walk_and_fix(item_in, obj)

    discount_paise, total = _calc_totals(subtotal, order_in.discount_type, order_in.discount_value)
    pay_status = _derive_payment_status(total, order_in.amount_paid_paise)

    new_order = Order(
        customer_id=order_in.customer_id,
        due_date=order_in.due_date,
        fulfillment_type=order_in.fulfillment_type,
        delivery_address=order_in.delivery_address,
        subtotal_paise=subtotal,
        discount_type=order_in.discount_type,
        discount_value=order_in.discount_value,
        discount_paise=discount_paise,
        total_paise=total,
        payment_status=pay_status,
        amount_paid_paise=order_in.amount_paid_paise,
        special_instructions=order_in.special_instructions,
        internal_notes=order_in.internal_notes,
        created_by=current_user.id,
    )
    db.add(new_order)
    await db.flush() # Get order.id
    
    # Assign order_id and add items
    all_final_items = []
    def collect_and_bind(items):
        for i in items:
            i.order_id = new_order.id
            all_final_items.append(i)
            if i.sub_items:
                collect_and_bind(i.sub_items)
                
    collect_and_bind(top_level_items)
    for item in all_final_items:
        db.add(item)
    
    await db.flush()
    
    await create_audit_log(
        db, current_user.id, "create", "order", new_order.id,
        new_value={"total_paise": total, "status": "confirmed", "items_count": len(top_level_items)}
    )
    await db.commit()
    await db.refresh(new_order)
    
    # Sync to Firebase
    _items_res = await db.execute(select(OrderItem).where(OrderItem.order_id == new_order.id, OrderItem.parent_item_id == None))
    _items_list = _items_res.scalars().all()
    items_data = [{
        "menu_item_id": i.menu_item_id, "custom_name": i.custom_name, "quantity": i.quantity,
        "unit_price_paise": i.unit_price_paise, "line_total_paise": i.line_total_paise
    } for i in _items_list]
    
    push_sync_task(background_tasks, "order", new_order.id, {
        "customer_id": new_order.customer_id,
        "total_paise": new_order.total_paise,
        "status": new_order.status,
        "due_date": new_order.due_date,
        "fulfillment_type": new_order.fulfillment_type,
        "payment_status": new_order.payment_status,
        "amount_paid_paise": new_order.amount_paid_paise,
        "items": items_data
    })
    
    return await _build_response(new_order, db)


@router.get("/{order_id}")
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return await _build_response(order, db)


@router.put("/{order_id}", dependencies=[editor_or_admin])
async def update_order(
    order_id: int,
    order_in: OrderUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Capture old values for audit
    old_val = {"status": order.status, "total_paise": order.total_paise, "payment_status": order.payment_status}

    # Update simple fields
    for field in ["customer_id", "due_date", "fulfillment_type", "delivery_address",
                  "special_instructions", "internal_notes"]:
        val = getattr(order_in, field, None)
        if val is not None:
            setattr(order, field, val)

    # Recalculate if items changed
    if order_in.items is not None:
        # Delete existing items
        existing = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
        for old_item in existing.scalars().all():
            await db.delete(old_item)

        subtotal = 0
        top_level_items = []

        # Prefetch menu items
        all_menu_item_ids = []
        def collect_ids(items):
            for i in items:
                if i.menu_item_id: all_menu_item_ids.append(i.menu_item_id)
                if i.sub_items: collect_ids(i.sub_items)
        collect_ids(order_in.items)
        
        mi_map = {}
        if all_menu_item_ids:
            mi_res = await db.execute(select(MenuItem).where(MenuItem.id.in_(all_menu_item_ids)))
            mi_map = {m.id: m for m in mi_res.scalars().all()}

        def process_item_node(item_in: OrderItemCreate):
            nonlocal subtotal
            unit_price = item_in.unit_price_paise
            calc_basket_unit = 0
            
            obj = OrderItem(
                order_id=order_id,
                menu_item_id=item_in.menu_item_id,
                custom_name=item_in.custom_name,
                quantity=item_in.quantity,
            )
            
            if item_in.sub_items:
                obj.sub_items = []
                for child_in in item_in.sub_items:
                    c_obj, c_line_tot = process_item_node(child_in)
                    calc_basket_unit += c_line_tot
                    obj.sub_items.append(c_obj)
                if unit_price is None:
                    unit_price = calc_basket_unit
            elif unit_price is None and item_in.menu_item_id:
                mi = mi_map.get(item_in.menu_item_id)
                if mi:
                    unit_price = mi.price_paise
            
            obj.unit_price_paise = unit_price or 0
            obj.line_total_paise = obj.quantity * obj.unit_price_paise
            return obj, obj.line_total_paise

        for item_in in order_in.items:
            obj, l_tot = process_item_node(item_in)
            subtotal += l_tot
            top_level_items.append(obj)
            
        for item in top_level_items:
            db.add(item)
            # Recursively add children just in case, though cascade should handle it
            def add_recursive(node):
                if node.sub_items:
                    for c in node.sub_items:
                        db.add(c)
                        add_recursive(c)
            add_recursive(item)
            
        order.subtotal_paise = subtotal
            
        order.subtotal_paise = subtotal

    # Update discount
    if order_in.discount_type is not None:
        order.discount_type = order_in.discount_type if order_in.discount_type else None
    if order_in.discount_value is not None:
        order.discount_value = order_in.discount_value

    order.discount_paise, order.total_paise = _calc_totals(
        order.subtotal_paise, order.discount_type, order.discount_value
    )

    # Update payment
    if order_in.amount_paid_paise is not None:
        order.amount_paid_paise = order_in.amount_paid_paise
    order.payment_status = _derive_payment_status(order.total_paise, order.amount_paid_paise)

    # Capture new values for audit
    new_val = {"status": order.status, "total_paise": order.total_paise, "payment_status": order.payment_status}
    await create_audit_log(db, current_user.id, "update", "order", order.id, old_val, new_val)

    await db.commit()
    await db.refresh(order)
    
    # Sync to Firebase
    _items_res = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id, OrderItem.parent_item_id == None))
    _items_list = _items_res.scalars().all()
    items_data = [{
        "menu_item_id": i.menu_item_id, "custom_name": i.custom_name, "quantity": i.quantity,
        "unit_price_paise": i.unit_price_paise, "line_total_paise": i.line_total_paise
    } for i in _items_list]
    
    push_sync_task(background_tasks, "order", order.id, {
        "customer_id": order.customer_id,
        "total_paise": order.total_paise,
        "status": order.status,
        "due_date": order.due_date,
        "fulfillment_type": order.fulfillment_type,
        "payment_status": order.payment_status,
        "amount_paid_paise": order.amount_paid_paise,
        "items": items_data
    })
    return await _build_response(order, db)


@router.patch("/{order_id}/status", dependencies=[editor_or_admin])
async def update_order_status(
    order_id: int, 
    body: OrderStatusUpdate, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    old_status = order.status
    order.status = body.status
    
    await create_audit_log(
        db, current_user.id, "update", "order", order.id,
        old_value={"status": old_status}, new_value={"status": order.status}
    )
    await db.commit()
    await db.refresh(order)
    
    # Sync to Firebase
    push_sync_task(background_tasks, "order", order.id, {
        "status": order.status
    })
    
    return await _build_response(order, db)


@router.patch("/{order_id}/payment", dependencies=[editor_or_admin])
async def update_payment_status(
    order_id: int, 
    body: OrderPaymentUpdate, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    old_paid = order.amount_paid_paise
    old_status = order.payment_status
    
    if body.amount_paid_paise is not None:
        order.amount_paid_paise = body.amount_paid_paise
    order.payment_status = _derive_payment_status(order.total_paise, order.amount_paid_paise)
    
    await create_audit_log(
        db, current_user.id, "update", "order", order.id,
        old_value={"amount_paid": old_paid, "payment_status": old_status},
        new_value={"amount_paid": order.amount_paid_paise, "payment_status": order.payment_status}
    )
    await db.commit()
    await db.refresh(order)
    
    # Sync to Firebase
    push_sync_task(background_tasks, "order", order.id, {
        "payment_status": order.payment_status,
        "amount_paid_paise": order.amount_paid_paise
    })
    
    return await _build_response(order, db)


@router.delete("/{order_id}", dependencies=[editor_or_admin])
async def soft_delete_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.is_deleted = 1
    order.deleted_at = datetime.utcnow().isoformat()
    order.deleted_by = current_user.id
    await create_audit_log(db, current_user.id, "delete", "order", order.id)
    await db.commit()
    return {"ok": True, "message": "Order soft-deleted"}


@router.post("/{order_id}/restore", dependencies=[admin_only])
async def restore_order(
    order_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.is_deleted = 0
    order.deleted_at = None
    order.deleted_by = None
    await create_audit_log(db, current_user.id, "restore", "order", order.id)
    await db.commit()
    return {"ok": True, "message": "Order restored"}


@router.post("/{order_id}/duplicate", dependencies=[editor_or_admin])
async def duplicate_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Copy as new pending draft
    new_order = Order(
        customer_id=order.customer_id,
        due_date=order.due_date,
        fulfillment_type=order.fulfillment_type,
        delivery_address=order.delivery_address,
        subtotal_paise=order.subtotal_paise,
        discount_type=order.discount_type,
        discount_value=order.discount_value,
        discount_paise=order.discount_paise,
        total_paise=order.total_paise,
        payment_status="unpaid",
        amount_paid_paise=0,
        special_instructions=order.special_instructions,
        internal_notes=order.internal_notes,
        created_by=current_user.id,
    )
    db.add(new_order)
    await db.flush()

    # Copy items directly handling parents then children
    items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
    all_old_items = items_result.scalars().all()
    
    old_id_to_new_obj = {}
    
    for oi in all_old_items:
        if oi.parent_item_id is None:
            new_obj = OrderItem(
                order_id=new_order.id, menu_item_id=oi.menu_item_id, custom_name=oi.custom_name,
                quantity=oi.quantity, unit_price_paise=oi.unit_price_paise, line_total_paise=oi.line_total_paise
            )
            old_id_to_new_obj[oi.id] = new_obj
            db.add(new_obj)
            
    for oi in all_old_items:
        if oi.parent_item_id is not None:
            parent_obj = old_id_to_new_obj.get(oi.parent_item_id)
            if parent_obj:
                new_child = OrderItem(
                    order_id=new_order.id, menu_item_id=oi.menu_item_id, custom_name=oi.custom_name,
                    quantity=oi.quantity, unit_price_paise=oi.unit_price_paise, line_total_paise=oi.line_total_paise
                )
                if not parent_obj.sub_items:
                    parent_obj.sub_items = []
                parent_obj.sub_items.append(new_child)
                db.add(new_child) # Explicitly add to session
    
    await db.flush()
    await create_audit_log(db, current_user.id, "duplicate", "order", new_order.id, new_value={"original_id": order_id})
    await db.commit()
    await db.refresh(new_order)
    return await _build_response(new_order, db)

    await db.commit()
    await db.refresh(new_order)
    
    # Sync to Firebase
    _items_res = await db.execute(select(OrderItem).where(OrderItem.order_id == new_order.id, OrderItem.parent_item_id == None))
    _items_list = _items_res.scalars().all()
    items_data = [{
        "menu_item_id": i.menu_item_id, "custom_name": i.custom_name, "quantity": i.quantity,
        "unit_price_paise": i.unit_price_paise, "line_total_paise": i.line_total_paise
    } for i in _items_list]
    
    push_sync_task(background_tasks, "order", new_order.id, {
        "customer_id": new_order.customer_id,
        "total_paise": new_order.total_paise,
        "status": new_order.status,
        "due_date": new_order.due_date,
        "fulfillment_type": new_order.fulfillment_type,
        "payment_status": new_order.payment_status,
        "amount_paid_paise": new_order.amount_paid_paise,
        "items": items_data
    })
    
    return await _build_response(new_order, db)


@router.get("/{order_id}/audit")
async def get_order_audit(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    from models.audit_log import AuditLog
    # Fetch logs for this order
    result = await db.execute(
        select(AuditLog, User.username)
        .join(User, AuditLog.user_id == User.id)
        .where(AuditLog.entity_type == "order", AuditLog.entity_id == order_id)
        .order_by(AuditLog.timestamp.desc())
    )
    
    logs = []
    for log, username in result:
        logs.append({
            "id": log.id,
            "action": log.action,
            "diff": json.loads(log.diff) if log.diff else None,
            "timestamp": log.timestamp,
            "username": username
        })
    return logs
