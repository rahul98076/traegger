import sqlite3
import os

DB_PATH = "/home/rahul/traegger/backend/pennys.db"

MENU_SEED = [
    {"name": "Dark Fruit Cake",       "category": "fruit_cakes_premium", "size_unit": "1/2 kg bar", "price_paise": 75000},
    {"name": "Dark Fruit Cake",       "category": "fruit_cakes_premium", "size_unit": "1/4 kg bar", "price_paise": 38000},
    {"name": "White Fruit Cake",      "category": "fruit_cakes_premium", "size_unit": "1/2 kg bar", "price_paise": 75000},
    {"name": "White Fruit Cake",      "category": "fruit_cakes_premium", "size_unit": "1/4 kg bar", "price_paise": 38000},
    {"name": "Date & Walnut Cake",    "category": "fruit_cakes_premium", "size_unit": "1/2 kg bar", "price_paise": 75000},
    {"name": "Date & Walnut Cake",    "category": "fruit_cakes_premium", "size_unit": "1/4 kg bar", "price_paise": 38000},
    {"name": "Carrot Walnut Cake",    "category": "cakes_standard",      "size_unit": "1/2 kg bar", "price_paise": 50000},
    {"name": "Carrot Walnut Cake",    "category": "cakes_standard",      "size_unit": "1/4 kg bar", "price_paise": 26000},
    {"name": "Banana Choc Chip Cake", "category": "cakes_standard",      "size_unit": "1/2 kg bar", "price_paise": 50000},
    {"name": "Banana Choc Chip Cake", "category": "cakes_standard",      "size_unit": "1/4 kg bar", "price_paise": 26000},
    {"name": "Marzipan Egg",          "category": "marzipan_treats",     "size_unit": "60g",        "price_paise": 14000},
    {"name": "Marzipan Egg",          "category": "marzipan_treats",     "size_unit": "110g",       "price_paise": 24000},
    {"name": "Half Egg (Marzipan)",   "category": "marzipan_treats",     "size_unit": "1 piece",    "price_paise": 10000},
    {"name": "Bunny (Marzipan)",      "category": "marzipan_treats",     "size_unit": "1 piece",    "price_paise": 11000},
    {"name": "Chicken (Marzipan)",    "category": "marzipan_treats",     "size_unit": "1 piece",    "price_paise": 8500},
    {"name": "Bonnet (Marzipan)",     "category": "marzipan_treats",     "size_unit": "1 piece",    "price_paise": 8500},
    {"name": "Surprise Egg",          "category": "marzipan_treats",     "size_unit": "1 piece",    "price_paise": 25000},
    {"name": "Choco Walnut Egg",      "category": "marzipan_treats",     "size_unit": "1 piece",    "price_paise": 10000},
    {"name": "Gift Box of 4 Eggs",    "category": "gift_boxes_bakery",   "size_unit": "4 pcs",      "price_paise": 59000},
    {"name": "Assorted Box",          "category": "gift_boxes_bakery",   "size_unit": "6 pcs",      "price_paise": 69000},
    {"name": "Rich Choc Brownie",     "category": "gift_boxes_bakery",   "size_unit": "6 pcs",      "price_paise": 60000},
    {"name": "Brownie Bites Tub",     "category": "gift_boxes_bakery",   "size_unit": "1 tub",      "price_paise": 32500},
    {"name": "Macarons",              "category": "gift_boxes_bakery",   "size_unit": "6 pcs",      "price_paise": 45000},
    {"name": "Single Rich Choc Brownie", "category": "gift_boxes_bakery", "size_unit": "1 pc",    "price_paise": 10000, "is_available": 0},
    {"name": "Single Macaron",        "category": "gift_boxes_bakery",   "size_unit": "1 pc",       "price_paise": 7500, "is_available": 0},
    {"name": "Bottle Masala",         "category": "homemade",            "size_unit": "1/4 kg bottle", "price_paise": 50000},
    {"name": "Black Currant Wine",    "category": "homemade",            "size_unit": "1 litre",    "price_paise": 50000},
]

def repair():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    updated_count = 0
    inserted_count = 0

    print("--- Repairing Menu Units ---")
    for item in MENU_SEED:
        name = item["name"]
        category = item["category"]
        unit = item["size_unit"]
        price = item["price_paise"]
        avail = item.get("is_available", 1)

        # 1. Check if item exists with placeholder 'unit'
        cursor.execute(
            "SELECT id, size_unit FROM menu_items WHERE name = ? AND category = ?", 
            (name, category)
        )
        existing = cursor.fetchall()

        if existing:
            for item_id, current_unit in existing:
                if current_unit == 'unit' or not current_unit:
                    print(f"Updating unit for '{name}' -> {unit}")
                    cursor.execute(
                        "UPDATE menu_items SET size_unit = ? WHERE id = ?",
                        (unit, item_id)
                    )
                    updated_count += 1
        else:
            # 2. If it doesn't exist at all, insert it
            print(f"Restoring missing item: '{name}' ({unit})")
            cursor.execute(
                "INSERT INTO menu_items (name, category, size_unit, price_paise, is_available) VALUES (?, ?, ?, ?, ?)",
                (name, category, unit, price, avail)
            )
            inserted_count += 1

    conn.commit()
    conn.close()
    print("----------------------------")
    print(f"Repair Complete. Updated: {updated_count}, Inserted: {inserted_count}")

if __name__ == "__main__":
    repair()
