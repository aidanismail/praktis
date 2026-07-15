"""add_course_id_to_modules

Revision ID: c7c7cf5da67d
Revises: cc442f966182
Create Date: 2026-07-15 00:00:02.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7c7cf5da67d'
down_revision: Union[str, Sequence[str], None] = 'cc442f966182'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('modules', sa.Column('course_id', sa.UUID(), nullable=True))
    op.create_foreign_key(
        'fk_modules_course_id_courses', 'modules', 'courses',
        ['course_id'], ['id'], ondelete='CASCADE'
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_modules_course_id_courses', 'modules', type_='foreignkey')
    op.drop_column('modules', 'course_id')
