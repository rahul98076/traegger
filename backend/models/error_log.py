from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.sql import func
from database import Base


class ErrorLog(Base):
    __tablename__ = "error_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(String, nullable=False, server_default=func.datetime("now"))
    level = Column(String, nullable=False, default="ERROR")  # ERROR, WARNING
    method = Column(String, nullable=True)   # GET, POST, etc.
    path = Column(String, nullable=True)     # /api/orders/1
    status_code = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=False)
    traceback_text = Column(Text, nullable=True)
    user_id = Column(Integer, nullable=True)  # Who triggered it (if known)
