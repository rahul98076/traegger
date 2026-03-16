from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.sql import func
from database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    whatsapp = Column(String, nullable=True)
    instagram = Column(String, nullable=True)
    email = Column(String, nullable=True)
    default_address = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    is_vip = Column(Integer, nullable=False, default=0)
    is_active = Column(Integer, nullable=False, default=1)
    created_at = Column(String, nullable=False, server_default=func.datetime('now'))
    updated_at = Column(String, nullable=False, server_default=func.datetime('now'), onupdate=func.datetime('now'))
