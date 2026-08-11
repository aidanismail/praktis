# Local Development

## Prerequisites

- Docker Desktop with Docker Compose
- Git for read-only agent inspection and owner-managed source control
- Node.js and pnpm only for frontend checks outside Docker
- Python virtual environment only for explicitly authorized backend checks outside Docker
- A valid uncommitted repository-root `.env`

Never paste or print secret environment values into agent output.

## Standard Docker workflow

From the repository root:

```powershell
docker compose config
docker compose up -d --build
docker compose ps
```

Open:

- application/API entry point: `http://localhost:8080`
- Swagger: `http://localhost:8080/docs`
- MinIO console: `http://localhost:9001`

The automatically loaded development override selects `dev` build targets and bind-mounts frontend/backend source.

## Hot reload and rebuilds

- `./frontend` is mounted at `/app` in the frontend container.
- `./backend` is mounted at `/app` in backend and migration containers.
- Frontend node_modules, Next cache, and pnpm store use named volumes.
- Normal source edits should hot reload.

Rebuild after Dockerfile, dependency, lockfile, requirements, or Compose build changes:

```powershell
docker compose up -d --build frontend
docker compose up -d --build backend
```

## Logs

```powershell
docker compose logs frontend --tail=100
docker compose logs backend --tail=100
docker compose logs nginx --tail=100
docker compose logs -f frontend
```

Stopping `logs -f` with Ctrl+C does not stop containers.

## Migrations

The one-shot `migrate` service runs `alembic upgrade head` before backend startup.

Explicit non-destructive verification:

```powershell
docker compose run --rm migrate
```

Backend migrations are Bagas-owned. Do not run downgrade/reset/drop/truncate commands or delete volumes without explicit authorization.

## Frontend checks

From `frontend/`:

```powershell
pnpm typecheck
pnpm lint
pnpm build
```

There is no frontend `test` script in the current package configuration.

## Backend test safety

The test fixture creates/migrates the selected test database and runs `TRUNCATE ... CASCADE` before tests. Do not run `pytest` merely because it appears in a checklist.

Before any backend test run:

1. Confirm backend work or integration investigation is explicitly authorized.
2. Resolve `TEST_DATABASE_URL` without printing its password.
3. Confirm the database name is a disposable test database, normally `praktis_test`.
4. Confirm it is not development, staging, production, or user data.
5. Stop and ask Aidan if any target is ambiguous.

Only then, from `backend/`:

```powershell
python -m compileall .
pytest
```

The observed baseline recorded August 1, 2026 collected 42 tests and ended in errors. It is a historical comparison point, not proof of current success.

## Safe shutdown

Preserve database and storage volumes:

```powershell
docker compose down
```

Never run through the agent without explicit owner confirmation:

```powershell
docker compose down -v
docker volume prune
```

## Dependency changes

Dependency changes require an owner-approved `PLANS.MD`.

Frontend dependency changes update both `frontend/package.json` and `frontend/pnpm-lock.yaml`, then run the approved audit, checks, production build, and affected Docker build. Backend dependency changes remain outside the default agent scope.

## Collaboration mode

The owner may choose direct agent edits or ready-to-type code. In ready-to-type mode, the agent supplies ordered snippets/patches and reviews what the owner enters; it does not silently edit implementation files.
