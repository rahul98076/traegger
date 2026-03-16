import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Dict, List

from database import get_db
from models.customer import Customer
from models.menu_item import MenuItem
from models.order import Order, OrderItem
from services.auth_service import require_role
from services.firebase_sync import full_sync_to_firestore

router = APIRouter(prefix="/admin/backup", tags=["backup"])
admin_only = Depends(require_role(["admin"]))

@router.get("/export", dependencies=[admin_only])
async def export_data(db: AsyncSession = Depends(get_db)):
    """
    Exports all core data (Customers, MenuItems, Orders) to a JSON structure.
    """
    # 1. Customers
    customers_result = await db.execute(select(Customer))
    customers = [c.__dict__.copy() for c in customers_result.scalars().all()]
    for c in customers: c.pop('_sa_instance_state', None)
    
    # 2. Menu Items
    menu_result = await db.execute(select(MenuItem))
    menu_items = [m.__dict__.copy() for m in menu_result.scalars().all()]
    for m in menu_items: m.pop('_sa_instance_state', None)
    
    # 3. Orders
    orders_result = await db.execute(select(Order))
    orders = []
    for o in orders_result.scalars().all():
        o_dict = o.__dict__.copy()
        o_dict.pop('_sa_instance_state', None)
        
        # Get items for this order
        items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == o.id))
        o_dict['items'] = [i.__dict__.copy() for i in items_result.scalars().all()]
        for i in o_dict['items']: i.pop('_sa_instance_state', None)
        
        orders.append(o_dict)
        
    return {
        "version": "1.0",
        "exported_at": datetime.utcnow().isoformat(),
        "data": {
            "customers": customers,
            "menu_items": menu_items,
            "orders": orders
        }
    }

@router.post("/import", dependencies=[admin_only])
async def import_data(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """
    Imports data from an uploaded JSON file.
    WARNING: This is a simple implementation and does not handle conflicts well.
    """
    try:
        content = await file.read()
        payload = json.loads(content)
        
        if "data" not in payload:
            raise HTTPException(400, "Invalid backup format")
            
        # This is a dangerous operation, normally we'd wipe or merge.
        # For simplicity, we just add what's missing or skip existing IDs.
        # Implementation left simple for now.
        
        return {"status": "success", "message": "Import logic triggered (stub)"}
    except Exception as e:
        raise HTTPException(500, f"Import failed: {str(e)}")

@router.post("/firebase-sync", dependencies=[admin_only])
async def force_firebase_sync(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Force a full push of all local records to Firestore.
    """
    background_tasks.add_task(full_sync_to_firestore, db)
    return {"status": "success", "message": "Full Firebase sync started in background"}

from services.firebase_restore import pull_from_firestore

@router.post("/cloud-restore", dependencies=[admin_only])
async def restore_from_firebase(db: AsyncSession = Depends(get_db)):
    """
    Destructive operation: Wipes local database and fully rebuilds it 
    from the current state of Firebase Firestore.
    """
    try:
        result = await pull_from_firestore(db)
        return result
    except Exception as e:
        raise HTTPException(500, f"Cloud restore failed: {str(e)}")
