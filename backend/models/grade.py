import uuid
from sqlalchemy import Float, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base

class Grade(Base):
    __tablename__ = "grades"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True),
                                          primary_key=True,
                                          default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("class_sessions.id", 
                                                             ondelete="CASCADE"))
    student_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", 
                                                             ondelete="CASCADE"))
    score: Mapped[float] = mapped_column(Float, 
                                         nullable=False, 
                                         default=0.0)
    
    __table_args__ = (
        UniqueConstraint("session_id", "student_id", name="uix_session_student_grade"),
    )