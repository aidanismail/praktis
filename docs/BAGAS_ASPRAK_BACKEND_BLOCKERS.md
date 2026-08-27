# Bagas Handoff — Asprak Backend Blockers

Last audited: 2026-08-27  
Branch audited: `feature/asprak-features`

This is the consolidated backend/API/data/migration/infrastructure handoff blocking completion of the Asprak frontend workflow. It includes the original Batch 2 assignment blockers plus the severe blockers found across auth, modules, sessions, attendance, grades, exports, storage, migrations, and Nginx.

`docs/API_CONTRACT_STATUS.md` remains the authority for operation-level Current/Partial/Blocked status. This document is an implementation and acceptance checklist; update the ledger per exact operation as fixes become evidenced.

## Ownership and boundaries

- Bagas owns backend routes, schemas, models, migrations, storage/infrastructure behavior, backend tests, and Superadmin frontend.
- Aidan owns product decisions and Asprak/Praktikan frontend integration.
- Do not introduce a Dosen application role. Active roles remain `superadmin`, `asprak`, and `praktikan`.
- Frontend visibility is not authorization. Every rule below must be enforced by FastAPI/database/storage behavior.
- Preserve browser-facing same-origin `/api/...` paths and HttpOnly-cookie authentication.

## Runtime/source baseline

- Docker Compose currently runs six services; PostgreSQL and Redis report healthy.
- Live Nginx syntax is valid.
- Alembic reports `1a2b3c4d5e6f (head)`.
- Runtime OpenAPI 3.1 exposes the planned Asprak operations.
- Reaching head on the current database does not prove populated upgrade safety.
- Backend Pytest was not run during this audit because its fixture performs `TRUNCATE ... CASCADE` and the test database was not independently proven disposable.

## Priority 0 — Authorization, privacy, data-loss, and deployment blockers

### 1. Batch 2 assignment management, submissions, grading, and deletion

These are the original blockers that stopped Batch 2.

#### Cross-course submission disclosure and grading

Current:

- Submission listing authorizes the path `course_id`, then queries using only `assignment_id`.
- Grading authorizes the path course and matches the submission to the assignment, but never proves that assignment belongs to the authorized course.

Required:

- Load/prove the assignment using both `assignment_id` and authorized `course_id` before listing or grading.
- Bind `submission_id` to that proven assignment.
- Add course A/course B tests for assigned and unassigned Asprak.
- Avoid resource-existence leakage through inconsistent 403/404 behavior.

#### Unpublished assignment access

Current:

- Praktikan list filtering hides drafts.
- Detail and submission accept a known unpublished assignment UUID.

Required:

- Praktikan detail and submit must reject unpublished assignments even when the UUID is known.
- Tests must cover list, detail, and submit for draft/published states and enrolled/unenrolled users.

#### Grade bounds

Current:

- Assignment grading accepts any score greater than or equal to zero.
- It does not enforce `score <= assignment.max_points`.

Required:

- Enforce the assignment-specific maximum in the backend.
- Document the status/error body.
- Test negative, zero, exact maximum, decimal, and above-maximum scores.

#### Nullable update and inaccurate response

Current:

- PATCH cannot distinguish omitted fields from explicit `null`.
- Description and due date therefore cannot be cleared.
- Update responses hardcode `submissions_count: 0`.

Required:

- Use an unset-aware PATCH contract so optional fields can be cleared intentionally.
- Preserve omitted values.
- Return the real submission count.
- Add omitted-versus-null and count tests.

#### Assignment/session ownership

Current:

- Assignment create accepts optional `session_id` without proving that session belongs to the same course.

Required:

- Validate `session_id` against the assignment course.
- Add cross-course session ID tests.

#### Submission upload/resubmission safety

Current:

- The route reads the whole upload into memory.
- boto3 `put_object` runs synchronously in an async route.
- Filename length/safety and actual PDF/DOCX/ZIP content are not validated.
- On resubmit, the old object is deleted before database commit. A commit failure can leave the database referencing a deleted object while the new object becomes orphaned.

