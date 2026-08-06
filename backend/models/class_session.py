import uuid
import datetime
from sqlalchemy import String, Date, ForeignKey, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base

class ClassSession(Base):
    __tablename__ = "class_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(255)) # e.g., "Pertemuan 1: Pengenalan"
    date: Mapped[datetime.date] = mapped_column(Date)
    attendance_status: Mapped[str] = mapped_column(String(20), default="SCHEDULED")
    
    grades_published: Mapped[bool] = mapped_column(Boolean, default=False)
    grades_published_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    grades_published_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
