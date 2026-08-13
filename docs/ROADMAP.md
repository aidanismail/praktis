# Product Roadmap

Last updated: August 11, 2026

Roadmap labels distinguish implemented foundations from product requirements and blocked contracts. A listed feature is not complete merely because a placeholder screen or partial endpoint exists.

## Implemented foundation

- Docker Compose development environment
- Nginx same-origin `/api/` routing
- PostgreSQL, MinIO, and Redis services
- Alembic migration service
- backend-managed cookie login/logout/current-user/password-change endpoints
- frontend login, password-change, route-guard, and role-dashboard foundation
- role-aware dashboard shell with placeholder feature navigation
- backend academic-period courses, assignment/enrollment, class-session operations, module lifecycle operations, attendance, grade entry/publication, published-only personal grades, and export foundations
- GitHub Actions CI foundation

## Stabilization before feature expansion

### Aidan/frontend

- resolve production dependency advisories
- correct auth response types
- remove avoidable duplicate `/auth/me` requests
- distinguish unauthorized responses from transient failures
- make logout failure and pending behavior accurate
- preserve accessibility and responsive behavior

### Bagas/backend readiness

`docs/API_CONTRACT_STATUS.md` records operation-level evidence. Current source implements more than the original foundation, but the next integrations still depend on:

- safe academic-period migration/backfill behavior and focused tests
- publication transition, permission, and privacy tests
- module storage-compensation behavior and lifecycle tests
- a safe session delete/archive contract
- consistent auth response and forced-password invariants

Pre-pilot security items include unpredictable temporary passwords and the effective import proxy limit. CSRF for cookie-authenticated writes is Blocked before production.

## Asprak delivery sequence

Each implementation slice requires a current owner-approved `PLANS.MD` and a confirmed backend contract.

1. Assigned academic-period course list
2. Course detail shell and roster context
3. Module list/upload
4. Module edit, replace, visibility, and delete
5. Class-session create/list/edit/reschedule/delete-or-archive
6. Attendance roster, local interaction, explicit save, and failure recovery
7. Grade entry and draft review
8. Grade publish/unpublish/correct/republish
9. Reports and export integration

Static design work may begin earlier, but final integration must not build against Partial, Proposed, or Blocked operations.

## Praktikan delivery sequence

1. Enrolled academic-period course list
2. Course detail and visible module list
3. Module view/download
4. Personal attendance history
5. Published grades only
6. Profile/account information

## Superadmin

Bagas owns Superadmin, course/enrollment/staff administration, import behavior, and related frontend work unless Aidan explicitly reassigns a task.

## Quality work

- introduce an approved frontend automated-test framework
- resolve or document the backend Pytest baseline with Bagas
- add contract tests for publication, module lifecycle, session safety, and authorization
- remove CI environment-name inconsistencies
- add targeted accessibility checks
- add performance budgets and bounded history contracts as representative data grows
- validate production dependency security without audit suppression

## Deployment

Production setup and CD remain deferred until the university server, domain, HTTPS, secret management, least-privilege storage credentials, backups, monitoring, and operational ownership are ready.

## Future possibilities, not current scope

- richer LMS features
- quizzes, midterms, and final exams
- secure examination tooling
- mobile client consuming the confirmed FastAPI contract
