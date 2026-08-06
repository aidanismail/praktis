# Architecture

## System shape

Praktis uses a separated frontend/backend architecture inside one Docker Compose development environment.

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

## Browser-facing URLs

- Application: `http://localhost:8080`
- Swagger: `http://localhost:8080/docs`
- API: `http://localhost:8080/api/...`
- MinIO console: `http://localhost:9001`
- PostgreSQL host access: `localhost:5432`

Direct browser calls to backend container port 8000 are not part of the standard workflow.

## Nginx API-prefix behavior

The Nginx configuration uses:

```nginx
location /api/ {
    proxy_pass http://backend:8000/;
}
```

Therefore a browser request to `/api/auth/me` is forwarded to FastAPI as `/auth/me`. Frontend endpoint constants must retain the browser-facing `/api/` prefix.

## Frontend architecture

Known conventions:

- App Router routes under `src/app/`
- feature-oriented logic under `src/features/`
- shared API client under `src/lib/api/`
- authenticated user UI state in Zustand
- remote server state in TanStack Query where appropriate
- forms with React Hook Form and Zod

Route files should compose feature components rather than contain feature implementations.

## Authentication architecture

- FastAPI issues and invalidates an HttpOnly cookie.
- Browser fetch requests include credentials.
- The frontend calls `/api/auth/me` to resolve the current user.
- Zustand stores the user/session-derived UI state, not the token.
- Only Praktikan users with `force_password_change: true` are redirected to change-password.

See `docs/AUTH_AND_RBAC.md`.

## Storage architecture

- Backend internal endpoint: `storage:9000`
- Browser/public endpoint defaults to `http://localhost:8080`
- Bucket name: `praktis-modules`
- Nginx proxies `/praktis-modules/` to MinIO
- Current configured module upload maximum: 25 MiB
- Nginx request-body maximum for the storage location: 30 MiB

Do not expose MinIO credentials in frontend code.

## Environment model

The backend settings require:

- PostgreSQL credentials and database URL
- JWT secret and algorithm
- CORS origins
- environment name
- password policy
- import/upload limits
- Redis URL
- MinIO credentials and endpoints

Environment files are local secrets and must remain uncommitted. Public frontend environment variables must not contain credentials or server secrets.

## Current limitations

- The complete repository tree was not supplied, so agents must inspect relevant directories before planning changes.
- Production server infrastructure is not provisioned yet.
- CI exists; deployment automation is deferred.
