# Durable Project Decisions

Last updated: August 11, 2026

## Product and roles

- Canonical name: **Praktis — Praktikum Management System**.
- Active roles: `superadmin`, `asprak`, and `praktikan`.
- `Dosen Pengampu` is not an application role.
- The original “Asprak Management System” name is historical context only.

## Team ownership

- Aidan: product direction and frontend integration for Asprak and Praktikan
- Bagas: backend, API/data contracts, migrations, infrastructure behavior, backend tests, and Superadmin frontend integration
- The coding agent defaults to Aidan's scope and does not silently cross into Bagas's area.

## Academic-period courses

- A course is one academic-period practicum offering.
- Offerings of the same subject in different academic years are different records.
- Current backend source identifies academic year and semester and supports an active-state field; migration/backfill and focused tests remain readiness requirements.
- Section support remains a future decision if parallel offerings need to share the same subject and period.
- Historical offerings should be retained and distinguishable from current offerings.

## Asprak lifecycle ownership

For assigned courses, the intended product permits Asprak to:

- create, edit/reschedule, and safely delete or archive class sessions
- list, upload, download, edit, replace, delete, publish, and unpublish modules
- record attendance and grades
- publish, unpublish, correct, and republish grades per class session
- export supported records

These are product decisions, not claims that every backend contract already exists.

## Grade privacy

- Grades are draft until Asprak publishes the class session.
- Praktikan may see only their own grades from published sessions.
- Correcting published grades requires an explicit unpublish/correct/republish flow.
- Backend enforcement is required; frontend hiding alone is insufficient.

## Initial scale

- Approximately 20 courses
- More than 200 Praktikan users total
- Approximately 8-10 modules per course
- Course-scoped pagination is not mandatory everywhere at launch, but multi-year history must become bounded as it grows.

## Architecture

- Next.js frontend and FastAPI backend
- PostgreSQL, MinIO, and Redis
- Docker Compose local development and Nginx reverse proxy
- Same-origin browser requests under `/api/...`; no browser-facing backend base URL
- Backend-managed HttpOnly authentication cookie
- Praktikan-only first-login password-change product rule
- CI exists; production CD remains deferred until infrastructure and ownership are ready.

## Agent workflow

- `PLANS.MD` and owner approval are required before implementation.
- The owner may request direct edits or ready-to-type code; the plan must record which mode applies.
- Git write/history actions remain owner-managed.
- Backend and Superadmin changes require explicit authorization.
- Contract readiness and unresolved handoffs go to `docs/API_CONTRACT_STATUS.md` using `docs/FULL_STACK_WORKFLOW.md`.
- Validation reports testing, performance, security, accessibility, and known limitations without overstating results.

## Known current mismatches

- Academic-period fields exist in source, but migration/backfill safety and focused tests remain unresolved.
- Grade publication and published-only self-read exist in source, but transition, permission, and privacy tests remain incomplete.
- Module lifecycle operations exist in source, but storage-compensation and lifecycle-test evidence remain incomplete.
- Session update/open/close exist; safe delete/archive has no current contract.
- Backend forced-password enforcement is broader than the Praktikan-only product rule.
- CSRF protection for cookie-authenticated writes is unresolved before production.
- The historical database enum includes `dosen`; active application code and product scope do not.
- Frontend auth/dependency stabilization remains follow-up work.
