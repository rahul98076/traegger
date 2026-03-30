"""fix_missing_order_items_columns

Revision ID: 9030283c741e
Revises: 5b9dbd681516
Create Date: 2026-03-30 20:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9030283c741e'
down_revision: Union[str, Sequence[str], None] = '5b9dbd681516'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add missing columns to order_items using batch mode for SQLite compatibility
    with op.batch_alter_table('order_items', schema=None) as batch_op:
        batch_op.add_column(sa.Column('parent_item_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('custom_name', sa.String(), nullable=True))
        # Establish the foreign key now that the column exists
        batch_op.create_foreign_key(
            batch_op.f('fk_order_items_parent_item_id_order_items'), 
            'order_items', ['parent_item_id'], ['id'], ondelete='CASCADE'
        )

def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('order_items', schema=None) as batch_op:
        batch_op.drop_constraint(batch_op.f('fk_order_items_parent_item_id_order_items'), type_='foreignkey')
        batch_op.drop_column('custom_name')
        batch_op.drop_column('parent_item_id')
