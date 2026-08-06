import uuid
import datetime
from sqlalchemy import String, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


from sqlalchemy import String, Date, ForeignKey, UniqueConstraint, Boolean, DateTime

class Course(Base):
    __tablename__ = "courses"
    __table_args__ = (UniqueConstraint('code', 'academic_year', 'semester', name='uix_course_period'),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(50), index=True)
    name: Mapped[str] = mapped_column(String(255))
    academic_year: Mapped[str] = mapped_column(String(20))
    semester: Mapped[str] = mapped_column(String(20))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

