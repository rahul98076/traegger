"""merge_heads

Revision ID: 8ea6d53bf883
Revises: 9030283c741e, e5f60d982307
Create Date: 2026-03-30 21:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8ea6d53bf883'
down_revision: Union[str, Sequence[str], None] = ('9030283c741e', 'e5f60d982307')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
