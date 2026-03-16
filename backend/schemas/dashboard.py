from pydantic import BaseModel
from typing import List, Dict, Any

class StatusCount(BaseModel):
    status: str
    count: int

class RevenuePoint(BaseModel):
    date: str
    amount: float

class RecentOrder(BaseModel):
    id: int
    customer_name: str
    total_price: float
    status: str
    due_date: str

class TopItem(BaseModel):
    name: str
    quantity: int

class DashboardSummary(BaseModel):
    revenue_today: float
    pending_collection_today: float
    orders_ready_today: int
    new_orders_today: int
    orders_by_status: List[StatusCount]
    revenue_trend: List[RevenuePoint]
    recent_orders: List[RecentOrder]
    top_items: List[TopItem]
    firebase_sync_status: str