Required:

- Bound reads and validate filename, size, extension, and actual content before irreversible work.
- Offload synchronous storage calls.
- Define recoverable resubmission ordering/compensation.
- Never swallow storage errors without reconciliation.
- Add storage and database fault-injection tests.

#### Assignment deletion/storage cleanup

Current:

- Database rows cascade-delete.
- Related MinIO submission objects are not removed.

Required:

- Define recoverable deletion across the assignment, submissions, and every stored object.
- Cover partial storage/database failure and course-cascade implications.
- Do not mark delete Current until fault-injection tests pass.

#### Nginx upload limit

Current:

- Backend advertises 10 MiB assignment uploads.
- Live Nginx `/api/` has no explicit body limit and therefore uses a smaller default.

Required:

- Align Nginx and backend limits, accounting for multipart overhead.
- Test just below, at, and just above the effective limit through `http://localhost:8080/api/...`.

Primary files:

- `backend/api/routers/assignments.py`
- `backend/schemas/assignment.py`
- `backend/models/assignment.py`
- `backend/services/storage_service.py`
- `nginx/default.conf`
- assignment authorization/storage tests

### 2. Forced-password invariant and inconsistent protection

Current:

- `get_current_active_user` blocks every role when `force_password_change=true`.
- The product rule is Praktikan-only.
- Generic user creation inherits a true default, so a newly created Asprak can be blocked.
- Announcements and assignments use `get_current_user`, bypassing forced-password enforcement while other domains enforce it.

Required:

- Centralize the predicate: only Praktikan with the flag set is blocked.
- Apply it consistently across protected domain routes.
- Keep login, logout, me, and change-password reachable as designed.
- Set role-correct defaults during creation/reset/import.
- Add tests for all three roles across protected domains.

Primary files:

- `backend/api/dependencies.py`
- `backend/api/routers/users.py`
- `backend/api/routers/announcements.py`
- `backend/api/routers/assignments.py`
- `backend/tests/test_auth.py`

### 3. Rate-limit bypass and ineffective Redis limiter

Current:

- `rate_limit.py` imports `redis_client` by value before startup initializes/reassigns it, leaving the limiter on the process-local fallback.
- The limiter trusts the first client-provided `X-Forwarded-For` entry.
- Nginx appends to that header, allowing callers to rotate spoofed first entries.
- The in-memory fallback dictionary has no general bound/cleanup for attacker-generated keys.

Required:

- Resolve the initialized Redis client dynamically or through dependency injection.
- Derive client identity only through a trusted proxy configuration.
- Bound and expire fallback state.
- Test Redis mode, fallback mode, spoofed forwarding headers, multiple workers, 429 responses, and `Retry-After`.

Primary files:

- `backend/core/cache.py`
- `backend/core/rate_limit.py`
- `backend/main.py`
- `nginx/default.conf`
- focused rate-limit tests

### 4. Cookie-write CSRF

Current:

- Authentication uses an HttpOnly cookie with SameSite Lax.
- No CSRF token or validated Origin/Referer policy is implemented.

Required before production:

- Define the CSRF design for every cookie-authenticated write.
- Document allowed origins, token/header behavior if selected, failure status, proxy assumptions, and frontend impact.
- Add positive and negative tests.

### 5. Populated-database migration path

Current migration source adds the following non-null fields without a staged default/backfill/not-null sequence:

- course `academic_year`, `semester`, and `is_active`
- session `grades_published`
- session `attendance_status`
- module `is_published`

Additionally:

- module `course_id` remains nullable without a proven ownership backfill.
- The ledger says academic-period migration safety was confirmed, but the checked-in migration still lacks populated-row handling.

Required:

- Define deterministic existing-row values.
- Repair the upgrade path so a populated older database can cross every affected revision.
- Test fresh installation and populated upgrades from relevant earlier revisions.
- Document handling for databases already at head versus environments that have not applied the revisions.
- Reconcile the ledger with source-backed evidence.

