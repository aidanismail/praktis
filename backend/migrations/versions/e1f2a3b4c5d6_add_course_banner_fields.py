"""add_course_banner_fields

Revision ID: e1f2a3b4c5d6
Revises: 1a2b3c4d5e6f
Create Date: 2026-09-05 20:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e1f2a3b4c5d6'
down_revision: Union[str, Sequence[str], None] = '1a2b3c4d5e6f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('courses', sa.Column('banner_theme_id', sa.String(length=50), nullable=True))
    op.add_column('courses', sa.Column('banner_pattern_id', sa.String(length=50), nullable=True))
    op.add_column('courses', sa.Column('banner_image_url', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('courses', 'banner_image_url')
    op.drop_column('courses', 'banner_pattern_id')
    op.drop_column('courses', 'banner_theme_id')

