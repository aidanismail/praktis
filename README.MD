# Praktis

Praktis is a practicum-management system for Informatics practicum operations at Universitas Padjadjaran.

## Product roles and ownership

The only active application roles are:

- `superadmin`
- `asprak`
- `praktikan`

`Dosen Pengampu` is not an application role.

| Area | Owner |
|---|---|
| Product direction | Aidan |
| Asprak frontend integration | Aidan |
| Praktikan frontend integration | Aidan |
| Backend, API/data contracts, migrations, and backend tests | Bagas |
| Superadmin frontend integration | Bagas |

Shared frontend infrastructure must name its affected role consumers. Ownership of a shared component does not authorize unrelated role work.

## Start here

Humans and coding agents should read documents in this order:

1. [AGENTS.md](AGENTS.md) for mandatory scope, safety, planning, and validation rules.
2. [docs/DECISIONS.md](docs/DECISIONS.md) for durable product and ownership decisions.
3. [docs/FULL_STACK_WORKFLOW.md](docs/FULL_STACK_WORKFLOW.md) for the frontend/backend integration process.
4. [docs/API_CONTRACT_STATUS.md](docs/API_CONTRACT_STATUS.md) for Current, Partial, Proposed, and Blocked contracts.
5. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/AUTH_AND_RBAC.md](docs/AUTH_AND_RBAC.md) for runtime and auth behavior.
6. [docs/TESTING_AND_QUALITY.md](docs/TESTING_AND_QUALITY.md) before validation.

Product requirements describe Target behavior; they do not prove an API exists. Current contract evidence comes from backend routes, schemas, permissions, migrations, tests, and runtime OpenAPI.

## Architecture

```text
Browser -> http://localhost:8080 -> Nginx
  /                  -> Next.js frontend:3000
  /api/*             -> FastAPI backend:8000/*
  /docs              -> FastAPI Swagger
  /praktis-modules/* -> MinIO:9000

FastAPI -> PostgreSQL + Redis + MinIO
```

Browser API calls remain same-origin under `/api/`. Nginx removes that prefix before forwarding. Authentication uses a backend-managed HttpOnly cookie; frontend requests preserve `credentials: include`.

## Development

The standard local entry point is Docker Compose from the repository root:

```powershell
docker compose config
docker compose up -d --build
docker compose ps
```

Open <http://localhost:8080>. Normal frontend/backend source edits use bind-mounted hot reload. Rebuild only after image, dependency, lockfile, requirements, or build-configuration changes.

Useful diagnostics:

```powershell
docker compose logs frontend --tail=100
docker compose logs backend --tail=100
docker compose logs nginx --tail=100
```

Read [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) before migrations, tests, seed scripts, rebuilds, or shutdown commands.

## Safe contribution workflow

Every code, configuration, dependency, or documentation change follows:

1. Inspect current instructions, docs, diff, source, tests, and contracts.
2. Replace root `PLANS.MD` with the exact proposed scope.
3. Present the plan and wait for Aidan's approval.
4. Implement only the approved files and collaboration mode.
5. Validate narrowly, then run required quality gates.
6. Review the final diff for scope, correctness, performance, security, accessibility, and documentation drift.
7. Let Aidan perform Git write/history operations.

## Immediate product priority

The current Aidan-owned priority is the Asprak experience. Recommended delivery order:

1. assigned academic-period course list
2. course-detail shell, roster, and session context
3. module list/upload, followed by reviewed lifecycle actions
4. attendance workflow
5. draft grade entry and reviewed publication flow
6. reports/export

Do not integrate against a Partial, Proposed, or Blocked contract without resolving the recorded gap and approving a new plan.

## Current limitations

- Frontend feature views remain mostly placeholders.
- Frontend auth types and request lifecycle need stabilization.
- Recent backend lifecycle work is only partially validated and lacks focused tests.
- Recent non-null migrations require populated-database upgrade review.
- Safe session delete/archive is not implemented.
- OpenAPI-to-TypeScript generation and contract-drift CI are proposed, not implemented.
- Production deployment, TLS, backups, monitoring, CSRF design, and least-privilege storage credentials remain unresolved.

See [docs/API_CONTRACT_STATUS.md](docs/API_CONTRACT_STATUS.md) for the maintained status.
