from sqlalchemy import Column, Integer, String, Text, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from database import Base

KITCHEN_STAGES = ('queued', 'prepping', 'baking', 'cooling', 'decorating', 'packed', 'assigned')


class KitchenBatch(Base):
    __tablename__ = "kitchen_batches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    batch_date = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    stage = Column(
        String,
        nullable=False,
        default="queued",
    )
    stage_updated_at = Column(String, nullable=False, server_default="(datetime('now'))")
    stage_updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(String, nullable=False, server_default="(datetime('now'))")

    # Relationships
    menu_item = relationship("MenuItem", lazy="joined")
    stage_user = relationship("User", foreign_keys=[stage_updated_by], lazy="joined")
    assignments = relationship("KitchenBatchOrderAssignment", back_populates="batch", lazy="selectin")
    stage_logs = relationship("KitchenStageLog", back_populates="batch", lazy="selectin")

    __table_args__ = (
        CheckConstraint(
            "stage IN ('queued','prepping','baking','cooling','decorating','packed','assigned')",
            name="ck_kitchen_batches_stage",
        ),
    )


class KitchenBatchOrderAssignment(Base):
    __tablename__ = "kitchen_batch_order_assignments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(Integer, ForeignKey("kitchen_batches.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    assigned_at = Column(String, nullable=False, server_default="(datetime('now'))")
    assigned_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    batch = relationship("KitchenBatch", back_populates="assignments")
    order = relationship("Order", lazy="selectin")
    user = relationship("User", foreign_keys=[assigned_by], lazy="joined")


class KitchenStageLog(Base):
    __tablename__ = "kitchen_stage_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(Integer, ForeignKey("kitchen_batches.id"), nullable=False)
    from_stage = Column(String, nullable=True)
    to_stage = Column(String, nullable=False)
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    changed_at = Column(String, nullable=False, server_default="(datetime('now'))")
    note = Column(Text, nullable=True)

    # Relationships
    batch = relationship("KitchenBatch", back_populates="stage_logs")
    user = relationship("User", foreign_keys=[changed_by], lazy="joined")
