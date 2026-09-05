import asyncio
import uuid

from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.future import select

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.config import settings
from core.security import verify_password, create_access_token
from core.rate_limit import rate_limiter

from models.user import User, RoleEnum

from schemas.common import MessageResponse
from schemas.user import UserResponse, ChangePasswordRequest, LoginRequest, ImportCsvResponse, AdminResetPasswordRequest, UserCreate

from services.user_service import get_user_by_username, get_password_hash, bulk_create_users, create_user
from services.import_service import parse_import_file, ImportRow
from api.dependencies import get_current_user, RoleChecker


router = APIRouter(prefix="/auth", tags=["Authentication"])

_DUMMY_HASH = get_password_hash("praktis-timing-pad")

UNAUTHENTICATED_401 = {401: {"description": "Missing or invalid session cookie."}}
PASSWORD_CHANGE_REQUIRED_403 = {403: {"description": "Account is locked until the user changes their password."}}


@router.post(
    "/login",
    response_model=MessageResponse,
    summary="Log in and receive a session cookie",
    description=(
        "Verifies username/password and, on success, sets an HttpOnly `access_token` "
        "cookie containing a signed JWT. Rate-limited to 5 attempts per minute per client "
        "IP to slow down brute-force/credential-stuffing attempts."
    ),
    responses={
        401: {"description": "Incorrect username or password."}, 
        429: {"description": "Too many login attempts; try again later."},
    },
    dependencies=[Depends(rate_limiter(times=5, seconds=60, scope="login"))],
)
async def login(response: Response,
                login_data: LoginRequest,
                db: AsyncSession = Depends(get_db)
                ):

    user = await get_user_by_username(db, login_data.username)
    if user is None:
        await asyncio.to_thread(verify_password, login_data.password, _DUMMY_HASH)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    is_valid = await asyncio.to_thread(verify_password, login_data.password, user.hashed_password)
    if not is_valid or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    access_token_expires = timedelta(minutes=int(settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value},
        expires_delta=access_token_expires
    )

    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=int(settings.ACCESS_TOKEN_EXPIRE_MINUTES) * 60
    )
    return {"message": "Login successful"}

@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Log out",
    description="Clears the `access_token` cookie. Safe to call even if the user isn't logged in.",
)
async def logout(response: Response):

    response.delete_cookie("access_token")
    return {"message": "Logout successful"}

@router.post(
    "/change-password",
    response_model=MessageResponse,
    summary="Change the current user's password",
    description=(
        "Verifies the old password, rejects a new password identical to the old one, and "
        "clears `force_password_change`. This is the one write endpoint a user with "
        "`force_password_change=True` is always allowed to call. Rate-limited to 10 attempts "
        "per minute per client IP to prevent brute-force attacks against existing sessions."
    ),
    responses={
        **UNAUTHENTICATED_401,
        400: {"description": "Incorrect old password, or new password same as old."},
        429: {"description": "Too many password change attempts; try again later."},
    },
    dependencies=[Depends(rate_limiter(times=10, seconds=60, scope="change_password"))],
)
async def change_password(
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_old_valid = await asyncio.to_thread(verify_password, data.old_password, current_user.hashed_password)
    if not is_old_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password",
        )

    is_same = await asyncio.to_thread(verify_password, data.new_password, current_user.hashed_password)
    if is_same:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password",
        )

    new_hash = await asyncio.to_thread(get_password_hash, data.new_password)
    current_user.hashed_password = new_hash
    current_user.force_password_change = False

    db.add(current_user)
    await db.commit()

    return {"message": "Password changed successfully"}

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get the current logged-in user",
    description=(
        "Returns the caller's own profile, including `force_password_change`. Unlike every "
        "other protected endpoint, this one is reachable even when a password change is "
        "still pending, so the frontend can detect that state and redirect."
    ),
    responses=UNAUTHENTICATED_401, # type: ignore
)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


require_superadmin = RoleChecker([RoleEnum.SUPERADMIN])


@router.get(
    "/users",
    response_model=list[UserResponse],
    summary="List all registered system users",
    description="Superadmin only. Returns all registered user accounts.",
    responses={**UNAUTHENTICATED_401, 403: {"description": "Superadmin role required."}},
)
async def list_all_users(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_superadmin),
):
    result = await db.execute(select(User).order_by(User.username))
    return result.scalars().all()


@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user account",
    description="Superadmin only. Creates a new user account with specified username, email, role, and password.",
    responses={
        **UNAUTHENTICATED_401,
        403: {"description": "Superadmin role required."},
        409: {"description": "Username or email already exists."},
    },
)
async def create_new_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_superadmin),
):
    existing_user = await get_user_by_username(db, user_in.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with username '{user_in.username}' already exists.",
        )

    email_check = await db.execute(select(User).where(User.email == user_in.email))
    if email_check.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with email '{user_in.email}' already exists.",
        )

    try:
        new_user = await create_user(db, user_in)
        return new_user
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conflict creating user account.",
        )


