from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc
from datetime import date, timedelta
from typing import List

from database import get_db
from models.order import Order, OrderItem
from models.customer import Customer
from models.menu_item import MenuItem
from schemas.dashboard import DashboardSummary, StatusCount, RevenuePoint, RecentOrder, TopItem
from services.auth_service import get_current_user
from services.firebase_sync import get_sync_status

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    today_str = date.today().isoformat()
    last_7_days = [(date.today() - timedelta(days=i)).isoformat() for i in range(6, -1, -1)]
    
    # 1. Today's Metrics
    # Revenue today (sum of total_paise for orders DUE today)
    revenue_q = await db.execute(
        select(func.sum(Order.total_paise)).where(Order.due_date == today_str, Order.is_deleted == 0)
    )
    revenue_today = (revenue_q.scalar() or 0) / 100.0
    
    # Pending collection today (sum of total_paise - amount_paid_paise for orders DUE today)
    collection_q = await db.execute(
        select(func.sum(Order.total_paise - Order.amount_paid_paise)).where(Order.due_date == today_str, Order.is_deleted == 0)
    )
    pending_collection_today = (collection_q.scalar() or 0) / 100.0
    
    # Orders ready today
    ready_q = await db.execute(
        select(func.count(Order.id)).where(Order.due_date == today_str, Order.status == "ready", Order.is_deleted == 0)
    )
    orders_ready_today = ready_q.scalar() or 0
    
    # New orders today (created today)
    # Assuming we have a created_at field in Order that starts with YYYY-MM-DD
    new_q = await db.execute(
        select(func.count(Order.id)).where(Order.created_at.like(f"{today_str}%"), Order.is_deleted == 0)
    )
    new_orders_today = new_q.scalar() or 0

    # 2. Orders by Status
    status_q = await db.execute(
        select(Order.status, func.count(Order.id))
        .where(Order.is_deleted == 0)
        .group_by(Order.status)
    )
    orders_by_status = [StatusCount(status=s, count=c) for s, c in status_q.all()]

    # 3. Revenue Trend (last 7 days)
    revenue_trend = []
    for d in last_7_days:
        dq = await db.execute(
            select(func.sum(Order.total_paise)).where(Order.due_date == d, Order.is_deleted == 0)
        )
        revenue_trend.append(RevenuePoint(date=d, amount=(dq.scalar() or 0) / 100.0))

    # 4. Recent Orders
    recent_q = await db.execute(
        select(Order).where(Order.is_deleted == 0).order_by(desc(Order.created_at)).limit(5)
    )
    recent_orders_raw = recent_q.scalars().all()
    recent_orders = []
    for o in recent_orders_raw:
        # Fetch customer name
        cust_q = await db.execute(select(Customer.name).where(Customer.id == o.customer_id))
        customer_name = cust_q.scalar() or "Unknown"
        recent_orders.append(RecentOrder(
            id=o.id,
            customer_name=customer_name,
            total_price=o.total_paise / 100.0,
            status=o.status,
            due_date=o.due_date
        ))

    # 5. Top Items (last 30 days)
    # Using OrderItem and joining with Order to filter by date
    thirty_days_ago = (date.today() - timedelta(days=30)).isoformat()
    top_q = await db.execute(
        select(MenuItem.name, func.sum(OrderItem.quantity).label("total_qty"))
        .join(OrderItem, MenuItem.id == OrderItem.menu_item_id)
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.due_date >= thirty_days_ago, Order.is_deleted == 0)
        .group_by(MenuItem.name)
        .order_by(desc(func.sum(OrderItem.quantity)))
        .limit(5)
    )
    top_items = [TopItem(name=n, quantity=int(q or 0)) for n, q in top_q.all()]

    return DashboardSummary(
        revenue_today=revenue_today,
        pending_collection_today=pending_collection_today,
        orders_ready_today=orders_ready_today,
        new_orders_today=new_orders_today,
        orders_by_status=orders_by_status,
        revenue_trend=revenue_trend,
        recent_orders=recent_orders,
        top_items=top_items,
        firebase_sync_status=get_sync_status()
    )
