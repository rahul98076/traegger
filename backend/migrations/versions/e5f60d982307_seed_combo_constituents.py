"""seed combo constituents

Revision ID: e5f60d982307
Revises: 697ee3a84f1e
Create Date: 2026-03-30 14:16:12.779984

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f60d982307'
down_revision: Union[str, Sequence[str], None] = '697ee3a84f1e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()

    # 1. Insert Single Items if they do not exist
    res = bind.execute(sa.text("SELECT id FROM menu_items WHERE name = 'Single Rich Choc Brownie'")).first()
    if not res:
        bind.execute(sa.text("INSERT INTO menu_items (name, category, size_unit, price_paise, is_available) VALUES ('Single Rich Choc Brownie', 'gift_boxes_bakery', '1 pc', 10000, 0)"))

    res = bind.execute(sa.text("SELECT id FROM menu_items WHERE name = 'Single Macaron'")).first()
    if not res:
        bind.execute(sa.text("INSERT INTO menu_items (name, category, size_unit, price_paise, is_available) VALUES ('Single Macaron', 'gift_boxes_bakery', '1 pc', 7500, 0)"))

    # 2. Get mapping for combinations
    res = bind.execute(sa.text("SELECT id, name, size_unit FROM menu_items"))
    name_map = {(row[1], row[2]): row[0] for row in res}

    combos = [
        ("Gift Box of 4 Eggs", "4 pcs", [("Marzipan Egg", "60g", 4)]),
        ("Assorted Box", "6 pcs", [("Marzipan Egg", "60g", 2), ("Bunny (Marzipan)", "1 piece", 2), ("Chicken (Marzipan)", "1 piece", 1), ("Bonnet (Marzipan)", "1 piece", 1)]),
        ("Rich Choc Brownie", "6 pcs", [("Single Rich Choc Brownie", "1 pc", 6)]),
        ("Macarons", "6 pcs", [("Single Macaron", "1 pc", 6)])
    ]

    for c_name, c_size, children in combos:
        p_id = name_map.get((c_name, c_size))
        if not p_id: continue
        for child_name, child_size, qty in children:
            c_id = name_map.get((child_name, child_size))
            if not c_id: continue

            exist = bind.execute(sa.text("SELECT 1 FROM menu_item_constituents WHERE parent_item_id = :p AND child_item_id = :c"), {"p": p_id, "c": c_id}).first()
            if not exist:
                bind.execute(sa.text("INSERT INTO menu_item_constituents (parent_item_id, child_item_id, quantity) VALUES (:p, :c, :q)"), {"p": p_id, "c": c_id, "q": qty})


def downgrade() -> None:
    """Downgrade schema."""
    pass
