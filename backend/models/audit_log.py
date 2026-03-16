from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.sql import func
from database import Base

class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # 'create', 'update', 'delete', 'restore'
    entity_type = Column(String, nullable=False)  # 'order', 'customer', 'menu_item', etc.
    entity_id = Column(Integer, nullable=False)
    diff = Column(Text, nullable=True)  # JSON string: {field: [old_value, new_value]}
    timestamp = Column(String, nullable=False, server_default=func.datetime("now"))
