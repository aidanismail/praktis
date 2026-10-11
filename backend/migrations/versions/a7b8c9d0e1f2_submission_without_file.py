"""submission_without_file

Revision ID: a7b8c9d0e1f2
Revises: d4e5f6a7b8c9
Create Date: 2026-10-10 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7b8c9d0e1f2'
down_revision: Union[str, Sequence[str], None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column('submissions', 'file_key', existing_type=sa.String(length=500), nullable=True)
    op.alter_column('submissions', 'file_name', existing_type=sa.String(length=255), nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    # Submissions turned in without a file cannot be represented once the columns are required again.
    op.execute("DELETE FROM submissions WHERE file_key IS NULL OR file_name IS NULL")
    op.alter_column('submissions', 'file_name', existing_type=sa.String(length=255), nullable=False)
    op.alter_column('submissions', 'file_key', existing_type=sa.String(length=500), nullable=False)
