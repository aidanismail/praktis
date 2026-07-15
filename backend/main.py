from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.cache import init_redis, close_redis
from core.database import get_db
from contextlib import asynccontextmanager

from api.routers import users
from api.routers import modules
from api.routers import attendance
from api.routers import courses
from api.routers import grades
from api.routers import export


API_DESCRIPTION = """
Backend API for **Praktis** (Asprak Management System) — a centralized system for
managing university lab-practicum (praktikum) administration: student accounts,
course modules, attendance, and grading.

### Authentication
Auth is cookie-based, not bearer-token: `POST /auth/login` sets an HttpOnly
`access_token` cookie which the browser sends automatically on subsequent requests.
There is no `Authorization` header to set manually when testing here in Swagger —
just call `/auth/login` first and the cookie will be reused for the rest of the session.

### Roles
- **superadmin** — manages accounts, courses, and enrollment.
- **asprak** — takes attendance, uploads modules, and enters grades for their courses.
- **praktikan** — students; view their own courses, modules, and attendance.

### First login
Freshly imported student accounts have `force_password_change=True` and are blocked
from every endpoint except `/auth/me`, `/auth/login`, `/auth/logout`, and
`/auth/change-password` until they change their password.
"""

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_redis()
    yield
    await close_redis()

app = FastAPI(
    lifespan=lifespan,
    title="Praktis API",
    description=API_DESCRIPTION,
    version="1.0.0",
    root_path="/api",
    contact={"name": "Aidan Ismail, Bagas Diatama (Praktis maintainers)"},
    openapi_tags=[
        {
            "name": "Authentication",
            "description": "Login/logout, password changes, and superadmin student bulk-import.",
        },
        {
            "name": "Courses",
            "description": "Course, enrollment, and class-session management.",
        },
        {
            "name": "Modules",
            "description": "Uploading and listing practicum learning materials (PDF/DOCX), stored in MinIO.",
        },
        {
            "name": "Attendance",
            "description": "Recording and viewing per-session attendance (hadir/sakit/izin/alfa).",
        },
        {
            "name": "Grades",
            "description": "Recording and viewing per-session student scores.",
        },
        {
            "name": "Export",
            "description": "Downloading attendance/grade data as CSV or XLSX.",
        },
        {
            "name": "Health",
            "description": "Service liveness/readiness check.",
        },
    ],
)

origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(modules.router)
app.include_router(attendance.router)
app.include_router(courses.router)
app.include_router(grades.router)
app.include_router(export.router)

@app.get(
    "/health",
    tags=["Health"],
    summary="Health check",
    description="Reports service status and whether the database connection is currently working. Unauthenticated.",
)
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        db_connected = True
    except Exception:
        db_connected = False
    return {"status": "ok" if db_connected else "degraded", "db_connected": db_connected}