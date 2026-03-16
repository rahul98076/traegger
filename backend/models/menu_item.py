from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.sql import func
from database import Base

class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    size_unit = Column(String, nullable=False)
    price_paise = Column(Integer, nullable=False)
    is_available = Column(Integer, nullable=False, default=1)
    notes = Column(Text, nullable=True)
    created_at = Column(String, nullable=False, server_default=func.datetime('now'))
    updated_at = Column(String, nullable=False, server_default=func.datetime('now'), onupdate=func.datetime('now'))
