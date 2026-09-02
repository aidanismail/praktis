# Architecture

## System shape

Praktis uses a separated frontend/backend architecture in one Docker Compose development environment.

```text
Browser
  |
  | http://localhost:8080
  v
Nginx
  |-- / ----------------------> Next.js frontend:3000
  |-- /api/* -----------------> FastAPI backend:8000/*
  |-- /docs ------------------> FastAPI Swagger
  |-- /praktis-modules/* -----> MinIO:9000

FastAPI
  |-- PostgreSQL:5432 (Async Engine + Connection Pool)
  |-- Redis:6379 (aioredis async cache)
  |-- MinIO:9000 (boto3 storage with thread offloading)
```

## Docker services

- `db`: PostgreSQL 16
- `storage`: MinIO object storage
- `cache`: Redis 7
- `migrate`: one-shot Alembic upgrade service
- `backend`: FastAPI application
- `frontend`: Next.js application
- `nginx`: browser-facing reverse proxy on host port `8080`

The backend waits for database health, Redis health, MinIO startup, and successful migration completion.

## Local host exposure

- Application and API entry point: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/docs` (or `/api/docs`)
- Redoc UI: `http://localhost:8080/api/redoc`
- PostgreSQL is host-published on port `5432`.
- MinIO API and console are host-published on ports `9000` and `9001`.

These direct ports exist in the current local Compose configuration. They must not be described as internal-only. Production exposure, binding, firewalling, TLS, and least-privilege credentials remain deployment decisions.

Direct browser calls to backend container port `8000` are not part of the standard workflow.

## Nginx API-prefix behavior

```nginx
location /api/ {
    proxy_pass http://backend:8000/;
}
```

A browser request to `/api/auth/me` is forwarded as `/auth/me`. Frontend constants retain `/api/`; Nginx owns prefix removal.

The MinIO location sets `client_max_body_size 30m` for direct-to-storage module uploads (25 MiB policy). The `/api/` location sets `client_max_body_size 11m` for backend-proxied requests including the 10 MiB assignment upload policy, with headroom for multipart framing.

## Frontend architecture

Actual repository paths:

- routes: `frontend/app/`
- feature behavior: `frontend/features/`
  - `admin/`: Superadmin and academic administration views (Google Classroom architecture, card grid / table switcher, and 4-tab course workspaces)
  - `courses/`: Course listing, detail, and syllabus management
  - `modules/`: Learning module library and PDF preview
  - `auth/`: Login, password change, and session validation
- shared API plumbing: `frontend/lib/api/`
- shared query setup: `frontend/lib/react-query/`
- client UI state: `frontend/stores/`
- shared types/constants: `frontend/types/` and `frontend/constants/`

### UI Design Architecture
- **Information Hierarchy**: Google Classroom inspired academic operations.
- **Dual Presentation**: Smooth switch between visual **Classroom Card Grid** (with semester banners and quick access) and **High-Density Data Table**.
- **Course Workspace (4-Tab Modal/Drawer)**:
  1. **Stream**: Course metadata, academic period, and recent activity.
  2. **Classwork**: Learning modules and assignment submissions with PDF download links and publish toggles.
  3. **People**: Teaching Assistants (Asprak) and Enrolled Students (Praktikan) rosters with avatar initials.
  4. **Sessions & Attendance**: Class session meeting log with quiet live status indicators.

## Backend architecture

- FastAPI routers: `backend/api/routers/`
  - `users.py`: Authentication, sessions, password reset, and student batch import
  - `courses.py`: Course management, enrollment, and staff assignment
  - `class_sessions.py`: Meeting sessions and attendance windows
  - `modules.py`: Practicum learning materials uploaded to MinIO
  - `announcements.py`: Course stream broadcasts and discussion comments
  - `assignments.py`: Classwork tasks, student solution file uploads to MinIO, and grading
  - `attendance.py`: Per-session student attendance logging
  - `grades.py`: Session score entry and publication
  - `export.py`: CSV/XLSX reporting
- authorization helpers: `backend/api/dependencies.py` and `backend/api/permissions.py`
- Pydantic v2 schemas: `backend/schemas/`
- SQLAlchemy 2.0 Async models: `backend/models/`
- services: `backend/services/`
- Alembic history: `backend/migrations/`
- tests: `backend/tests/`

### Concurrency & Async Architecture
- **Database Connection Pool**: `create_async_engine` configured with `pool_size=20`, `max_overflow=10`, `pool_timeout=30`, and `pool_pre_ping=True` for resilient connection handling.
- **CPU & Blocking I/O Offloading**: Heavy operations (`bcrypt` password hashing, `openpyxl` spreadsheet generation, `parse_import_file`, and `boto3` MinIO operations) are executed in worker threads via `asyncio.to_thread(...)`, keeping the main event loop non-blocking and responsive.

## Domain boundaries

### Implemented Capabilities
- **Courses**: Period-scoped courses (`academic_year`, `semester`, `is_active`) with uniqueness on `(code, academic_year, semester)`.
- **Roster & Staffing**: Course enrollment (`Enrollment`) and teaching assistant assignment (`CourseStaff`).
- **Class Sessions**: Scheduled practicum meetings with `open`/`closed` attendance status.
- **Modules**: Learning materials with presigned uploads to MinIO, publish/unpublish toggles, and direct downloads.
- **Course Stream & Announcements**: Broadcasts with pin-to-top capability and threaded Q&A comments.
- **Assignments & Submissions**: Classwork tasks with due dates, multipart file uploads to MinIO, late submission tracking, and numeric scoring with feedback.
- **Attendance**: Per-session presence logging (*hadir/sakit/izin/alfa*).
- **Grades**: Numeric score recording and publication controls.
- **Exports**: Filtered data exports in `.csv` and `.xlsx` formats.

## Authentication architecture

- FastAPI issues and invalidates an HttpOnly cookie (`access_token`).
- Browser fetch includes credentials through the shared API client.
- `/api/auth/me` resolves the current authenticated user and role.
- Role checks in UI are for presentation; backend enforcement in `permissions.py` provides security authorization.

## Storage architecture

- Internal endpoint: `storage:9000`
- Public signing endpoint defaults to `http://localhost:8080`
- Bucket: `praktis-modules`
- Object layout:
  - Modules: `modules/{uuid}.pdf`
  - Assignments: `assignments/{assignment_id}/{student_id}/{uuid}_{filename}`
- Module maximum: 25 MiB; Assignment submission maximum: 10 MiB
- Nginx proxies `/praktis-modules/` to MinIO
