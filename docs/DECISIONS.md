# Durable Project Decisions

Last updated: September 2, 2026

## Product and roles

- Canonical name: **Praktis — Praktikum Management System**.
- Active roles: `superadmin`, `asprak`, and `praktikan`.
- `Dosen Pengampu` is not an application role.
- The original “Asprak Management System” name is historical context only.

## Team ownership

- Aidan: product direction and frontend integration for Asprak and Praktikan
- Bagas: backend, API/data contracts, migrations, infrastructure behavior, backend tests, and Superadmin frontend integration
- The coding agent defaults to Aidan's scope and does not silently cross into Bagas's area unless explicitly authorized by the owner.

## Google Classroom information architecture

- The user experience follows the Google Classroom academic operation model.
- **Dual Course Presentation**: Users can toggle seamlessly between a visual **Classroom Card Grid** (with semester banners, quick stats, and direct links) and a **Compact Data Table**.
- **5-Tab Asprak/Praktikan Course Workspace**: Aidan-owned course detail views use five standard tabs:
  1. `Stream`: General course overview, academic period metadata, and broadcast announcements.
  2. `Modules`: Learning materials, downloads, and role-appropriate publication controls.
  3. `Assignments`: Assignment instructions, submissions, and role-appropriate management or personal results.
  4. `People`: Segmented rosters for Teaching Assistants (*Asprak*) and Enrolled Students (*Praktikan*).
  5. `Sessions & Attendance`: Meeting logs with attendance window status controls.
- This five-tab decision applies to Asprak and Praktikan. It does not silently modify Bagas-owned Superadmin course-management UI.

## Stream announcements and discussions

- Aspraks and Superadmins can broadcast course stream announcements with pin-to-top capability.
- Enrolled students and staff can participate in threaded Q&A comments below each announcement.
- Deletions are restricted to the author or Superadmin.

## Assignments and submissions

- Aspraks and Superadmins can create assignment tasks with title, instructions, due date, max rubric points, and allowed extensions.
- Praktikan submit solution files directly to MinIO (up to 10MB) with automatic late-status calculation.
- Aspraks and Superadmins can inspect student submissions and assign numeric grades with written feedback.

## Async Python patterns & performance

- **Database Connection Pool**: `create_async_engine` uses `pool_size=20`, `max_overflow=10`, `pool_timeout=30`, and `pool_pre_ping=True` to prevent connection leaks and recover cleanly from database restarts.
- **Worker Thread Offloading**: CPU-intensive bcrypt hashing (`verify_password`), spreadsheet file generation (`openpyxl`), and synchronous SDK calls are offloaded via `asyncio.to_thread(...)`, keeping the FastAPI event loop non-blocking.
- **Eager Loading**: Relational queries use `selectinload` to avoid `MissingGreenlet` exceptions in async SQLAlchemy.

## Academic-period courses

- A course is one academic-period practicum offering.
- Offerings of the same subject in different academic years are different records.
- Uniqueness is enforced on `(code, academic_year, semester)`.
- Historical offerings are retained and distinguishable from active offerings.

## Grade privacy

- Grades are draft until Asprak publishes the class session.
- Praktikan may see only their own grades from published sessions.
- Correcting published grades requires an explicit unpublish/correct/republish flow.
- Backend enforcement is required; frontend hiding alone is insufficient.

## Initial scale

- Approximately 20 courses
- More than 200 Praktikan users total
- Approximately 8-10 modules per course
- Course-scoped pagination is not mandatory everywhere at launch, but multi-year history must become bounded as it grows.

## Architecture

- Next.js frontend and FastAPI backend
- PostgreSQL, MinIO, and Redis
- Docker Compose local development and Nginx reverse proxy
- Same-origin browser requests under `/api/...`; no browser-facing backend base URL
- Backend-managed HttpOnly authentication cookie
- Praktikan-only first-login password-change product rule
- CI exists; production CD remains deferred until infrastructure and ownership are ready.

## Agent workflow

- `PLANS.MD` and owner approval are required before implementation.
- The owner may request direct edits or ready-to-type code; the plan must record which mode applies.
- Git write/history actions remain owner-managed.
- Backend and Superadmin changes require explicit authorization.
- Contract readiness and unresolved handoffs go to `docs/API_CONTRACT_STATUS.md` using `docs/FULL_STACK_WORKFLOW.md`.
- Validation reports testing, performance, security, accessibility, and known limitations without overstating results.