Primary files:

- `backend/migrations/versions/09c48818a1ea_course_academic_period.py`
- `backend/migrations/versions/9acc5f60b7dd_session_grade_publishing.py`
- `backend/migrations/versions/e899f1b65d4c_module_lifecycle.py`
- `backend/migrations/versions/0f9b4b07b7d4_class_session_lifecycle.py`
- `backend/migrations/versions/c7c7cf5da67d_add_course_id_to_modules.py`
- populated migration tests

## Priority 1 — Remaining Asprak batch blockers

### 6. Module upload, replacement, and deletion lifecycle

Confirmed current behavior:

- Upload intents are bound to actor, course, operation type, extension, and a one-hour Redis TTL.

Remaining blockers:

- Intents are not atomically consumed.
- Replaying a completed replacement can delete the currently active object.
- DOCX validation checks only a ZIP prefix; PDF validation is only an initial signature check.
- Abandoned, expired, rejected, orphaned, and partially failed objects lack a complete cleanup/reconciliation policy.
- Delete commits database removal before storage deletion.
- Replacement commits the new key before deleting the old object.
- Legacy module course/publication data is not safely backfilled.
- Module schema lengths/null-clearing do not consistently match database constraints.

Required:

- Atomically consume intents and make confirmation idempotent or explicitly non-replayable.
- Prevent replay from deleting active data.
- Validate DOCX package structure and define accepted PDF validation depth.
- Implement cleanup/reconciliation for every object state.
- Define recoverable confirm/replace/delete/course-delete ordering.
- Add authorization, replay, validation, lifecycle, and fault-injection tests.

Primary files:

- `backend/api/routers/modules.py`
- `backend/schemas/module.py`
- `backend/models/module.py`
- `backend/services/storage_service.py`
- `backend/core/cache.py`
- module migrations and tests

### 7. Session and attendance concurrency/transitions

Current:

- “One open attendance session per course” is check-then-update without a database constraint or lock.
- Concurrent opens can both pass.
- Bulk attendance checks OPEN before writing but does not serialize against a concurrent close.
- Closing a SCHEDULED session and reopening a CLOSED session are currently possible.
- Repeated transitions use inconsistent 400/409 responses.

Required:

- Enforce one OPEN session per course at the database/transaction level.
- Prevent close-versus-save stale-check races.
- Implement the owner-approved transition table.
- Add concurrent open, close/save, repeated transition, and assigned/unassigned role tests.

Primary files:

- `backend/api/routers/class_sessions.py`
- `backend/api/routers/attendance.py`
- `backend/models/class_session.py`
- `backend/schemas/course.py`
- a migration for the concurrency invariant
- session/attendance concurrency tests

### 8. Grade publication concurrency and privacy evidence

Current:

- Grade save checks `grades_published` before writing but does not serialize against publish.
- A concurrent save/publish can produce contradictory state.
- Publication may occur with an empty or incomplete roster.
- Focused publish/unpublish/republish, privacy, and concurrency tests are incomplete.

Required:

- Prevent publish-versus-save races.
- Implement the owner-approved completeness policy.
- Preserve published-only Praktikan personal-grade access.
- Standardize lifecycle conflict responses.
- Add negative privacy, unassigned role, incomplete roster, and concurrency tests.

Primary files:

- `backend/api/routers/grades.py`
- `backend/models/class_session.py`
- `backend/schemas/grade.py`
- `backend/tests/test_attendance_grades.py`
- focused grade lifecycle/privacy tests

### 9. Export safety and semantics

Current:

- CSV/XLSX builders write user-controlled strings directly.
- Spreadsheet applications can interpret username values beginning with `=`, `+`, `-`, or `@` as formulas.
- Grade export does not identify whether values are draft or published.
- Unrecorded roster members are omitted without a confirmed policy.
- Focused authorization/content/injection tests are absent.

Required:

