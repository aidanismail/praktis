import uuid
from datetime import datetime, timezone
from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base

class Module(Base):
    __tablename__ = "modules"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), 
                                          primary_key=True, 
                                          default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), 
                                       nullable=False)
    description: Mapped[str] = mapped_column(String(500), 
                                             nullable=True)
    file_key: Mapped[str] = mapped_column(String(255),
                                          unique=True,
                                          nullable=False)

    course_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"),
                                                        nullable=True)

    uploaded_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"),
                                                   nullable=False)
    is_published: Mapped[bool] = mapped_column(nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), 
                                                 default=lambda: datetime.now(timezone.utc))