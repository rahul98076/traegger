from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, nullable=False, unique=True)
    display_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    is_active = Column(Integer, nullable=False, default=1)
    session_version = Column(Integer, nullable=False, default=1)
    created_at = Column(String, nullable=False, server_default=func.datetime('now'))
    last_login = Column(String, nullable=True)
