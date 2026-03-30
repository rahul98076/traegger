import logging
from datetime import datetime
from firebase_admin import firestore
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

logger = logging.getLogger(__name__)

async def pull_from_firestore(db_session: AsyncSession):
    """
    Pulls data from Firestore (customers, menu_items, orders)
    and reconstructs the local SQLite database.
    WARNING: This wipes the existing local database records!
    """
    db = firestore.client()
    
    try:
        # We need to wipe locally to avoid conflicts
        await db_session.execute(text("DELETE FROM order_items"))
        await db_session.execute(text("DELETE FROM orders"))
        await db_session.execute(text("DELETE FROM menu_items"))
        await db_session.execute(text("DELETE FROM customers"))
        
        # 1. Customers
        customers_ref = db.collection("customers").stream()
        for doc in customers_ref:
            data = doc.to_dict()
            db_id = int(doc.id)
            
            await db_session.execute(text(
                "INSERT INTO customers (id, name, phone, whatsapp, instagram, email, default_address, notes, is_vip, is_active, created_at, updated_at) "
                "VALUES (:id, :name, :phone, :whatsapp, :instagram, :email, :default_address, :notes, :is_vip, :is_active, :created_at, :updated_at)"
            ), {
                "id": db_id,
                "name": data.get("name", "Unknown"),
                "phone": data.get("phone", ""),
                "whatsapp": data.get("whatsapp", ""),
                "instagram": data.get("instagram", ""),
                "email": data.get("email", ""),
                "default_address": data.get("default_address", ""),
                "notes": data.get("notes", ""),
                "is_vip": data.get("is_vip", 0),
                "is_active": data.get("is_active", 1),
                "created_at": data.get("created_at", datetime.utcnow().isoformat()),
                "updated_at": data.get("updated_at", datetime.utcnow().isoformat())
            })

        # 2. Menu Items
        menu_items_ref = db.collection("menu_items").stream()
        for doc in menu_items_ref:
            data = doc.to_dict()
            db_id = int(doc.id)
            
            await db_session.execute(text(
                "INSERT INTO menu_items (id, name, category, size_unit, price_paise, is_available, notes, created_at, updated_at) "
                "VALUES (:id, :name, :category, :size_unit, :price_paise, :is_available, :notes, :created_at, :updated_at)"
            ), {
                "id": db_id,
                "name": data.get("name", "Unknown"),
                "category": data.get("category", "Uncategorized"),
                "size_unit": data.get("size_unit", "unit"), # CRITICAL FIX: Fallback for missing field
                "price_paise": data.get("price_paise", 0),
                "is_available": data.get("is_available", 1),
                "notes": data.get("notes", ""),
                "created_at": data.get("created_at", datetime.utcnow().isoformat()),
                "updated_at": data.get("updated_at", datetime.utcnow().isoformat())
            })

        # 3. Orders 
        orders_ref = db.collection("orders").stream()
        for doc in orders_ref:
            data = doc.to_dict()
            db_id = int(doc.id)
            
            await db_session.execute(text(
                "INSERT INTO orders (id, customer_id, status, order_date, due_date, fulfillment_type, delivery_address, subtotal_paise, discount_type, discount_value, discount_paise, total_paise, payment_status, amount_paid_paise, special_instructions, internal_notes, is_deleted, deleted_at, deleted_by, created_by, created_at, updated_at) "
                "VALUES (:id, :customer_id, :status, :order_date, :due_date, :fulfillment_type, :delivery_address, :subtotal_paise, :discount_type, :discount_value, :discount_paise, :total_paise, :payment_status, :amount_paid_paise, :special_instructions, :internal_notes, :is_deleted, :deleted_at, :deleted_by, :created_by, :created_at, :updated_at)"
            ), {
                "id": db_id,
                "customer_id": data.get("customer_id"),
                "status": data.get("status", "confirmed"),
                "order_date": data.get("order_date", datetime.utcnow().date().isoformat()),
                "due_date": data.get("due_date", "2026-01-01"),
                "fulfillment_type": data.get("fulfillment_type", "pickup"),
                "delivery_address": data.get("delivery_address", ""),
                "subtotal_paise": data.get("subtotal_paise", 0),
                "discount_type": data.get("discount_type", ""),
                "discount_value": data.get("discount_value", 0),
                "discount_paise": data.get("discount_paise", 0),
                "total_paise": data.get("total_paise", 0),
                "payment_status": data.get("payment_status", "unpaid"),
                "amount_paid_paise": data.get("amount_paid_paise", 0),
                "special_instructions": data.get("special_instructions", ""),
                "internal_notes": data.get("internal_notes", ""),
                "is_deleted": data.get("is_deleted", 0),
                "deleted_at": data.get("deleted_at", None),
                "deleted_by": data.get("deleted_by", None),
                "created_by": data.get("created_by", 1), # Fallback to admin id 1
                "created_at": data.get("created_at", datetime.utcnow().isoformat()),
                "updated_at": data.get("updated_at", datetime.utcnow().isoformat())
            })
            
            # Restore Order Items
            try:
                items = data.get("items", [])
                for idx, item in enumerate(items):
                    await db_session.execute(text(
                        "INSERT INTO order_items (order_id, menu_item_id, parent_item_id, custom_name, custom_unit, quantity, unit_price_paise, line_total_paise, status, created_at) "
                        "VALUES (:order_id, :menu_item_id, :parent_item_id, :custom_name, :custom_unit, :quantity, :unit_price_paise, :line_total_paise, :status, :created_at)"
                    ), {
                        "order_id": db_id,
                        "menu_item_id": item.get("menu_item_id"),
                        "parent_item_id": item.get("parent_item_id", None),
                        "custom_name": item.get("custom_name", None),
                        "custom_unit": item.get("custom_unit", None),
                        "quantity": item.get("quantity", 1),
                        "unit_price_paise": item.get("unit_price_paise", 0),
                        "line_total_paise": item.get("line_total_paise", 0),
                        "status": item.get("status", "pending"),
                        "created_at": item.get("created_at", datetime.utcnow().isoformat())
                    })
            except Exception as item_err:
                logger.error(f"Failed reversing items for order {db_id}: {item_err}")

        await db_session.commit()
        logger.info("Successfully pulled data from Firestore and rebuilt local database.")
        return {"status": "success", "message": "Database recovered from cloud!"}

    except Exception as e:
        await db_session.rollback()
        logger.error(f"Cloud recovery failed: {str(e)}")
        raise e
