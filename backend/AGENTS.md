# Backend Boundary Instructions

These instructions extend the repository-root `AGENTS.md` for work inside `backend/`.

## Default mode: inspect only

Backend code is owned by Bagas. Unless the owner explicitly authorizes backend edits in the current task:

- inspect backend routes, schemas, models, services, tests, and migrations only to understand contracts
- do not edit Python files
- do not create or change Alembic migrations
- do not change API request or response models
- do not change authentication, cookies, roles, permissions, CORS, Redis, MinIO, or database behavior
- do not change backend dependencies
- do not alter backend tests to accommodate frontend behavior

When frontend work exposes a backend problem, report:

1. affected endpoint or contract
2. observed behavior
3. expected behavior
4. frontend impact
5. suggested backend change, clearly marked as a proposal

Do not implement the proposal without explicit authorization.

## Explicitly authorized backend work

When the owner explicitly authorizes backend work:

- update `PLANS.MD` before editing
- preserve FastAPI, Pydantic, SQLAlchemy, and Alembic patterns already in the repository
- add or update focused tests
- run targeted Pytest first
- run `python -m compileall .`
- run migrations only when approved and non-destructive
- never hide the existing test baseline of collected tests ending in errors
- do not perform database downgrade, reset, or volume deletion
