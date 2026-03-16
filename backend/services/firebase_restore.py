import logging
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
                "INSERT INTO customers (id, name, phone, email, is_vip, is_active) "
                "VALUES (:id, :name, :phone, :email, :is_vip, :is_active)"
            ), {
                "id": db_id,
                "name": data.get("name", "Unknown"),
                "phone": data.get("phone", ""),
                "email": data.get("email", ""),
                "is_vip": data.get("is_vip", False),
                "is_active": data.get("is_active", True)
            })

        # 2. Menu Items
        menu_items_ref = db.collection("menu_items").stream()
        for doc in menu_items_ref:
            data = doc.to_dict()
            db_id = int(doc.id)
            
            await db_session.execute(text(
                "INSERT INTO menu_items (id, name, price_paise, category, is_available) "
                "VALUES (:id, :name, :price_paise, :category, :is_available)"
            ), {
                "id": db_id,
                "name": data.get("name", "Unknown"),
                "price_paise": data.get("price_paise", 0),
                "category": data.get("category", "Uncategorized"),
                "is_available": data.get("is_available", True)
            })

        # 3. Orders 
        orders_ref = db.collection("orders").stream()
        for doc in orders_ref:
            data = doc.to_dict()
            db_id = int(doc.id)
            
            # Since the current sync doesn't push all order fields, we use fallbacks
            await db_session.execute(text(
                "INSERT INTO orders (id, customer_id, total_paise, status, due_date, "
                "fulfillment_type, payment_status, amount_paid_paise, is_deleted) "
                "VALUES (:id, :customer_id, :total_paise, :status, :due_date, "
                ":fulfillment_type, :payment_status, :amount_paid_paise, :is_deleted)"
            ), {
                "id": db_id,
                "customer_id": data.get("customer_id"),
                "total_paise": data.get("total_paise", 0),
                "status": data.get("status", "pending"),
                "due_date": data.get("due_date", "2026-01-01"),
                "fulfillment_type": data.get("fulfillment_type", "pickup"),
                "payment_status": data.get("payment_status", "unpaid"),
                "amount_paid_paise": data.get("amount_paid_paise", 0),
                "is_deleted": 0
            })
            
            # Restore Order Items
            try:
                items = data.get("items", [])
                for idx, item in enumerate(items):
                    await db_session.execute(text(
                        "INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price_paise, line_total_paise) "
                        "VALUES (:order_id, :menu_item_id, :quantity, :unit_price_paise, :line_total_paise)"
                    ), {
                        "order_id": db_id,
                        "menu_item_id": item.get("menu_item_id"),
                        "quantity": item.get("quantity", 1),
                        "unit_price_paise": item.get("unit_price_paise", 0),
                        "line_total_paise": item.get("line_total_paise", 0)
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
