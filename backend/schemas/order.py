from pydantic import BaseModel
from typing import Optional, List


# --- Order Items ---

class OrderItemCreate(BaseModel):
    menu_item_id: Optional[int] = None
    custom_name: Optional[str] = None
    custom_unit: Optional[str] = None  # Override size_unit (e.g. "piece")
    quantity: int
    unit_price_paise: Optional[int] = None  # auto-filled from menu if not provided
    sub_items: Optional[List['OrderItemCreate']] = None


class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    menu_item_id: Optional[int] = None
    custom_name: Optional[str] = None
    custom_unit: Optional[str] = None
    parent_item_id: Optional[int] = None
    quantity: int
    unit_price_paise: int
    line_total_paise: int
    menu_item_name: Optional[str] = None
    menu_item_size_unit: Optional[str] = None
    created_at: str
    sub_items: Optional[List['OrderItemResponse']] = None

    class Config:
        from_attributes = True


# --- Orders ---

class OrderCreate(BaseModel):
    customer_id: int
    due_date: str
    fulfillment_type: str  # 'pickup' or 'delivery'
    delivery_address: Optional[str] = None
    items: List[OrderItemCreate]
    discount_type: Optional[str] = None  # 'flat', 'percent', or None
    discount_value: int = 0
    payment_status: str = "unpaid"
    amount_paid_paise: int = 0
    special_instructions: Optional[str] = None
    internal_notes: Optional[str] = None


class OrderUpdate(BaseModel):
    customer_id: Optional[int] = None
    due_date: Optional[str] = None
    fulfillment_type: Optional[str] = None
    delivery_address: Optional[str] = None
    items: Optional[List[OrderItemCreate]] = None
    discount_type: Optional[str] = None
    discount_value: Optional[int] = None
    payment_status: Optional[str] = None
    amount_paid_paise: Optional[int] = None
    special_instructions: Optional[str] = None
    internal_notes: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str


class OrderPaymentUpdate(BaseModel):
    payment_status: Optional[str] = None
    amount_paid_paise: Optional[int] = None


class OrderResponse(BaseModel):
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    status: str
    order_date: str
    due_date: str
    fulfillment_type: str
    delivery_address: Optional[str] = None
    subtotal_paise: int
    discount_type: Optional[str] = None
    discount_value: int
    discount_paise: int
    total_paise: int
    payment_status: str
    amount_paid_paise: int
    special_instructions: Optional[str] = None
    internal_notes: Optional[str] = None
    is_deleted: bool
    deleted_at: Optional[str] = None
    deleted_by: Optional[int] = None
    created_by: int
    created_at: str
    updated_at: str
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True

try:
    OrderItemCreate.model_rebuild()
    OrderItemResponse.model_rebuild()
except AttributeError:
    OrderItemCreate.update_forward_refs()
    OrderItemResponse.update_forward_refs()
