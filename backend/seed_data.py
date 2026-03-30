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
    {"name": "Single Rich Choc Brownie", "category": "gift_boxes_bakery", "size_unit": "1 pc", "price_paise": 10000, "is_available": 0},
    {"name": "Single Macaron",        "category": "gift_boxes_bakery",   "size_unit": "1 pc",       "price_paise": 7500, "is_available": 0},
    # Homemade
    {"name": "Bottle Masala",         "category": "homemade",            "size_unit": "1/4 kg bottle", "price_paise": 50000},
    {"name": "Black Currant Wine",    "category": "homemade",            "size_unit": "1 litre",    "price_paise": 50000},
]

from models.menu_item_constituent import MenuItemConstituent

COMBO_MAPPINGS = [
    {
        "parent_name": "Gift Box of 4 Eggs",
        "parent_size": "4 pcs",
        "children": [
            {"child_name": "Marzipan Egg", "child_size": "60g", "quantity": 4}
        ]
    },
    {
        "parent_name": "Assorted Box",
        "parent_size": "6 pcs",
        "children": [
            {"child_name": "Marzipan Egg", "child_size": "60g", "quantity": 2},
            {"child_name": "Bunny (Marzipan)", "child_size": "1 piece", "quantity": 2},
            {"child_name": "Chicken (Marzipan)", "child_size": "1 piece", "quantity": 1},
            {"child_name": "Bonnet (Marzipan)", "child_size": "1 piece", "quantity": 1}
        ]
    },
    {
        "parent_name": "Rich Choc Brownie",
        "parent_size": "6 pcs",
        "children": [
            {"child_name": "Single Rich Choc Brownie", "child_size": "1 pc", "quantity": 6}
        ]
    },
    {
        "parent_name": "Macarons",
        "parent_size": "6 pcs",
        "children": [
            {"child_name": "Single Macaron", "child_size": "1 pc", "quantity": 6}
        ]
    }
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
        
        # Second pass to add constituents safely
        print("Seeding Constituents...")
        res = await db.execute(select(MenuItem))
        all_items = res.scalars().all()
        item_map = {(i.name, i.size_unit): i for i in all_items}

        for combo in COMBO_MAPPINGS:
            parent_item = item_map.get((combo["parent_name"], combo["parent_size"]))
            if not parent_item: continue
            
            for child in combo["children"]:
                child_item = item_map.get((child["child_name"], child["child_size"]))
                if not child_item: continue
                
                new_const = MenuItemConstituent(
                    parent_item_id=parent_item.id,
                    child_item_id=child_item.id,
                    quantity=child["quantity"]
                )
                db.add(new_const)
                
        await db.commit()
        print("Easter Menu Seeded Successfully.")
