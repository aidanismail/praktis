"""add_announcements_and_assignments

Revision ID: 1a2b3c4d5e6f
Revises: 0f9b4b07b7d4
Create Date: 2026-08-17 16:48:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = '1a2b3c4d5e6f'
down_revision: Union[str, Sequence[str], None] = '0f9b4b07b7d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Announcements Table
    op.create_table(
        'announcements',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('course_id', UUID(as_uuid=True), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('author_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_pinned', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f('ix_announcements_course_id'), 'announcements', ['course_id'], unique=False)
    op.create_index(op.f('ix_announcements_author_id'), 'announcements', ['author_id'], unique=False)

    # 2. Announcement Comments Table
    op.create_table(
        'announcement_comments',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('announcement_id', UUID(as_uuid=True), sa.ForeignKey('announcements.id', ondelete='CASCADE'), nullable=False),
        sa.Column('author_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f('ix_announcement_comments_announcement_id'), 'announcement_comments', ['announcement_id'], unique=False)
    op.create_index(op.f('ix_announcement_comments_author_id'), 'announcement_comments', ['author_id'], unique=False)

    # 3. Assignments Table
    op.create_table(
        'assignments',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('course_id', UUID(as_uuid=True), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('session_id', UUID(as_uuid=True), sa.ForeignKey('class_sessions.id', ondelete='SET NULL'), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('max_points', sa.Integer(), server_default='100', nullable=False),
        sa.Column('allowed_file_types', sa.String(length=100), server_default='pdf,zip,docx', nullable=False),
        sa.Column('is_published', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_by', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(op.f('ix_assignments_course_id'), 'assignments', ['course_id'], unique=False)
    op.create_index(op.f('ix_assignments_session_id'), 'assignments', ['session_id'], unique=False)
    op.create_index(op.f('ix_assignments_created_by'), 'assignments', ['created_by'], unique=False)

    # 4. Submissions Table
    op.create_table(
        'submissions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('assignment_id', UUID(as_uuid=True), sa.ForeignKey('assignments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('student_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('file_key', sa.String(length=500), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_size', sa.Integer(), server_default='0', nullable=False),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_late', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('graded_by', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('graded_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=20), server_default='submitted', nullable=False),
        sa.UniqueConstraint('assignment_id', 'student_id', name='uix_assignment_student_submission'),
    )
    op.create_index(op.f('ix_submissions_assignment_id'), 'submissions', ['assignment_id'], unique=False)
    op.create_index(op.f('ix_submissions_student_id'), 'submissions', ['student_id'], unique=False)


def downgrade() -> None:
    op.drop_table('submissions')
    op.drop_table('assignments')
    op.drop_table('announcement_comments')
    op.drop_table('announcements')
