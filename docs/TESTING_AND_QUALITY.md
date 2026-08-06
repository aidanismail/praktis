# Testing and Quality Gates

## Current observed baseline

| Area | Command | Observed status |
|---|---|---|
| Frontend type safety | `pnpm typecheck` | Pass |
| Frontend lint | `pnpm lint` | Pass |
| Frontend production build | `pnpm build` | Pass |
| Frontend automated tests | `pnpm test` | Not configured; command missing |
| Backend tests | `pytest` | 42 tests collected; baseline run ends in errors |
| Database migrations | `alembic upgrade head` | Pass in supplied local run |
| Compose validation | `docker compose config` | Pass in supplied local run |
| Docker image build | `docker compose build` | Must be rerun to completion when required; supplied screenshot does not establish final status |

Do not hide or rewrite this baseline. Compare post-change results against it.

## Mandatory frontend checks

For meaningful frontend implementation changes:

```powershell
pnpm typecheck
pnpm lint
pnpm build
```

Run them from `frontend/`.

## Automated frontend tests

There is no frontend test script or test framework in the supplied package configuration.

When a feature needs automated tests:

1. include the proposed framework, files, scripts, and dependencies in `PLANS.MD`
2. wait for owner approval
3. add focused tests rather than broad snapshot coverage
4. document how the tests run in CI

Until then, do not claim automated frontend tests passed.

## Backend tests

Backend Pytest is owned by Bagas. The agent may run targeted tests for integration investigation, but it must not modify backend tests or implementation without explicit authorization.

Because the current baseline errors during setup/execution, record:

- exact failing fixture/setup line
- whether the error predates the change
- whether frontend behavior can be validated independently

## Manual scenario validation

Every frontend feature plan should list role-specific manual scenarios, including:

- success path
- empty state
- loading state
- API validation error
- unauthorized/expired session
- forbidden role
- network/server failure
- keyboard navigation
- responsive layout

## Performance review

After implementation, inspect:

- duplicate requests
- excessive client components
- unnecessary global state
- expensive rendering of large tables
- missing pagination for potentially large collections
- avoidable full-page navigation or reloads
- large dependencies added for small functionality
- upload progress and file-size enforcement

Use browser profiling or network inspection when the task justifies it. Report what was actually checked.

## Security review

After implementation, inspect:

- role and authorization assumptions
- cookie credentials behavior
- sensitive data in UI, console, errors, and network payloads
- input and file validation
- unsafe HTML rendering
- open redirects or route-guard bypass
- accidental direct backend/MinIO credential exposure

## Docker checks

Run when Docker, Nginx, environment, dependencies, or service wiring changes:

```powershell
docker compose config
docker compose build <affected-services>
docker compose up -d
docker compose ps
```

Use browser smoke checks through `http://localhost:8080` and inspect targeted logs.

## Completion report

The agent's final report must label each check:

- PASS
- FAIL
- SKIPPED, with reason
- NOT AVAILABLE, with reason

Never collapse failed or skipped checks into a generic “tested.”
