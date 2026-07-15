"""add_dosen_role

Revision ID: cc442f966182
Revises: 6f5359975bae
Create Date: 2026-07-15 00:00:01.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'cc442f966182'
down_revision: Union[str, Sequence[str], None] = '6f5359975bae'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Adding a value to a Postgres enum type cannot run inside a transaction block.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE role_enum ADD VALUE IF NOT EXISTS 'dosen'")


def downgrade() -> None:
    """Downgrade schema."""
    # Postgres has no direct "remove enum value" support; downgrading this
    # would require rebuilding the enum type and is intentionally a no-op.
    pass
