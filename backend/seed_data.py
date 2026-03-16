from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from models.menu_item import MenuItem

MENU_SEED = [
    # Fruit Cakes Premium
    {"name": "Dark Fruit Cake",       "category": "fruit_cakes_premium", "size_unit": "1/2 kg bar", "price_paise": 75000},
    {"name": "Dark Fruit Cake",       "category": "fruit_cakes_premium", "size_unit": "1/4 kg bar", "price_paise": 38000},
    {"name": "White Fruit Cake",      "category": "fruit_cakes_premium", "size_unit": "1/2 kg bar", "price_paise": 75000},
    {"name": "White Fruit Cake",      "category": "fruit_cakes_premium", "size_unit": "1/4 kg bar", "price_paise": 38000},
    {"name": "Date & Walnut Cake",    "category": "fruit_cakes_premium", "size_unit": "1/2 kg bar", "price_paise": 75000},
    {"name": "Date & Walnut Cake",    "category": "fruit_cakes_premium", "size_unit": "1/4 kg bar", "price_paise": 38000},
    # Cakes Standard
    {"name": "Carrot Walnut Cake",    "category": "cakes_standard",      "size_unit": "1/2 kg bar", "price_paise": 50000},
    {"name": "Carrot Walnut Cake",    "category": "cakes_standard",      "size_unit": "1/4 kg bar", "price_paise": 26000},
    {"name": "Banana Choc Chip Cake", "category": "cakes_standard",      "size_unit": "1/2 kg bar", "price_paise": 50000},
    {"name": "Banana Choc Chip Cake", "category": "cakes_standard",      "size_unit": "1/4 kg bar", "price_paise": 26000},
    # Marzipan Treats
    {"name": "Marzipan Egg",          "category": "marzipan_treats",     "size_unit": "60g",        "price_paise": 14000},
    {"name": "Marzipan Egg",          "category": "marzipan_treats",     "size_unit": "110g",       "price_paise": 24000},
    {"name": "Half Egg (Marzipan)",   "category": "marzipan_treats",     "size_unit": "1 piece",    "price_paise": 10000},
    {"name": "Bunny (Marzipan)",      "category": "marzipan_treats",     "size_unit": "1 piece",    "price_paise": 11000},
    {"name": "Chicken (Marzipan)",    "category": "marzipan_treats",     "size_unit": "1 piece",    "price_paise": 8500},
    {"name": "Bonnet (Marzipan)",     "category": "marzipan_treats",     "size_unit": "1 piece",    "price_paise": 8500},
    {"name": "Surprise Egg",          "category": "marzipan_treats",     "size_unit": "1 piece",    "price_paise": 25000, "notes": "Hollow with treats inside"},
    {"name": "Choco Walnut Egg",      "category": "marzipan_treats",     "size_unit": "1 piece",    "price_paise": 10000},
    # Gift Boxes & Bakery
    {"name": "Gift Box of 4 Eggs",    "category": "gift_boxes_bakery",   "size_unit": "4 pcs",      "price_paise": 59000},
    {"name": "Assorted Box",          "category": "gift_boxes_bakery",   "size_unit": "6 pcs",      "price_paise": 69000},
    {"name": "Rich Choc Brownie",     "category": "gift_boxes_bakery",   "size_unit": "6 pcs",      "price_paise": 60000},
    {"name": "Brownie Bites Tub",     "category": "gift_boxes_bakery",   "size_unit": "1 tub",      "price_paise": 32500},
    {"name": "Macarons",              "category": "gift_boxes_bakery",   "size_unit": "6 pcs",      "price_paise": 45000},
    # Homemade
    {"name": "Bottle Masala",         "category": "homemade",            "size_unit": "1/4 kg bottle", "price_paise": 50000},
    {"name": "Black Currant Wine",    "category": "homemade",            "size_unit": "1 litre",    "price_paise": 50000},
]

async def seed_menu(db: AsyncSession):
    # Check if any items exist
    result = await db.execute(select(MenuItem).limit(1))
    first_item = result.scalar_one_or_none()
    
    if not first_item:
        print("Seeding Easter Menu...")
        for item_data in MENU_SEED:
            item = MenuItem(**item_data)
            db.add(item)
        await db.commit()
        print("Easter Menu Seeded Successfully.")
