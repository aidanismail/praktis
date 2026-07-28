"""add_course_staff_table

Revision ID: f2b3c4d5e6a7
Revises: c7c7cf5da67d
Create Date: 2026-07-28 00:00:01.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f2b3c4d5e6a7'
down_revision: Union[str, Sequence[str], None] = 'c7c7cf5da67d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'course_staff',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('course_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('course_id', 'user_id', name='uix_course_staff'),
    )
    op.create_index(op.f('ix_course_staff_course_id'), 'course_staff', ['course_id'])
    op.create_index(op.f('ix_course_staff_user_id'), 'course_staff', ['user_id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_course_staff_user_id'), table_name='course_staff')
    op.drop_index(op.f('ix_course_staff_course_id'), table_name='course_staff')
    op.drop_table('course_staff')
