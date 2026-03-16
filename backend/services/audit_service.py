import json
from datetime import datetime
from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from models.audit_log import AuditLog

async def create_audit_log(
    db: AsyncSession,
    user_id: int,
    action: str,
    entity_type: str,
    entity_id: int,
    old_value: Optional[Any] = None,
    new_value: Optional[Any] = None
):
    """
    Creates an audit log entry.
    diff format: {field: [old, new]}
    """
    diff = None
    if old_value or new_value:
        # Simple diff logic: if they are dicts, compare keys
        if isinstance(old_value, dict) and isinstance(new_value, dict):
            diff_dict = {}
            all_keys = set(old_value.keys()) | set(new_value.keys())
            for k in all_keys:
                ov = old_value.get(k)
                nv = new_value.get(k)
                if ov != nv:
                    diff_dict[k] = [ov, nv]
            if diff_dict:
                diff = json.dumps(diff_dict)
        else:
            # Fallback for simple values
            diff = json.dumps({"value": [old_value, new_value]})

    entry = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        diff=diff,
        timestamp=datetime.utcnow().isoformat(sep=" ", timespec="seconds")
    )
    db.add(entry)
    # We don't commit here, let the caller commit with the main transaction
