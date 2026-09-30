import hashlib
import logging
import time
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from core import cache
from core.database import get_db
from core.rate_limit import check_rate_limit
from api.dependencies import get_current_active_user
from api.permissions import require_course_access
from models.user import User, RoleEnum
from models.announcement import Announcement, AnnouncementComment
from schemas.announcement import (
    AnnouncementCreate,
    AnnouncementUpdate,
    AnnouncementResponse,
    AnnouncementCommentCreate,
    AnnouncementCommentResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/courses/{course_id}/announcements", tags=["Announcements"])

UNAUTHENTICATED_401 = {401: {"description": "Missing or invalid session cookie."}}
FORBIDDEN_403 = {403: {"description": "Caller is not enrolled or assigned to this course, or lacks write permissions."}}
NOT_FOUND_404 = {404: {"description": "Course or announcement not found."}}
BAD_REQUEST_400 = {400: {"description": "Duplicate comment, invalid payload, or validation error."}}
TOO_MANY_REQUESTS_429 = {429: {"description": "Comment rate limit or cooldown exceeded."}}

_in_memory_dup_cache: dict[str, tuple[str, float]] = {}


def _check_in_memory_duplicate(key: str, content_hash: str) -> None:
    now = time.time()
    if len(_in_memory_dup_cache) > 2000:
        expired = [k for k, (_, exp) in _in_memory_dup_cache.items() if now > exp]
        for k in expired:
            _in_memory_dup_cache.pop(k, None)

    last_hash, exp_at = _in_memory_dup_cache.get(key, ("", 0.0))
    if now <= exp_at and last_hash == content_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate comment detected. Please avoid posting identical messages.",
        )
    _in_memory_dup_cache[key] = (content_hash, now + 60.0)


