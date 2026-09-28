"""add_allow_late_submissions_to_assignments

Revision ID: b2c3d4e5f6a7
Revises: e1f2a3b4c5d6
Create Date: 2026-09-28 14:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'e1f2a3b4c5d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'assignments',
        sa.Column('allow_late_submissions', sa.Boolean(), server_default=sa.true(), nullable=False)
    )


def downgrade() -> None:
    op.drop_column('assignments', 'allow_late_submissions')
