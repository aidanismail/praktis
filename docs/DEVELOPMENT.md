# Local Development

## Prerequisites

- Docker Desktop with Docker Compose
- Git for read-only inspection and owner-managed source control
- Node.js/pnpm only when running frontend checks outside Docker
- Python virtual environment only when running backend checks outside Docker
- A valid repository-root `.env`

## Standard Docker workflow

From the repository root:

```powershell
docker compose config
docker compose up -d --build
docker compose ps
```

Open:

- application: `http://localhost:8080`
- Swagger: `http://localhost:8080/docs`
- MinIO console: `http://localhost:9001`

The development override is automatically loaded and selects `dev` build targets for frontend, backend, and migration services.

## Hot reload

The development override bind-mounts:

- `./frontend` to `/app`
- `./backend` to `/app`

Frontend dependency and build caches use named volumes. Normal `.ts`, `.tsx`, `.css`, and `.py` edits should not require an image rebuild.

Rebuild a service after changes to its Dockerfile, package lockfile, requirements, or Compose build configuration:

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

Compose includes a one-shot `migrate` service that runs `alembic upgrade head` before the backend starts.

For explicit non-destructive verification:

```powershell
docker compose run --rm migrate
```

Do not run downgrade/reset commands or delete volumes without owner confirmation.

## Frontend checks

From `frontend/`:

```powershell
pnpm typecheck
pnpm lint
pnpm build
```

`pnpm test` is not available in the current package scripts.

## Backend checks

From `backend/` with the correct environment:

```powershell
python -m compileall .
pytest
alembic upgrade head
```

The supplied baseline Pytest run collected 42 tests and ended in errors. Treat this as a known baseline until the backend owner resolves or explains it.

## Safe shutdown

Preserve database and storage volumes:

```powershell
docker compose down
```

Never run the following through the agent without explicit owner confirmation:

```powershell
docker compose down -v
docker volume prune
```

## Dependency changes

The agent must propose dependency additions in `PLANS.MD` and wait for approval.

Frontend dependency changes require updating both `package.json` and the pnpm lockfile, followed by a frontend rebuild.

Backend dependency changes are outside the agent's default scope.
