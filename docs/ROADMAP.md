# Product Roadmap

Last updated: August 17, 2026

Roadmap labels distinguish implemented foundations from product requirements and blocked contracts. A listed feature is not complete merely because a placeholder screen or partial endpoint exists.

## Implemented foundation & delivered capabilities

- Docker Compose development environment
- Nginx same-origin `/api/` routing
- PostgreSQL, MinIO, and Redis services
- Alembic migration service with automated migrations
- Backend-managed cookie login/logout/current-user/password-change endpoints
- **Google Classroom Information Architecture**:
  - Dual course presentation (`Card Grid` & `Compact Table` toggle)
  - 4-Tab Course Workspace (`Stream`, `Classwork`, `People`, `Sessions & Attendance`)
- **Course Stream & Announcements**:
  - Pinned announcement broadcasts
  - Threaded Q&A discussion comments for students and staff
- **Classwork Assignments & Student Submissions**:
  - Assignment creation with instructions, due dates, max points, and allowed formats
  - Direct student file submission to MinIO with automatic late-status calculation
  - Asprak grading interface with numeric scores and written feedback
- **Async Python Performance Tuning**:
  - SQLAlchemy AsyncEngine connection pool (`pool_size=20`, `max_overflow=10`, `pool_pre_ping=True`)
  - Worker thread offloading via `asyncio.to_thread` for bcrypt hashing, openpyxl generation, and MinIO storage SDK
- **API Documentation & Specifications**:
  - Comprehensive OpenAPI 3.1+ tags, response models, error codes, and field descriptions
- GitHub Actions CI foundation

## Asprak delivery sequence

Each implementation slice requires a current owner-approved `PLANS.MD` and a confirmed backend contract.

1. ✅ Assigned academic-period course list (Classroom Grid & Table)
2. ✅ Course detail shell and roster context (4-Tab Workspace)
3. ✅ Stream announcements and discussion comments
4. ✅ Classwork assignments and student submission review
5. ✅ Module list/upload and publish toggles
6. ✅ Class-session create/list/edit and attendance window controls
7. ✅ Attendance roster, local interaction, explicit save, and quiet live indicator
8. ✅ Grade entry, draft review, and session publication
9. ✅ Reports and export integration (.CSV / .XLSX)

## Praktikan delivery sequence

1. ✅ Enrolled academic-period course list
2. ✅ Course detail and visible module list
3. ✅ Stream announcements and Q&A participation
4. ✅ Assignment file submissions with late status feedback
5. ✅ Module view/download
6. ✅ Personal attendance history
7. ✅ Published grades only
8. ✅ Profile/account information & password change

## Superadmin

Bagas owns Superadmin, user directory, student CSV/XLSX bulk import, course/enrollment/staff administration, and global monitoring.

## Quality & validation

- Python codebase validation (`python3 -m compileall backend/`)
- TypeScript type checking (`corepack pnpm typecheck`)
- ESLint static analysis (`corepack pnpm lint`)
- Next.js production builds (`corepack pnpm build`)
- Pytest test suites covering authentication, attendance, modules, announcements, and assignments

## Deployment

Production setup and CD remain deferred until the university server, domain, HTTPS, secret management, least-privilege storage credentials, backups, monitoring, and operational ownership are ready.