@router.get(
    "",
    response_model=list[AnnouncementResponse],
    summary="List course stream announcements",
    description=(
        "Returns all announcements posted in the course stream, sorted with pinned items first, "
        "then newest to oldest. Enrolled students (Praktikan), assigned teaching assistants (Asprak), "
        "and Superadmins have access."
    ),
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **NOT_FOUND_404},
)
async def list_announcements(
    course_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await require_course_access(db, current_user, course_id, write=False)

    result = await db.execute(
        select(Announcement)
        .where(Announcement.course_id == course_id)
        .options(selectinload(Announcement.comments))
        .order_by(Announcement.is_pinned.desc(), Announcement.created_at.desc())
    )
    announcements = result.scalars().all()

    author_ids = {a.author_id for a in announcements}
    for a in announcements:
        for c in a.comments:
            author_ids.add(c.author_id)

    users_map = {}
    if author_ids:
        u_res = await db.execute(select(User).where(User.id.in_(author_ids)))
        users_map = {u.id: u for u in u_res.scalars().all()}

    response_items = []
    for a in announcements:
        author = users_map.get(a.author_id)
        comments_list = []
        for c in a.comments:
            c_author = users_map.get(c.author_id)
            comments_list.append(
                AnnouncementCommentResponse(
                    id=str(c.id),
                    announcement_id=str(c.announcement_id),
                    author_id=str(c.author_id),
                    author_username=c_author.username if c_author else "Unknown",
                    author_role=c_author.role.value if c_author else "unknown",
                    content=c.content,
                    created_at=c.created_at.isoformat(),
                )
            )

        response_items.append(
            AnnouncementResponse(
                id=str(a.id),
                course_id=str(a.course_id),
                author_id=str(a.author_id),
                author_username=author.username if author else "Unknown",
                author_role=author.role.value if author else "unknown",
                title=a.title,
                content=a.content,
                is_pinned=a.is_pinned,
                created_at=a.created_at.isoformat(),
                updated_at=a.updated_at.isoformat(),
                comments_count=len(a.comments),
                comments=comments_list,
            )
        )

    return response_items


@router.post(
    "",
    response_model=AnnouncementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create announcement post",
    description=(
        "Posts a new broadcast announcement to the course stream. "
        "Requires Superadmin role or an Asprak assigned to this course."
    ),
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **NOT_FOUND_404},
)
async def create_announcement(
    course_id: uuid.UUID,
    payload: AnnouncementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await require_course_access(db, current_user, course_id, write=True)

    new_announcement = Announcement(
        course_id=course_id,
        author_id=current_user.id,
        title=payload.title,
        content=payload.content,
        is_pinned=payload.is_pinned,
    )
    db.add(new_announcement)
    await db.commit()
    await db.refresh(new_announcement)

    return AnnouncementResponse(
        id=str(new_announcement.id),
        course_id=str(new_announcement.course_id),
        author_id=str(new_announcement.author_id),
        author_username=current_user.username,
        author_role=current_user.role.value,
        title=new_announcement.title,
        content=new_announcement.content,
        is_pinned=new_announcement.is_pinned,
        created_at=new_announcement.created_at.isoformat(),
        updated_at=new_announcement.updated_at.isoformat(),
        comments_count=0,
        comments=[],
    )


@router.patch(
    "/{announcement_id}",
    response_model=AnnouncementResponse,
    summary="Update announcement post",
    description="Updates the title, content, or pinned status of an announcement. Only author or Superadmin can edit.",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **NOT_FOUND_404},
)
async def update_announcement(
    course_id: uuid.UUID,
    announcement_id: uuid.UUID,
    payload: AnnouncementUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await require_course_access(db, current_user, course_id, write=True)

    result = await db.execute(
        select(Announcement).where(Announcement.id == announcement_id, Announcement.course_id == course_id)
    )
    announcement = result.scalars().first()
    if not announcement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found")

    if current_user.role != RoleEnum.SUPERADMIN and announcement.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own announcements")

    if payload.title is not None:
        announcement.title = payload.title
    if payload.content is not None:
        announcement.content = payload.content
    if payload.is_pinned is not None:
        announcement.is_pinned = payload.is_pinned

    await db.commit()
    await db.refresh(announcement)

    return AnnouncementResponse(
        id=str(announcement.id),
        course_id=str(announcement.course_id),
        author_id=str(announcement.author_id),
        author_username=current_user.username,
        author_role=current_user.role.value,
        title=announcement.title,
        content=announcement.content,
        is_pinned=announcement.is_pinned,
        created_at=announcement.created_at.isoformat(),
        updated_at=announcement.updated_at.isoformat(),
        comments_count=0,
        comments=[],
    )


@router.delete(
    "/{announcement_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete announcement post",
    description="Deletes an announcement and all associated discussion comments. Only author or Superadmin can delete.",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **NOT_FOUND_404},
)
async def delete_announcement(
    course_id: uuid.UUID,
    announcement_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await require_course_access(db, current_user, course_id, write=True)

    result = await db.execute(
        select(Announcement).where(Announcement.id == announcement_id, Announcement.course_id == course_id)
    )
    announcement = result.scalars().first()
    if not announcement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found")

    if current_user.role != RoleEnum.SUPERADMIN and announcement.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own announcements")

    await db.delete(announcement)
    await db.commit()


@router.post(
    "/{announcement_id}/comments",
    response_model=AnnouncementCommentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add comment to announcement",
    description=(
        "Adds a comment or question to the announcement discussion thread. "
        "Enrolled students and staff can comment. Protected against spam via "
        "user-scoped rate limiting (5/min), cooldown (3s), and in-memory/Redis SHA-256 duplicate detection."
    ),
    responses={
        **UNAUTHENTICATED_401,
        **FORBIDDEN_403,
        **NOT_FOUND_404,
        **BAD_REQUEST_400,
        **TOO_MANY_REQUESTS_429,
    },
)
async def add_comment(
    course_id: uuid.UUID,
    announcement_id: uuid.UUID,
    payload: AnnouncementCommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await require_course_access(db, current_user, course_id, write=False)

    # 1. Anti-Spam: In-memory/Redis SHA-256 duplicate detection (60-second window)
    content_hash = hashlib.sha256(payload.content.lower().encode("utf-8")).hexdigest()
    dup_key = f"comment_hash:{current_user.id}:{announcement_id}"

    if cache.redis_client is not None:
        try:
            last_hash = await cache.redis_client.get(dup_key)
            if last_hash == content_hash:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Duplicate comment detected. Please avoid posting identical messages.",
                )
            await cache.redis_client.set(dup_key, content_hash, ex=60)
        except HTTPException:
            raise
        except Exception as exc:
            logger.warning("Redis duplicate check failed: %s, falling back to in-memory", exc)
            _check_in_memory_duplicate(dup_key, content_hash)
    else:
        _check_in_memory_duplicate(dup_key, content_hash)

    await check_rate_limit(key=f"comment_burst:{current_user.id}", max_requests=5, window_seconds=60)
    await check_rate_limit(key=f"comment_cooldown:{current_user.id}:{announcement_id}", max_requests=1, window_seconds=3)

    result = await db.execute(
        select(Announcement).where(Announcement.id == announcement_id, Announcement.course_id == course_id)
    )
    announcement = result.scalars().first()
    if not announcement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found")

    new_comment = AnnouncementComment(
        announcement_id=announcement.id,
        author_id=current_user.id,
        content=payload.content,
    )
    db.add(new_comment)
    await db.commit()
    await db.refresh(new_comment)

    return AnnouncementCommentResponse(
        id=str(new_comment.id),
        announcement_id=str(new_comment.announcement_id),
        author_id=str(new_comment.author_id),
        author_username=current_user.username,
        author_role=current_user.role.value,
        content=new_comment.content,
        created_at=new_comment.created_at.isoformat(),
    )


@router.delete(
    "/{announcement_id}/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete discussion comment",
    description="Deletes a specific comment from an announcement thread. Allowed for comment author, assigned course Asprak, or Superadmin.",
    responses={**UNAUTHENTICATED_401, **FORBIDDEN_403, **NOT_FOUND_404},
)
async def delete_comment(
    course_id: uuid.UUID,
    announcement_id: uuid.UUID,
    comment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    await require_course_access(db, current_user, course_id, write=False)

    ann_result = await db.execute(
        select(Announcement).where(Announcement.id == announcement_id, Announcement.course_id == course_id)
    )
    if not ann_result.scalars().first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found")

    result = await db.execute(
        select(AnnouncementComment).where(
            AnnouncementComment.id == comment_id,
            AnnouncementComment.announcement_id == announcement_id,
        )
    )
    comment = result.scalars().first()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

    is_course_staff = False
    if current_user.role == RoleEnum.ASPRAK:
        try:
            await require_course_access(db, current_user, course_id, write=True)
            is_course_staff = True
        except HTTPException:
            is_course_staff = False

    if (
        current_user.role != RoleEnum.SUPERADMIN
        and comment.author_id != current_user.id
        and not is_course_staff
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this comment",
        )

    await db.delete(comment)
    await db.commit()
