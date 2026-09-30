"""add_audit_fields_attendance_grades

Revision ID: a3c4d5e6f7b8
Revises: f2b3c4d5e6a7
Create Date: 2026-07-28 00:00:02.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3c4d5e6f7b8'
down_revision: Union[str, Sequence[str], None] = 'f2b3c4d5e6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_TABLES = ('attendances', 'grades')


def upgrade() -> None:
    """Upgrade schema."""
    for table in _TABLES:
        op.add_column(table, sa.Column(
            'created_at', sa.DateTime(timezone=True),
            server_default=sa.text('now()'), nullable=False,
        ))
        op.add_column(table, sa.Column(
            'updated_at', sa.DateTime(timezone=True),
            server_default=sa.text('now()'), nullable=False,
        ))
        op.add_column(table, sa.Column('recorded_by', sa.UUID(), nullable=True))
        op.create_foreign_key(
            f'fk_{table}_recorded_by_users', table, 'users',
            ['recorded_by'], ['id'], ondelete='SET NULL',
        )


def downgrade() -> None:
    """Downgrade schema."""
    for table in _TABLES:
        op.drop_constraint(f'fk_{table}_recorded_by_users', table, type_='foreignkey')
        op.drop_column(table, 'recorded_by')
        op.drop_column(table, 'updated_at')
        op.drop_column(table, 'created_at')
