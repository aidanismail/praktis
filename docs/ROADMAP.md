# Product Roadmap

## Completed foundation

- Docker Compose development environment
- Nginx same-origin routing
- PostgreSQL, MinIO, and Redis services
- Alembic migration service
- cookie-based authentication integration
- login, logout, current-user resolution, and first-login password change
- role-aware dashboard shell and placeholder navigation
- GitHub Actions CI foundation

## Current ownership split

### Aidan / frontend agent

- Asprak workflows
- Praktikan workflows
- frontend integration with confirmed backend contracts
- UX, accessibility, loading/error behavior, performance, and frontend security review

### Bagas

- Backend implementation and contracts
- Superadmin workflows
- database and migrations
- auth/authorization enforcement
- import/export processing
- MinIO and Redis backend behavior

## Suggested Asprak sequence

1. Assigned practicum class list
2. Class detail shell
3. Module list and upload integration
4. Attendance session and roster UI
5. Attendance save/error handling
6. Grade entry and release-status UI
7. Reports/export integration

Each item requires a fresh owner-approved `PLANS.MD`.

## Suggested Praktikan sequence

1. Enrolled practicum class list
2. Class detail and module list
3. Module view/download behavior
4. Personal attendance history
5. Released grades
6. Profile/account information

Each item requires a fresh owner-approved `PLANS.MD`.

## Superadmin

Handled by Bagas. The frontend agent must not implement this roadmap area without explicit reassignment.

## Quality work

- introduce frontend automated testing after owner approval of framework and dependencies
- resolve or document backend Pytest baseline errors with Bagas
- strengthen CI environment-name consistency
- add targeted accessibility checks
- add performance budgets once representative screens and data sizes exist

## Deployment

Production server setup and CD remain deferred until the university server, domain, HTTPS, secrets, backup, and operational ownership are ready.

## Future possibilities, not current scope

- richer LMS features
- quizzes, midterms, and final exams
- secure examination tooling
- mobile client consuming the FastAPI contract
