# Durable Project Decisions

## Product name

Canonical name: **Praktis — Praktikum Management System**.

The original PRD title “Asprak Management System” is retained only as historical context.

## Active roles

- Superadmin
- Asprak
- Praktikan

Dosen Pengampu is not a role.

## Team ownership

- Aidan: product and frontend; Asprak and Praktikan flows
- Bagas: backend and Superadmin flows

The coding agent defaults to Aidan's scope and avoids backend changes.

## Architecture

- Separated Next.js frontend and FastAPI backend
- PostgreSQL database
- MinIO object storage
- Redis service
- Docker Compose local development
- Nginx reverse proxy
- GitHub Actions CI
- CD deferred until a production server is provisioned

## Browser API routing

Frontend uses same-origin `/api/...` routes through Nginx. No browser-facing backend base URL environment variable is used.

## Authentication

- JWT/session token is stored in a backend-managed HttpOnly cookie.
- Frontend stores only the returned user data needed for UI state.
- Praktikan-only first-login password change rule.

## Agent workflow

- `PLANS.MD` is mandatory before implementation.
- Owner approval is mandatory after planning and before implementation.
- Agent may inspect Git but may not perform Git write/history actions.
- Backend and Superadmin edits require explicit owner authorization.
- Validation must include testing, performance review, and security review.

## Development URL

Nginx is exposed on `http://localhost:8080`.

## Testing baseline

- Frontend typecheck, lint, and build pass.
- Frontend automated tests are not configured.
- Backend Pytest currently has an erroring baseline.
