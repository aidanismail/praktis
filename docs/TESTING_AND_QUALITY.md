# Testing and Quality Gates

## Recorded baseline

The following baseline was observed before the current documentation alignment. It is dated historical evidence, not a permanent guarantee.

| Area | Command | Recorded status |
|---|---|---|
| Frontend type safety | `pnpm typecheck` | PASS on August 1, 2026 |
| Frontend lint | `pnpm lint` | PASS on August 1, 2026 |
| Frontend production build | `pnpm build` | PASS on August 1, 2026 |
| Frontend automated tests | `pnpm test` | NOT AVAILABLE; script missing |
| Backend tests | `pytest` | 42 tests collected; baseline ended in errors |
| Database migrations | `alembic upgrade head` | PASS in supplied local baseline |
| Compose validation | `docker compose config` | PASS in supplied local baseline |
| Docker image build | `docker compose build` | Supplied screenshot did not establish completion |

Compare future results with exact commands and dates. Do not rewrite the baseline or call it current without rerunning it.

## Mandatory frontend checks

For meaningful frontend changes, run from `frontend/`:

```powershell
pnpm typecheck
pnpm lint
pnpm build
```

Dependency work also runs the approved production audit and affected Docker build.

## Frontend automated testing

No frontend test framework or test script is configured. Adding one requires an approved plan covering framework, dependencies, scripts, CI, and focused tests. Until then, report automated tests as NOT AVAILABLE.

Priority future coverage includes:

- auth guard 401 versus transient failure
- first-password redirects
- logout failure/retry
- course role scoping
- module lifecycle state
- attendance bulk interaction/save
- grade publish/unpublish privacy

## Backend test safety and baseline

Backend tests are Bagas-owned. `backend/tests/conftest.py` creates/migrates the selected test database and executes `TRUNCATE ... CASCADE` on its tables.

Before running any backend test:

- explicitly verify `TEST_DATABASE_URL`
- verify the database name is disposable and test-only
- never use development, staging, production, or user data
- obtain owner direction if the target is ambiguous

The current source defines 42 tests. Do not run them for frontend-only or documentation-only changes. When an authorized run fails, record the exact failure and compare it with the dated baseline.

## Backend evidence gaps

Current source has backend tests for several foundational operations, but focused evidence is still needed for:

- academic-period course uniqueness and serialization
- grade publish/unpublish/republish and Praktikan privacy
- incomplete roster and invalid release transitions
- module content validation, intent ownership, visibility, replacement, deletion, and cleanup
- class-session update and safe delete/archive behavior
- Praktikan-only forced-password invariant
- import behavior at the effective proxy/backend size boundary

Track readiness per operation in `docs/API_CONTRACT_STATUS.md`; do not describe a whole domain as tested because one route has coverage. These tests are Bagas-owned unless Aidan explicitly reassigns backend work.

## Manual frontend scenarios

Every feature plan should cover success, empty, loading, validation error, unauthorized/expired session, forbidden role, network/server failure, retry, keyboard behavior, and representative responsive widths.

Lifecycle features additionally cover destructive confirmation, partial failure, stale data, publication/visibility transitions, and retry safety.

## Performance review

Inspect duplicate requests, client-component boundaries, unnecessary global state, expensive tables, list bounds, full-page navigation, dependency size, upload behavior, cache invalidation, and multi-year data growth.

At the confirmed initial scale, not every course-scoped list requires pagination. Personal history and retained cross-year collections still need a bounded plan before they grow substantially.

## Security review

Inspect authorization assumptions, cookie behavior, unpublished/private data, sensitive UI/log/network data, input/file validation, unsafe HTML, open redirects, upload cleanup, and direct service exposure.

## Docker checks

Run only when Docker, Nginx, dependencies, environment, or service wiring changes:

```powershell
docker compose config
docker compose build <affected-services>
docker compose up -d
docker compose ps
```

Smoke through `http://localhost:8080` and inspect targeted logs.

## Completion reporting

Label every check PASS, FAIL, SKIPPED, or NOT AVAILABLE with the command and reason. Never collapse failed, skipped, or unavailable checks into “tested.”
