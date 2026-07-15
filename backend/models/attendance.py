import uuid
import enum
from sqlalchemy import ForeignKey, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base

class AttendanceStatus(str, enum.Enum):
    HADIR = "hadir"
    SAKIT = "sakit"
    IZIN = "izin"
    ALFA = "alfa"

class Attendance(Base):
    __tablename__ = "attendances"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("class_sessions.id", ondelete="CASCADE"))
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    status: Mapped[AttendanceStatus] = mapped_column(Enum(AttendanceStatus, name="attendance_status_enum", create_type=False))

    __table_args__ = (
        UniqueConstraint("session_id", "student_id", name="uix_session_student"),
    )