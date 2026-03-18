from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, backref
from database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    status = Column(String, nullable=False, default="confirmed")
    order_date = Column(String, nullable=False, server_default=func.date("now"))
    due_date = Column(String, nullable=False)
    fulfillment_type = Column(String, nullable=False)
    delivery_address = Column(Text, nullable=True)
    subtotal_paise = Column(Integer, nullable=False, default=0)
    discount_type = Column(String, nullable=True)
    discount_value = Column(Integer, nullable=False, default=0)
    discount_paise = Column(Integer, nullable=False, default=0)
    total_paise = Column(Integer, nullable=False, default=0)
    payment_status = Column(String, nullable=False, default="unpaid")
    amount_paid_paise = Column(Integer, nullable=False, default=0)
    special_instructions = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)
    is_deleted = Column(Integer, nullable=False, default=0)
    deleted_at = Column(String, nullable=True)
    deleted_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(String, nullable=False, server_default=func.datetime("now"))
    updated_at = Column(String, nullable=False, server_default=func.datetime("now"), onupdate=func.datetime("now"))

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=True)
    parent_item_id = Column(Integer, ForeignKey("order_items.id", ondelete="CASCADE"), nullable=True)
    custom_name = Column(String, nullable=True)
    quantity = Column(Integer, nullable=False)
    unit_price_paise = Column(Integer, nullable=False)
    line_total_paise = Column(Integer, nullable=False)
    created_at = Column(String, nullable=False, server_default=func.datetime("now"))

    order = relationship("Order", back_populates="items")
    sub_items = relationship("OrderItem", backref=backref("parent_item", remote_side=[id]), cascade="all, delete-orphan")
