from typing import Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models.kitchen import KitchenBatch, KitchenBatchOrderAssignment, KitchenStageLog, KITCHEN_STAGES
from models.order import Order, OrderItem
from models.customer import Customer
from schemas.kitchen import (
    BatchCreate, BatchStageUpdate, BatchAssign,
    BatchResponse, AssignmentResponse, StageLogResponse,
)
from services.auth_service import get_current_user, require_role
from services.audit_service import create_audit_log

router = APIRouter(prefix="/kitchen", tags=["kitchen"])


def _batch_to_response(batch: KitchenBatch) -> dict:
    """Convert a KitchenBatch ORM object to a response dict."""
    assignments = []
    total_assigned = 0
    for a in (batch.assignments or []):
        cust_name = None
        if a.order and a.order.customer_id:
            cust_name = getattr(a.order, '_customer_name', None)
        assignments.append({
            "id": a.id,
            "batch_id": a.batch_id,
            "order_id": a.order_id,
            "quantity": a.quantity,
            "assigned_at": a.assigned_at,
            "assigned_by": a.assigned_by,
            "customer_name": cust_name,
        })
        total_assigned += a.quantity

    return {
        "id": batch.id,
        "menu_item_id": batch.menu_item_id,
        "menu_item_name": batch.menu_item.name if batch.menu_item else None,
        "menu_item_size_unit": batch.menu_item.size_unit if batch.menu_item else None,
        "batch_date": batch.batch_date,
        "quantity": batch.quantity,
        "stage": batch.stage,
        "stage_updated_at": batch.stage_updated_at,
        "stage_updated_by": batch.stage_updated_by,
        "stage_updated_by_name": batch.stage_user.username if batch.stage_user else None,
        "notes": batch.notes,
        "created_at": batch.created_at,
        "assignments": assignments,
        "total_assigned": total_assigned,
    }


@router.get("/batches")
async def list_batches(
    batch_date: Optional[str] = Query(None, alias="date"),
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    target_date = batch_date or date.today().isoformat()
    result = await db.execute(
        select(KitchenBatch)
        .where(KitchenBatch.batch_date == target_date)
        .order_by(KitchenBatch.id)
    )
    batches = result.scalars().all()

    # Fetch customer names for assignments
    responses = []
    for batch in batches:
        resp = _batch_to_response(batch)
        # Enrich assignment customer names
        for a_resp in resp["assignments"]:
            if a_resp["customer_name"] is None:
                order_q = await db.execute(select(Order).where(Order.id == a_resp["order_id"]))
                order = order_q.scalar_one_or_none()
                if order:
                    cust_q = await db.execute(select(Customer).where(Customer.id == order.customer_id))
                    cust = cust_q.scalar_one_or_none()
                    a_resp["customer_name"] = cust.name if cust else None
        responses.append(resp)

    return responses


@router.post("/batches", status_code=201)
async def create_batch(
    data: BatchCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role(["editor", "admin"])),
):
    if data.quantity <= 0:
        raise HTTPException(400, "Quantity must be positive")

    batch = KitchenBatch(
        menu_item_id=data.menu_item_id,
        batch_date=data.batch_date,
        quantity=data.quantity,
        stage="queued",
        stage_updated_at=datetime.utcnow().isoformat(sep=" ", timespec="seconds"),
        stage_updated_by=current_user.id,
        notes=data.notes,
    )
    db.add(batch)
    await db.flush()

    # Initial stage log entry
    log = KitchenStageLog(
        batch_id=batch.id,
        from_stage=None,
        to_stage="queued",
        changed_by=current_user.id,
        changed_at=datetime.utcnow().isoformat(sep=" ", timespec="seconds"),
    )
    db.add(log)
    await db.commit()
    await db.refresh(batch)

    return _batch_to_response(batch)


