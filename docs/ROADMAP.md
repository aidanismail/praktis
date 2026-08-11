# Product Roadmap

Last updated: August 2, 2026

Roadmap labels distinguish implemented foundations from product requirements and blocked contracts. A listed feature is not complete merely because a placeholder screen or partial endpoint exists.

## Implemented foundation

- Docker Compose development environment
- Nginx same-origin `/api/` routing
- PostgreSQL, MinIO, and Redis services
- Alembic migration service
- backend-managed cookie login/logout/current-user/password-change endpoints
- frontend login, password-change, route-guard, and role-dashboard foundation
- role-aware dashboard shell with placeholder feature navigation
- backend course assignment/enrollment, module presign/confirm/list, attendance, grade entry, and export foundations
- GitHub Actions CI foundation

## Stabilization before feature expansion

### Aidan/frontend

- resolve production dependency advisories
- correct auth response types
- remove avoidable duplicate `/auth/me` requests
- distinguish unauthorized responses from transient failures
- make logout failure and pending behavior accurate
- preserve accessibility and responsive behavior

### Bagas/backend handoff

P0 contracts required for complete product behavior are detailed in `BAGAS_BACKEND_HANDOFF.md`:

- academic-period course identity
- per-session grade publish/unpublish and Praktikan privacy
- complete module edit/replace/delete/visibility lifecycle
- class-session update/reschedule and safe deletion/archive

Pre-pilot security items include unpredictable temporary passwords, the Praktikan-only forced-password invariant, and the effective import proxy limit.

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

Static design work may begin earlier, but final integration must not invent P0 contracts.

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
