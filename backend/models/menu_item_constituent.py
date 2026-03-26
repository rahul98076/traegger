from sqlalchemy import Column, Integer, ForeignKey
from database import Base

class MenuItemConstituent(Base):
    __tablename__ = "menu_item_constituents"

    parent_item_id = Column(Integer, ForeignKey("menu_items.id", ondelete="CASCADE"), primary_key=True)
    child_item_id = Column(Integer, ForeignKey("menu_items.id", ondelete="CASCADE"), primary_key=True)
    quantity = Column(Integer, nullable=False, default=1)