- Neutralize formula injection in every user-controlled cell.
- Implement the owner-approved grade-export scope and expose it in filename/metadata.
- Implement the owner-approved unrecorded-row behavior.
- Add assigned/unassigned authorization, empty-state, media type, filename, exact content, injection, and scale tests.

Primary files:

- `backend/api/routers/export.py`
- `backend/services/export_service.py`
- focused export tests

### 10. Additional RBAC/resource-integrity corrections

Current:

- Announcement-comment deletion does not bind the announcement to the path course.
- Assigned Asprak can remove a Praktikan enrollment, contradicting the durable Superadmin-only enrollment/staffing write rule.

Required:

- Bind announcement/comment/course IDs in one authorized query.
- Restrict enrollment removal to Superadmin unless Aidan explicitly changes the decision.
- Add cross-course and role-denial tests.

Primary files:

- `backend/api/routers/announcements.py`
- `backend/api/routers/courses.py`
- permission/announcement tests

### 11. Input bounds and stable error contracts

Required alongside the domain fixes:

- Match Pydantic title/description/filename limits to database/storage limits.
- Bound attendance and grade bulk record arrays for expected scale.
- Standardize 400/409/413/422/5xx behavior.
- Do not return a plain failure after one durable side effect succeeded without reconciliation details.
- Ensure OpenAPI documents actual error responses.

## Product decisions Aidan must confirm

1. Grade publication completeness:
   - Recommended: require a valid grade for every active enrolled Praktikan before publishing.
2. Attendance reopening:
   - Recommended: ordinary open permits only SCHEDULED → OPEN; reopening CLOSED requires an explicit audited action.
3. Staff grade-export scope:
   - Recommended: permit draft exports but identify `draft` or `published` in filename/metadata and frontend labels.
4. Unrecorded export rows:
   - Recommended: include the complete active roster with an explicit unrecorded value.

## Suggested implementation order

1. Auth invariant, Redis/IP rate limiting, CSRF contract, and RBAC/resource binding.
2. Migration strategy and database concurrency constraints.
3. Batch 2 assignments/submissions/grading/storage plus Nginx limits.
4. Modules/storage lifecycle.
5. Sessions/attendance/grade publication transitions and concurrency.
6. Export injection and semantics.
7. Full focused tests, runtime OpenAPI verification, and operation-level ledger updates.

Bagas may deliver these in one coordinated backend branch, but each operation should move to Current independently so safe frontend batches can resume as soon as their exact gates pass.

## Required validation

Use only a verified disposable test database.

- Focused authorization and cross-course tests.
- Forced-password tests across all roles/domains.
- Redis/fallback/spoofed-IP rate-limit tests.
- CSRF positive/negative tests.
- Populated migration tests plus fresh install.
- Concurrent attendance-open, close-vs-save, and publish-vs-grade-save tests.
- Assignment/module storage fault-injection and replay tests.
- Upload size/content/filename tests through Nginx.
- Grade publication/privacy/completeness tests.
- CSV/XLSX formula-injection and exact-content tests.
- Full backend suite with comparison to the historical failing baseline.
- `alembic upgrade head`, `docker compose config --quiet`, affected builds, service health, and runtime OpenAPI smoke.
- Update `docs/API_CONTRACT_STATUS.md` with PASS/FAIL/SKIPPED evidence per exact operation.

## Definition of handoff complete

- No cross-course nested-resource access is possible.
- Forced-password behavior matches the Praktikan-only product rule everywhere.
- Rate limiting uses the intended backend and cannot be bypassed with forwarding headers.
- CSRF design is implemented for production cookie writes.
- Populated database upgrades are proven.
- Assignment and module storage workflows are recoverable under partial failure and replay.
- Attendance/grade transitions remain correct under concurrency.
- Draft/unpublished privacy is proven with negative tests.
- Exports are formula-safe and semantically labeled.
- Runtime OpenAPI and the contract ledger match observed behavior.
- Aidan re-audits the exact operations before approving the next frontend batch.