@router.patch("/batches/{batch_id}/stage")
async def update_batch_stage(
    batch_id: int,
    data: BatchStageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role(["editor", "admin"])),
):
    if data.stage not in KITCHEN_STAGES:
        raise HTTPException(400, f"Invalid stage. Must be one of: {', '.join(KITCHEN_STAGES)}")

    result = await db.execute(select(KitchenBatch).where(KitchenBatch.id == batch_id))
    batch = result.scalar_one_or_none()
    if not batch:
        raise HTTPException(404, "Batch not found")

    old_stage = batch.stage
    now = datetime.utcnow().isoformat(sep=" ", timespec="seconds")

    batch.stage = data.stage
    batch.stage_updated_at = now
    batch.stage_updated_by = current_user.id

    # Write immutable log
    log = KitchenStageLog(
        batch_id=batch.id,
        from_stage=old_stage,
        to_stage=data.stage,
        changed_by=current_user.id,
        changed_at=now,
        note=data.note,
    )
    db.add(log)
    await db.commit()
    await db.refresh(batch)

    return _batch_to_response(batch)


@router.post("/batches/{batch_id}/assign")
async def assign_batch(
    batch_id: int,
    data: BatchAssign,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role(["editor", "admin"])),
):
    result = await db.execute(select(KitchenBatch).where(KitchenBatch.id == batch_id))
    batch = result.scalar_one_or_none()
    if not batch:
        raise HTTPException(404, "Batch not found")

    now = datetime.utcnow().isoformat(sep=" ", timespec="seconds")

    for item in data.assignments:
        assignment = KitchenBatchOrderAssignment(
            batch_id=batch.id,
            order_id=item.order_id,
            quantity=item.quantity,
            assigned_at=now,
            assigned_by=current_user.id,
        )
        db.add(assignment)

    # Auto-set batch stage to "assigned" after assignment
    if batch.stage != "assigned":
        old_stage = batch.stage
        batch.stage = "assigned"
        batch.stage_updated_at = now
        batch.stage_updated_by = current_user.id
        log = KitchenStageLog(
            batch_id=batch.id,
            from_stage=old_stage,
            to_stage="assigned",
            changed_by=current_user.id,
            changed_at=now,
            note="Auto-set on order assignment",
        )
        db.add(log)
    
    await create_audit_log(
        db, current_user.id, "assign", "kitchen_batch", batch.id,
        new_value={"assignments_count": len(data.assignments)}
    )
    await db.commit()

    # Check if all order items are fulfilled → auto-status "ready"
    for item in data.assignments:
        order_q = await db.execute(select(Order).where(Order.id == item.order_id))
        order = order_q.scalar_one_or_none()
        if order and order.status in ("confirmed", "in_progress"):
            # Get all order items
            oi_q = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
            order_items = oi_q.scalars().all()

            all_fulfilled = True
            for oi in order_items:
                # Sum assigned quantity for this menu item + order
                assign_q = await db.execute(
                    select(KitchenBatchOrderAssignment)
                    .where(KitchenBatchOrderAssignment.order_id == order.id)
                    .join(KitchenBatch)
                    .where(KitchenBatch.menu_item_id == oi.menu_item_id)
                )
                assigned_total = sum(a.quantity for a in assign_q.scalars().all())
                if assigned_total < oi.quantity:
                    all_fulfilled = False
                    break

            if all_fulfilled:
                order.status = "ready"
                await db.commit()

    await db.refresh(batch)
    return _batch_to_response(batch)


@router.get("/batches/{batch_id}/log")
async def get_batch_log(
    batch_id: int,
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    result = await db.execute(select(KitchenBatch).where(KitchenBatch.id == batch_id))
    batch = result.scalar_one_or_none()
    if not batch:
        raise HTTPException(404, "Batch not found")

    log_q = await db.execute(
        select(KitchenStageLog)
        .where(KitchenStageLog.batch_id == batch_id)
        .order_by(KitchenStageLog.id)
    )
    logs = log_q.scalars().all()

    return [
        {
            "id": l.id,
            "batch_id": l.batch_id,
            "from_stage": l.from_stage,
            "to_stage": l.to_stage,
            "changed_by": l.changed_by,
            "changed_by_name": l.user.username if l.user else None,
            "changed_at": l.changed_at,
            "note": l.note,
        }
        for l in logs
    ]
