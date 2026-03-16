from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_

from database import get_db
from models.customer import Customer
from schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from services.auth_service import require_role, get_current_user
from services.audit_service import create_audit_log
from services.firebase_sync import push_sync_task
from models.user import User

router = APIRouter(prefix="/customers", tags=["customers"])

editor_or_admin = Depends(require_role(["editor", "admin"]))
admin_only = Depends(require_role(["admin"]))


@router.get("", response_model=List[CustomerResponse])
async def list_customers(
    search: Optional[str] = None,
    vip_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Customer).where(Customer.is_active == 1)

    if search:
        pattern = f"%{search}%"
        query = query.where(or_(Customer.name.ilike(pattern), Customer.phone.ilike(pattern)))

    if vip_only:
        query = query.where(Customer.is_vip == 1)

    query = query.order_by(Customer.name)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=CustomerResponse, dependencies=[editor_or_admin], status_code=status.HTTP_201_CREATED)
async def create_customer(
    customer_in: CustomerCreate, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = customer_in.model_dump()
    data["is_vip"] = 1 if data["is_vip"] else 0
    new_customer = Customer(**data)
    db.add(new_customer)
    await db.flush()
    await create_audit_log(
        db, current_user.id, "create", "customer", new_customer.id,
        new_value={"name": new_customer.name}
    )
    await db.commit()
    await db.refresh(new_customer)
    
    # Sync to Firebase
    push_sync_task(background_tasks, "customer", new_customer.id, {
        "name": new_customer.name,
        "phone": new_customer.phone,
        "email": new_customer.email,
        "is_vip": new_customer.is_vip,
        "is_active": new_customer.is_active
    })
    
    return new_customer


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse, dependencies=[editor_or_admin])
async def update_customer(
    customer_id: int, 
    customer_in: CustomerUpdate, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    update_data = customer_in.model_dump(exclude_unset=True)
    if "is_vip" in update_data:
        update_data["is_vip"] = 1 if update_data["is_vip"] else 0

    for key, value in update_data.items():
        setattr(customer, key, value)

    await create_audit_log(
        db, current_user.id, "update", "customer", customer.id,
        old_value={"name": customer.name}, new_value={"name": customer.name} # Simple placeholder or actual diff
    )
    await db.commit()
    await db.refresh(customer)
    
    # Sync to Firebase
    push_sync_task(background_tasks, "customer", customer.id, {
        "name": customer.name,
        "phone": customer.phone,
        "email": customer.email,
        "is_vip": customer.is_vip,
        "is_active": customer.is_active
    })
    
    return customer


@router.get("/{customer_id}/orders")
async def get_customer_orders(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify customer exists
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    from models.order import Order
    orders_result = await db.execute(
        select(Order)
        .where(Order.customer_id == customer_id, Order.is_deleted == 0)
        .order_by(Order.due_date.desc())
    )
    return orders_result.scalars().all()


@router.patch("/{customer_id}/deactivate", response_model=CustomerResponse, dependencies=[admin_only])
async def deactivate_customer(
    customer_id: int, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    customer.is_active = 0
    await create_audit_log(db, current_user.id, "delete", "customer", customer.id)
    await db.commit()
    await db.refresh(customer)
    
    # Sync to Firebase
    push_sync_task(background_tasks, "customer", customer.id, {
        "is_active": 0
    })
    
    return customer