@router.post(
    "/users/{user_id}/reset-password",
    response_model=MessageResponse,
    summary="Reset a user's password",
    description="Superadmin only. Resets the user's password to a default or specified new password and sets `force_password_change=True`.",
    responses={**UNAUTHENTICATED_401, 403: {"description": "Superadmin role required."}, 404: {"description": "User not found."}},
)
async def reset_user_password(
    user_id: uuid.UUID,
    data: AdminResetPasswordRequest | None = None,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_superadmin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_pass = data.new_password if data and data.new_password else f"{user.username}"
    user.hashed_password = await asyncio.to_thread(get_password_hash, new_pass)
    user.force_password_change = True

    db.add(user)
    await db.commit()

    return {"message": f"Successfully reset password for user '{user.username}'"}


def build_user_rows(rows: list[ImportRow]) -> list[dict]:
    users_to_insert = []
    for row in rows:
        hashed_password = get_password_hash(f"Praktis{row.npm}")
        users_to_insert.append({
            "username": row.npm,
            "email": row.email,
            "role": RoleEnum.PRAKTIKAN,
            "hashed_password": hashed_password,
            "force_password_change": True,
            "is_active": True
        })
    return users_to_insert


@router.post(
    "/import-csv",
    response_model=ImportCsvResponse,
    summary="Bulk-import students from a CSV or XLSX file",
    description=(
        "Superadmin-only. Accepts a `.csv` or `.xlsx` file with `npm` and `email` columns "
        "and creates a `praktikan` account for each valid row: username = NPM, default "
        "password = `Praktis{npm}`, with `force_password_change=True`. Rows with an NPM or "
        "email that already exists are skipped and counted; rows that fail validation are "
        "reported in `invalid_rows` (not an error)."
    ),
    responses={
        **UNAUTHENTICATED_401,
        **PASSWORD_CHANGE_REQUIRED_403,
        400: {"description": "Unsupported file type, file is empty/unparseable, or missing npm/email columns."},
        413: {"description": "File exceeds the size limit."},
        422: {"description": "File exceeds the maximum number of rows."},
    },
)
async def import_students_csv(
    file: UploadFile = File(..., description="CSV or XLSX file with `npm` and `email` header columns."),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_superadmin)):

    if not file.filename or not file.filename.lower().endswith((".csv", ".xlsx")):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a .csv or .xlsx file.")

    content = await file.read(settings.IMPORT_MAX_BYTES + 1)
    if len(content) > settings.IMPORT_MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds the {settings.IMPORT_MAX_BYTES // (1024 * 1024)}MB size limit.",
        )
    if not content:
        raise HTTPException(status_code=400, detail="File is empty.")

    try:
        parsed = await asyncio.to_thread(parse_import_file, file.filename, content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to parse the uploaded file.")

    if parsed.total_rows == 0:
        raise HTTPException(status_code=400, detail="File contains no data rows.")
    if parsed.total_rows > settings.IMPORT_MAX_ROWS:
        raise HTTPException(
            status_code=422,
            detail=f"File has {parsed.total_rows} rows; the maximum is {settings.IMPORT_MAX_ROWS}.",
        )

    skipped_username = 0
    skipped_email = 0
    rows_to_insert = parsed.rows
    if rows_to_insert:
        npms = [r.npm for r in rows_to_insert]
        emails = [r.email for r in rows_to_insert]
        result = await db.execute(
            select(User.username, User.email).where(
                or_(User.username.in_(npms), User.email.in_(emails))
            )
        )
        existing_usernames = set()
        existing_emails = set()
        for username, email in result.all():
            existing_usernames.add(username)
            existing_emails.add(email.lower())

        remaining = []
        for row in rows_to_insert:
            if row.npm in existing_usernames:
                skipped_username += 1
            elif row.email.lower() in existing_emails:
                skipped_email += 1
            else:
                remaining.append(row)
        rows_to_insert = remaining

    inserted_count = 0
    if rows_to_insert:
        users_to_insert = await asyncio.to_thread(build_user_rows, rows_to_insert)
        try:
            inserted_count = await bulk_create_users(db, users_to_insert)
        except IntegrityError:
            await db.rollback()
            raise HTTPException(
                status_code=409,
                detail="Import conflicted with concurrently created accounts; please retry.",
            )

    return {
        "message": "Import successful",
        "total_rows": parsed.total_rows,
        "inserted": inserted_count,
        "skipped_duplicate_username": skipped_username,
        "skipped_duplicate_email": skipped_email,
        "invalid_rows": parsed.invalid_rows,
    }