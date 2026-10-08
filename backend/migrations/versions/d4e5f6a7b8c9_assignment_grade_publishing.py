"""assignment_grade_publishing

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-10-08 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'assignments',
        sa.Column('grades_published', sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        'assignments',
        sa.Column('grades_published_at', sa.DateTime(timezone=True), nullable=True),
    )
    # Scores were visible to Praktikan before publishing existed; keep them visible.
    op.execute(
        """
        UPDATE assignments
        SET grades_published = true, grades_published_at = now()
        WHERE EXISTS (
            SELECT 1 FROM submissions
            WHERE submissions.assignment_id = assignments.id
              AND submissions.score IS NOT NULL
        )
        """
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('assignments', 'grades_published_at')
    op.drop_column('assignments', 'grades_published')
