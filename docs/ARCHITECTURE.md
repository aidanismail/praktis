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
  |-- PostgreSQL:5432
  |-- Redis:6379
  |-- MinIO:9000
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
- Swagger: `http://localhost:8080/docs`
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

The MinIO location currently sets `client_max_body_size 30m`, supporting the 25 MiB module policy. The `/api/` location has no matching repository-defined body-size setting, so the effective student-import limit may differ from the backend's 5 MiB policy until Bagas aligns the proxy contract.

## Frontend architecture

Actual repository paths:

- routes: `frontend/app/`
- feature behavior: `frontend/features/`
- shared API plumbing: `frontend/lib/api/`
- shared query setup: `frontend/lib/react-query/`
- client UI state: `frontend/stores/`
- shared types/constants: `frontend/types/` and `frontend/constants/`

Route files should stay thin and compose feature components. TanStack Query owns remote server state where appropriate. Zustand stores genuine client/session-derived UI state and never stores tokens.

## Backend architecture

- FastAPI routers: `backend/api/routers/`
- authorization helpers: `backend/api/dependencies.py` and `backend/api/permissions.py`
- Pydantic schemas: `backend/schemas/`
- SQLAlchemy models: `backend/models/`
- services: `backend/services/`
- Alembic history: `backend/migrations/`
- tests: `backend/tests/`

Backend implementation is Bagas-owned. Frontend work may inspect these files but cannot change them without explicit authorization.

## Domain boundaries

### Current implementation

- Course contains globally unique code and name.
- Class sessions belong to a course.
- Enrollment and staff assignment scope Praktikan and Asprak access.
- Modules use a presign/confirm/list flow.
- Attendance and grades are stored per session/student.

### Confirmed target gaps

- Course must represent an academic-period offering.
- Module edit/replace/delete/visibility and safe storage lifecycle are missing.
- Session update/reschedule and safe deletion/archive are missing.
- Session-level grade publication is missing.

Do not design final frontend contracts for these gaps until `BAGAS_BACKEND_HANDOFF.md` is confirmed by Bagas.

## Authentication architecture

- FastAPI issues and invalidates an HttpOnly cookie.
- Browser fetch includes credentials through the shared API client.
- `/api/auth/me` resolves the current user.
- Only Praktikan with `force_password_change: true` is intended to be redirected.
- Frontend role UI is not authorization.

See `docs/AUTH_AND_RBAC.md` for the current backend mismatch and frontend stabilization status.

## Storage architecture

- Internal endpoint: `storage:9000`
- Public signing endpoint defaults to `http://localhost:8080`
- Bucket: `praktis-modules`
- Nginx proxies `/praktis-modules/` to MinIO
- Module maximum: 25 MiB
- Storage-location Nginx maximum: 30 MiB

The current application signs with MinIO root credentials. Production should use a least-privilege application identity. Presigned URLs must remain short-lived and must not be confused with exposing the secret key.

## Current limitations

- Production infrastructure is not provisioned.
- CI exists; CD is deferred.
- P0 backend contracts in `BAGAS_BACKEND_HANDOFF.md` are not implemented.
- Frontend feature screens remain mostly placeholders.
- Frontend automated tests are not configured.
- Backend tests have a known erroring baseline and a destructive truncation fixture for the selected test database.
