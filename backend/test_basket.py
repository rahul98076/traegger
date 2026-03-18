import asyncio
from database import async_session_maker
from models.order import Order, OrderItem

async def test_creation():
    async with async_session_maker() as db:
        new_order = Order(
            customer_id=1, status="confirmed", due_date="2026-03-20",
            fulfillment_type="pickup", created_by=1
        )
        
        child1 = OrderItem(menu_item_id=1, quantity=1, unit_price_paise=100, line_total_paise=100)
        
        parent = OrderItem(custom_name="Basket", quantity=1, unit_price_paise=100, line_total_paise=100)
        parent.sub_items = [child1]
        
        # Add to order.items
        new_order.items = [child1, parent]
        
        db.add(new_order)
        try:
            await db.flush()
            print("FLUSH SUCCESS:", parent.id, child1.id, child1.parent_item_id, child1.order_id)
            await db.commit()
        except Exception as e:
            print("ERROR:", e)

asyncio.run(test_creation())
