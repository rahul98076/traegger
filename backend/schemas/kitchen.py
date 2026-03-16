from typing import Optional, List
from pydantic import BaseModel


# --- Batch ---
class BatchCreate(BaseModel):
    menu_item_id: int
    batch_date: str  # YYYY-MM-DD
    quantity: int
    notes: Optional[str] = None


class BatchStageUpdate(BaseModel):
    stage: str
    note: Optional[str] = None


class AssignmentItem(BaseModel):
    order_id: int
    quantity: int


class BatchAssign(BaseModel):
    assignments: List[AssignmentItem]


# --- Responses ---
class AssignmentResponse(BaseModel):
    id: int
    batch_id: int
    order_id: int
    quantity: int
    assigned_at: str
    assigned_by: int
    customer_name: Optional[str] = None

    class Config:
        from_attributes = True


class StageLogResponse(BaseModel):
    id: int
    batch_id: int
    from_stage: Optional[str]
    to_stage: str
    changed_by: int
    changed_by_name: Optional[str] = None
    changed_at: str
    note: Optional[str] = None

    class Config:
        from_attributes = True


class BatchResponse(BaseModel):
    id: int
    menu_item_id: int
    menu_item_name: Optional[str] = None
    menu_item_size_unit: Optional[str] = None
    batch_date: str
    quantity: int
    stage: str
    stage_updated_at: str
    stage_updated_by: Optional[int] = None
    stage_updated_by_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
    assignments: List[AssignmentResponse] = []
    total_assigned: int = 0

    class Config:
        from_attributes = True
