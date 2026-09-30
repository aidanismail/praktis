from pydantic import BaseModel, Field, field_validator


class AnnouncementCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Announcement title.")
    content: str = Field(..., min_length=1, description="Announcement body content.")
    is_pinned: bool = Field(False, description="Whether this post is pinned to the top of the course stream.")


class AnnouncementUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255, description="New announcement title.")
    content: str | None = Field(None, min_length=1, description="New announcement body content.")
    is_pinned: bool | None = Field(None, description="Pin status update.")


class AnnouncementCommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000, description="Comment message content.")

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Comment cannot be empty or whitespace only")
        if len(trimmed) > 1000:
            raise ValueError("Comment cannot exceed 1000 characters")
        return trimmed


class AnnouncementCommentResponse(BaseModel):
    id: str = Field(..., description="Comment unique ID.")
    announcement_id: str = Field(..., description="Announcement ID.")
    author_id: str = Field(..., description="User ID of author.")
    author_username: str = Field(..., description="Username of author.")
    author_role: str = Field(..., description="Role of author.")
    content: str = Field(..., description="Comment text.")
    created_at: str = Field(..., description="ISO timestamp.")


class AnnouncementResponse(BaseModel):
    id: str = Field(..., description="Announcement ID.")
    course_id: str = Field(..., description="Course ID.")
    author_id: str = Field(..., description="User ID of author.")
    author_username: str = Field(..., description="Username of author.")
    author_role: str = Field(..., description="Role of author.")
    title: str = Field(..., description="Announcement title.")
    content: str = Field(..., description="Announcement content.")
    is_pinned: bool = Field(..., description="Whether announcement is pinned.")
    created_at: str = Field(..., description="Creation ISO timestamp.")
    updated_at: str = Field(..., description="Update ISO timestamp.")
    comments_count: int = Field(0, description="Total comments on this announcement.")
    comments: list[AnnouncementCommentResponse] = Field(default_factory=list, description="Recent comments list.")
