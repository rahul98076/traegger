import logging
from datetime import datetime
from firebase_admin import firestore
from models.order import Order
from models.customer import Customer
from models.menu_item import MenuItem

logger = logging.getLogger(__name__)

# Global sync status: 'synced', 'syncing', 'error', 'offline'
_sync_status = "synced"

def get_sync_status() -> str:
    return _sync_status

def set_sync_status(status: str):
    global _sync_status
    _sync_status = status

import firebase_admin

async def sync_to_firestore(entity_type: str, entity_id: int, data: dict):
    """
    Background task to sync an entity to Firestore.
    """
    if not firebase_admin._apps:
        set_sync_status("offline")
        return
        
    set_sync_status("syncing")
    try:
        db = firestore.client()
        # Collections: orders, customers, menu_items
        collection_name = f"{entity_type}s"
        if collection_name == "menu_items": # Special case if needed, but 'menu_items' is fine
            pass
            
        doc_ref = db.collection(collection_name).document(str(entity_id))
        
        # Add metadata
        sync_data = {
            **data,
            "_last_synced": datetime.utcnow().isoformat(),
            "_entity_type": entity_type,
            "_entity_id": entity_id
        }
        
        # Firestore update
        doc_ref.set(sync_data)
        set_sync_status("synced")
        logger.info(f"Successfully synced {entity_type} #{entity_id} to Firestore")
    except Exception as e:
        set_sync_status("error")
        logger.error(f"Failed to sync {entity_type} #{entity_id} to Firestore: {str(e)}")

async def full_sync_to_firestore(db_session):
    """
    Performs a full push of all local data to Firestore.
    Used for manual triggers and startup sync.
    """
    if not firebase_admin._apps:
        set_sync_status("offline")
        return
        
    from sqlalchemy.future import select
    from models.customer import Customer
    from models.menu_item import MenuItem
    from models.order import Order
    
    set_sync_status("syncing")
    try:
        # 1. Customers
        res = await db_session.execute(select(Customer))
        for c in res.scalars().all():
            await sync_to_firestore("customer", c.id, {
                "name": c.name,
                "phone": c.phone,
                "whatsapp": c.whatsapp,
                "instagram": c.instagram,
                "email": c.email,
                "default_address": c.default_address,
                "notes": c.notes,
                "is_vip": c.is_vip,
                "is_active": c.is_active,
                "created_at": c.created_at,
                "updated_at": c.updated_at
            })
            
        # 2. Menu Items
        res = await db_session.execute(select(MenuItem))
        for m in res.scalars().all():
            await sync_to_firestore("menu_item", m.id, {
                "name": m.name,
                "category": m.category,
                "size_unit": m.size_unit,
                "price_paise": m.price_paise,
                "is_available": m.is_available,
                "notes": m.notes,
                "created_at": m.created_at,
                "updated_at": m.updated_at
            })
            
        # 3. Orders
        res = await db_session.execute(select(Order).where(Order.is_deleted == 0))
        for o in res.scalars().all():
            # Include Order Items in the sync for better recovery
            items_data = []
            for item in o.items:
                items_data.append({
                    "menu_item_id": item.menu_item_id,
                    "parent_item_id": item.parent_item_id,
                    "custom_name": item.custom_name,
                    "custom_unit": item.custom_unit,
                    "quantity": item.quantity,
                    "unit_price_paise": item.unit_price_paise,
                    "line_total_paise": item.line_total_paise,
                    "status": item.status,
                    "created_at": item.created_at
                })

            await sync_to_firestore("order", o.id, {
                "customer_id": o.customer_id,
                "status": o.status,
                "order_date": o.order_date,
                "due_date": o.due_date,
                "fulfillment_type": o.fulfillment_type,
                "delivery_address": o.delivery_address,
                "subtotal_paise": o.subtotal_paise,
                "discount_type": o.discount_type,
                "discount_value": o.discount_value,
                "discount_paise": o.discount_paise,
                "total_paise": o.total_paise,
                "payment_status": o.payment_status,
                "amount_paid_paise": o.amount_paid_paise,
                "special_instructions": o.special_instructions,
                "internal_notes": o.internal_notes,
                "created_by": o.created_by,
                "created_at": o.created_at,
                "updated_at": o.updated_at,
                "items": items_data
            })
            
        set_sync_status("synced")
        logger.info("Full Firestore sync completed successfully")
    except Exception as e:
        set_sync_status("error")
        logger.error(f"Full Firestore sync failed: {str(e)}")

def push_sync_task(background_tasks, entity_type: str, entity_id: int, data: dict):
    """
    Helper to add sync to FastAPI background tasks.
    """
    background_tasks.add_task(sync_to_firestore, entity_type, entity_id, data)
