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

async def sync_to_firestore(entity_type: str, entity_id: int, data: dict):
    """
    Background task to sync an entity to Firestore.
    """
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
                "name": c.name, "phone": c.phone, "email": c.email, "is_vip": c.is_vip, "is_active": c.is_active
            })
            
        # 2. Menu Items
        res = await db_session.execute(select(MenuItem))
        for m in res.scalars().all():
            await sync_to_firestore("menu_item", m.id, {
                "name": m.name, "price_paise": m.price_paise, "category": m.category, "is_available": m.is_available
            })
            
        # 3. Orders
        res = await db_session.execute(select(Order).where(Order.is_deleted == 0))
        for o in res.scalars().all():
            await sync_to_firestore("order", o.id, {
                "customer_id": o.customer_id, "total_paise": o.total_paise, "status": o.status, "due_date": o.due_date
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
