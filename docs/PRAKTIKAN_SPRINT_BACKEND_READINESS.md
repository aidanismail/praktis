# Praktikan Sprint Backend Readiness

Last audited: 2026-08-28  
Branch audited: `feature/asprak-features` at `2524cfb`  
Backend owner: Bagas  
Product and Praktikan frontend owner: Aidan

This is the consolidated backend/API/data/migration/storage/infrastructure handoff for the upcoming Praktikan sprint. It includes shared blockers first discovered during the Asprak audit whenever they also affect Praktikan security, privacy, data integrity, availability, or a required Praktikan workflow.

`docs/API_CONTRACT_STATUS.md` remains the authority for operation-level Current, Partial, Proposed, and Blocked status. This document is Bagas's implementation and acceptance checklist. An operation moves to Current only after its exact contract and required evidence are reflected in the ledger.

## Scope and boundaries

- Active roles remain `superadmin`, `asprak`, and `praktikan`. Do not introduce a Dosen application role.
- Bagas owns backend routes, schemas, models, migrations, storage, Nginx/backend infrastructure contracts, backend tests, and Superadmin frontend integration.
- Aidan owns product decisions and Praktikan frontend integration.
- Frontend visibility is not authorization. FastAPI/database/storage rules must enforce every privacy rule below.
- Preserve browser-facing same-origin `/api/...` requests, Nginx prefix stripping, HttpOnly-cookie authentication, and `credentials: "include"`.
- Do not invent a frontend response shape while a required operation is Partial, Proposed, or Blocked.

## Evidence baseline

### Verified from checked-in source

- Praktikan login, `/auth/me`, and password change exist.
- `GET /courses/` scopes Praktikan results through `Enrollment`.
- Course detail and session list require enrollment through the shared access helper.
- Announcement reads and comments require course access.
- Module list requires enrollment and filters Praktikan to `is_published=true`.
- Assignment list requires enrollment and filters Praktikan to `is_published=true`.
- `/attendance/me` filters rows by the authenticated user's ID.
- `/grades/me` filters rows by the authenticated user's ID and `ClassSession.grades_published=true`.
- `/auth/me` supplies the fields needed for the Target read-only profile.
- `docker compose config --quiet` passed during this audit, with a local Docker config permission warning.

### Not verified at runtime in this audit

- `docker compose ps` reported zero services on 2026-08-27.
- `docker ps` reported no running containers.
- Runtime OpenAPI, migrations against the current environment, MinIO behavior, Redis rate limiting, authenticated browser flows, and Nginx upload behavior were therefore not smoke-tested.
- Backend Pytest was not run because `TEST_DATABASE_URL` was not independently proven disposable. The fixture executes `TRUNCATE ... CASCADE`.

Source existence is not production-readiness evidence. Items below distinguish confirmed source defects from missing proof and product decisions.

## Praktikan workflow readiness matrix

| Workflow | Source status | Sprint readiness | Gate before frontend integration |
| --- | --- | --- | --- |
| Imported account and login | Partial | Blocked | Fix distributed/trusted-client login throttling and prove predictable initial-password protection |
| Forced first password change | Partial | Blocked | Enforce the Praktikan-only invariant consistently across every protected domain route |
| Logout/session lifecycle | Partial | Partial | CSRF decision and reset/change session invalidation policy |
| Read-only profile | Current in source | Partial | Auth-guard/runtime smoke; no new profile-edit contract required |
| Enrolled course list/detail | Current in source | Partial | Historical-access/removal policy and role-correct enrollment writes |
| Course sessions | Partial | Partial | Migration/state evidence and retained-history contract |
| Stream announcements/comments | Partial | Blocked for final release | Forced-password enforcement, cross-course comment binding, CSRF, input/list bounds |
| Published module list/download | Partial | Blocked | Residual URL exposure, response shaping, storage lifecycle/credentials, migrations, negative tests |
| Published assignment list/detail | Partial | Blocked | Reject known unpublished IDs and remove class-wide submission-count disclosure |
| Submit/resubmit assignment | Partial | Blocked | Nginx limit, bounded/content-safe upload, async storage, grade reset, atomicity/concurrency |
| Personal assignment result | Partial | Blocked | Own-data response, publication/release decision, resubmission correctness, privacy tests |
| Personal attendance | Current query in source | Partial | Context-complete history shape, missing-record semantics, tests |
| Published session grades | Partial | Blocked for final release | Context-complete history, publish/save concurrency, privacy transitions, migration tests |

## Priority 0 — Must resolve before the Praktikan sprint relies on the backend

### 1. First-login invariant and account-entry protection

#### Confirmed current behavior

- `get_current_active_user` blocks every role when `force_password_change=true`, although the durable product rule is Praktikan-only.
- Courses, modules, sessions, attendance, and grades use that dependency.
- Announcements and assignments use `get_current_user`, so a Praktikan whose first password change is still pending can list course data, comment, inspect assignments, and submit files.
- Imported Praktikan credentials use the predictable initial value `Praktis{npm}` and set the flag true.
- `rate_limit.py` imports `redis_client` by value before `init_redis()` reassigns it. The limiter therefore remains on the process-local fallback instead of the intended Redis state.
- The limiter trusts the first caller-supplied `X-Forwarded-For` address while Nginx appends to that header, allowing a client to rotate spoofed first entries.
- Change-password executes bcrypt verify/hash calls synchronously inside an async route.
- Password reset changes the password and flag but existing JWTs have no token-version/revocation check; a previously issued cookie remains accepted until expiry unless another invariant rejects the account.

#### Required outcome

- Centralize one role-aware predicate: only a Praktikan with a pending forced change is blocked.
- Apply it to every protected course/domain read and write, including announcements and assignments.
- Keep login, logout, `/auth/me`, and change-password reachable for the forced-change workflow.
- Resolve the live Redis limiter dynamically or through dependency injection.
- Derive client identity only from a trusted proxy configuration; bound/expire fallback state.
- Offload password hashing/verification from the event loop.
- Define whether password reset/change revokes all prior sessions and implement the approved policy.
- Prove all three roles and every Praktikan domain with focused negative tests.

#### Primary files

- `backend/api/dependencies.py`
- `backend/api/routers/users.py`
- `backend/api/routers/announcements.py`
- `backend/api/routers/assignments.py`
- `backend/core/cache.py`
- `backend/core/rate_limit.py`
- `backend/core/security.py`
- `backend/main.py`
- `nginx/default.conf`
- `backend/tests/test_auth.py`
- new forced-password and rate-limit tests

### 2. Assignment publication privacy and Praktikan response shaping

#### Confirmed current behavior

- List filtering hides unpublished assignments from Praktikan.
- Detail and submit load the course-bound assignment but do not reject it when `is_published=false`; a known UUID bypasses list visibility.
- Praktikan list and detail return `submissions_count` for the entire class.
- The list query uses `selectinload(Assignment.submissions)` for all assignments solely to calculate that count, even for Praktikan.
- Praktikan submission responses include internal identifiers such as `graded_by` that are not needed for the student experience.
- Assignment create accepts a `session_id` without proving that the session belongs to the same course.
- Staff submission-list and grading operations authorize the path course without first proving that the assignment belongs to it, putting Praktikan files and grades at cross-course risk.
- Grade input enforces only `score >= 0`; it does not enforce the assignment's `max_points`.

#### Required outcome

- Reject or conceal unpublished assignments consistently for Praktikan list, detail, and submit.
- Return a role-appropriate student response containing only that student's submission/result state; do not disclose class-wide counts or unnecessary staff/internal IDs.
- Avoid loading class-wide submissions on Praktikan reads.
- Bind `course_id`, `assignment_id`, optional `session_id`, and `submission_id` through authorized queries.
- Enforce `0 <= score <= assignment.max_points`.
- Use consistent 403/404 semantics that do not leak cross-course resource existence.

#### Required tests

- Published versus unpublished list/detail/submit for enrolled Praktikan.
- Known unpublished UUID and cross-course UUID negative tests.
- Enrolled versus unenrolled Praktikan.
- Student response does not expose other-student counts/data.
- Cross-course submission list and grading denial.
- Session/assignment same-course validation.
- Score below zero, zero, decimal, exact maximum, and above maximum.

#### Primary files

- `backend/api/routers/assignments.py`
- `backend/schemas/assignment.py`
- `backend/models/assignment.py`
- `backend/api/permissions.py`
- assignment authorization/privacy tests

### 3. Assignment upload, resubmission, and deletion integrity

#### Confirmed current behavior

- Nginx `/api/` has no explicit `client_max_body_size`, while the backend advertises 10 MiB assignment uploads. The storage route's separate 30 MiB setting does not apply to `/api/.../submit`.
- The route performs an unbounded `await file.read()` before checking size and returns 400 rather than a documented 413-style payload limit response.
- It accepts extension-only PDF/ZIP/DOCX validation, accepts empty content, and embeds the unbounded original filename in the object key and 255-character database field.
- boto3 `put_object` runs synchronously in the async request handler.
- A resubmission deletes the old object before database commit, swallows deletion failures, and has no compensation if commit fails.
- Resubmission resets only `status="submitted"`; old score, feedback, grader, and grading timestamp remain, so a new file can display a stale grade.
- Concurrent first submissions can both upload, then one can lose the unique-constraint race and leave an orphaned object.
- Assignment deletion removes database rows but not submission objects. Course cascade deletion has the same storage-cleanup gap.

#### Required outcome

- Align Nginx and FastAPI limits with multipart overhead and a stable 413 contract.
- Bound reads before retaining the full payload; reject empty files.
- Normalize/bound filenames and object keys.
- Validate actual accepted content: meaningful PDF checks and DOCX ZIP/package structure; define the accepted ZIP policy.
- Restrict `allowed_file_types` to the approved set rather than an arbitrary comma-separated string.
- Offload synchronous S3 work.
- Make submit/resubmit transaction and object ordering recoverable under database/storage failures and concurrent requests.
- Clear every prior grade/feedback/audit field on accepted resubmission unless Aidan approves a different audited workflow.
- Reconcile rejected, superseded, orphaned, and cascade-deleted objects.

#### Required tests

- Empty, malformed, extension-mismatch, unsafe/overlong filename, just-below/at/above limit through Nginx.
- Database failure after object upload and storage failure before/after database work.
- Concurrent first submission and concurrent resubmission.
- Resubmission clears stale grading state.
- Assignment delete and course delete clean or reconcile every submission object.

#### Primary files

- `nginx/default.conf`
- `backend/api/routers/assignments.py`
- `backend/schemas/assignment.py`
- `backend/models/assignment.py`
- `backend/services/storage_service.py`
- assignment upload/storage fault-injection tests

### 4. Historical-record retention and enrollment authority

#### Confirmed current behavior

- `GET /courses/`, course detail, sessions, modules, announcements, and assignments require a current enrollment row.
- `/attendance/me` and `/grades/me` continue returning the user's raw records after enrollment removal, but only with IDs and values; course/session context becomes inaccessible through student-authorized reads.
- Assigned Asprak can delete a Praktikan enrollment, contradicting the durable Superadmin-only enrollment/staffing-write rule.
- Course deletion is a hard database delete with cascades through sessions and associated academic records. Storage objects are not comprehensively reconciled.
- The Target product retains prior academic-period history.

#### Required outcome

- Restrict enrollment removal to Superadmin unless Aidan explicitly changes the durable decision.
- Implement the approved historical-access model so an administrative membership change does not silently make retained personal records unusable.
- Prefer archive/inactive semantics for completed offerings over destructive deletion where records must be retained.
- Define what happens to attendance, published grades, submitted work, feedback, announcements, and published modules when an enrollment or course is archived/removed.
- Add auditability for destructive administrative operations.

#### Primary files

- `backend/api/routers/courses.py`
- `backend/api/permissions.py`
- `backend/models/enrollment.py`
- `backend/models/course.py`
- related foreign keys/migrations
- enrollment, archive, history, and cascade tests

### 5. Module privacy, authorization lifetime, and storage lifecycle

#### Confirmed current behavior

- Praktikan list filtering requires enrollment and `Module.is_published=true`.
- The response includes a presigned download URL valid for up to one hour and also exposes the internal MinIO `file_key`.
- Unpublishing invalidates list cache, but it cannot revoke a URL already issued to the browser; that URL can remain usable until expiry.
- Both internal and public S3 clients authenticate with MinIO root credentials.
- Existing lifecycle gaps include replayable intents, replacement/delete ordering, incomplete PDF/DOCX validation, abandoned/orphan cleanup, and legacy nullable `course_id` ownership.
- A replayed replacement confirmation can endanger the current active object.

#### Required outcome

- Remove `file_key` from Praktikan responses.
- Implement Aidan's approved unpublish-access window, preferably a short-lived authorization or an authenticated download proxy where immediate revocation is required.
- Use a least-privilege application credential/policy instead of MinIO root credentials.
- Atomically consume upload intents and make confirm/replacement idempotent or explicitly non-replayable.
- Make confirm/replace/delete/course-delete ordering recoverable and reconcile all orphan states.
- Validate real DOCX structure and the approved PDF depth.
- Complete the course ownership/publication migration strategy.

#### Required tests

- Enrolled/unenrolled and published/unpublished list/download behavior.
- Already-issued URL behavior after unpublish, matching the approved contract.
- Response privacy: no internal storage key for Praktikan.
- Intent replay, concurrent confirm, replacement replay, storage/database fault injection, cleanup, and least-privilege permission tests.

#### Primary files

- `backend/api/routers/modules.py`
- `backend/schemas/module.py`
- `backend/models/module.py`
- `backend/services/storage_service.py`
- `backend/core/cache.py`
- module migrations
- `docker-compose.yml` and deployment secret/policy configuration
- focused module lifecycle/privacy tests

### 6. Session-grade publication privacy and concurrency

#### Confirmed current behavior

- `/grades/me` filters to `grades_published=true` and returns only the caller's rows.
- Grade save checks publication before writing, but save and publish are not serialized. A concurrent request can pass the check and write after publication.
- Publication is allowed with empty or incomplete grade rows.
- Focused unpublish/republish/privacy/concurrency coverage is incomplete.
- The published-grade response lacks course and session display context.

#### Required outcome

- Prevent publish-versus-save races at the database/transaction level.
- Implement Aidan's completeness policy.
- Preserve own-data-only and published-only access through publish, unpublish, republish, course archive, and enrollment changes.
- Standardize lifecycle conflict responses.
- Return or provide an efficient Current operation for the course/session context needed by personal grade history.

#### Primary files

- `backend/api/routers/grades.py`
- `backend/models/grade.py`
- `backend/models/class_session.py`
- `backend/schemas/grade.py`
- `backend/tests/test_attendance_grades.py`
- focused privacy/concurrency tests

### 7. Cookie-write CSRF

#### Confirmed current behavior

- Authentication uses an HttpOnly SameSite-Lax cookie.
- No CSRF token design or validated Origin/Referer policy exists.
- Praktikan writes include password change, announcement comments/deletions, and assignment submissions/resubmissions.

#### Required outcome before production

- Define and implement the CSRF policy for every cookie-authenticated write.
- Document trusted origins, proxy behavior, token/header behavior if selected, error status, and frontend integration impact.
- Add positive/negative cross-origin tests without weakening HttpOnly cookies or same-origin routing.

### 8. Populated-database migration safety

#### Confirmed current behavior

The checked-in revisions add non-null columns without a staged nullable/default/backfill/not-null sequence:

- course `academic_year`, `semester`, and `is_active`
- session `grades_published`
- session `attendance_status`
- module `is_published`

Module `course_id` remains nullable without a proven ownership backfill. Fresh or already-upgraded local success does not prove that a populated older database can cross these revisions safely.

#### Required outcome

- Define deterministic values for existing rows.
- Provide safe upgrade handling for environments before the revisions and a repair strategy for environments already marked at head.
- Test fresh installation and populated upgrades from each relevant earlier revision.
- Document downgrade/rollback constraints without performing destructive production tests.
- Reconcile any ledger claim that exceeds checked-in evidence.

#### Primary files

- `backend/migrations/versions/09c48818a1ea_course_academic_period.py`
- `backend/migrations/versions/9acc5f60b7dd_session_grade_publishing.py`
- `backend/migrations/versions/e899f1b65d4c_module_lifecycle.py`
- `backend/migrations/versions/0f9b4b07b7d4_class_session_lifecycle.py`
- `backend/migrations/versions/c7c7cf5da67d_add_course_id_to_modules.py`
- populated-upgrade tests/fixtures

## Priority 1 — Contract completeness and operational quality

### 9. Context-complete personal attendance and grade history

Current personal response rows contain record ID, session ID, student ID, value/status, timestamps, and recorder ID. They do not contain course code/name/academic period or session title/date.

Required:

- Confirm a bounded, efficient contract for the Praktikan history screens.
- Avoid requiring one request per course/session or joins that only work while currently enrolled.
- Preserve only the caller's data and published-grade privacy.
- Define deterministic ordering, multi-year pagination/retention, and inactive-course behavior.
- Keep absence of attendance explicit as “not recorded”; do not synthesize `alfa` without a stored record.

Primary files:

- `backend/api/routers/attendance.py`
- `backend/api/routers/grades.py`
- `backend/schemas/attendance.py`
- `backend/schemas/grade.py`
- related course/session response schemas and tests

### 10. Course People contract for Praktikan

Current:

- Praktikan cannot call the student roster route, which is appropriate for privacy.
- The assigned-staff route is Superadmin-only.
- The durable four-tab course workspace mentions a People experience, but no confirmed Praktikan-safe staff directory exists.

Required after Aidan's decision:

- If People remains in Praktikan scope, expose only the minimum assigned-Asprak identity fields needed by students.
- Do not expose the enrolled student roster or unnecessary staff email/internal IDs without an explicit requirement.
- Add enrolled/unenrolled and cross-course tests.

Primary files:

- `backend/api/routers/courses.py`
- `backend/schemas/course.py`
- permission tests

### 11. Stream bounds and nested-resource integrity

Current:

- Announcement/comment content has a minimum length but no maximum.
- A course stream returns all announcements and all loaded comments without pagination.
- Delete-comment binds comment to `announcement_id` but does not prove that announcement belongs to the authorized path `course_id`.

Required:

- Bind course, announcement, and comment in the authorized query.
- Add reasonable schema/database-aligned content bounds.
- Define bounded pagination or incremental comment loading for retained multi-year courses.
- Preserve safe text rendering; do not introduce unsafe HTML.
- Test ownership, cross-course paths, large input, and pagination ordering.

Primary files:

- `backend/api/routers/announcements.py`
- `backend/schemas/announcement.py`
- `backend/models/announcement.py`
- announcement permission/pagination tests

### 12. Assignment and time-value contract cleanup

Required alongside Priority 0 fixes:

- Require timezone-aware assignment due dates or normalize them explicitly before comparing to UTC.
- Define whether late submission remains open while published or whether a future lock/close state is required.
- Make PATCH unset-aware so staff can intentionally clear optional description/due-date values.
- Ensure staff update responses contain accurate submission counts.
- Bound feedback/description fields to database and UI expectations.
- Standardize 400/403/404/409/413/422 and partial-failure behavior in OpenAPI.

### 13. Missing focused evidence

The current suite includes selected happy paths and some permission tests, but does not prove the full Praktikan workflow. Bagas must add or extend tests for:

- forced-password behavior across every protected domain and all three roles
- Redis mode, fallback mode, multiple workers, spoofed forwarding headers, 429 and `Retry-After`
- password reset/change session invalidation policy
- unpublished assignment list/detail/submit privacy
- Praktikan response data minimization
- assignment upload content/size/filename, stale-grade reset, concurrency, and storage/database failure
- module published/unpublished visibility, response privacy, residual URL semantics, replay, and cleanup
- personal attendance access and missing-record behavior
- grade publish/unpublish/republish privacy and concurrency
- enrollment removal/history retention and course archival/deletion
- announcement cross-course deletion, input bounds, and pagination
- CSRF positive/negative behavior
- fresh and populated migration upgrades

## Decisions Aidan must confirm

These are not Bagas defects until Aidan confirms the target behavior.

1. **Historical access after enrollment removal**  
   Recommended: preserve read access to the student's retained attendance, published grades, submissions/feedback, and completed-course context. Administrative removal should stop active participation without erasing history.

2. **Praktikan People tab**  
   Recommended: show a minimal assigned-Asprak directory only; keep the Praktikan roster private.

3. **Late submission closure**  
   Recommended for the first Praktikan sprint: accept submissions while the assignment is published and mark post-deadline work late. Add a close/lock state only through a separately approved contract.

4. **Assignment-grade release**  
   Recommended: show a student's own grade/feedback when their submission is graded and the assignment remains published. Add a separate assignment-grade publication state only if coordinated release is required.

5. **Module unpublish revocation window**  
   Recommended: short-lived download authorization, or an authenticated proxy if unpublish must revoke immediately. Do not silently treat the current one-hour URL as immediate revocation.

6. **Missing attendance**  
   Recommended: display “Not recorded.” Only a stored `alfa` record means absent.

7. **Session-grade publication completeness**  
   Recommended: require a valid grade for every active enrolled Praktikan before publication, with an explicit controlled exception workflow if needed.

## Suggested Bagas implementation batches

### Backend Batch 0 — Trust boundary

- Forced-password invariant across roles/domains
- Redis/trusted-proxy rate limiting
- password hashing offload and session invalidation decision
- CSRF contract and tests

Unblocks safe authentication and protected-route smoke; it does not make domain operations Current by itself.

### Backend Batch 1 — Persistence and retention foundation

- populated migration path
- enrollment-write authorization
- historical access/archive policy and foreign-key behavior
- personal-history response direction

### Backend Batch 2 — Assignment privacy and storage

- unpublished/resource-binding/data-minimization fixes
- score and session ownership validation
- Nginx/upload validation
- resubmission grade reset, concurrency, compensation, deletion cleanup

### Backend Batch 3 — Module privacy and lifecycle

- Praktikan response shaping and download lifetime
- least-privilege credentials
- intent/replay/replacement/delete/orphan reconciliation
- lifecycle/privacy tests

### Backend Batch 4 — Attendance, grades, and course context

- context-complete bounded personal history
- grade publication concurrency/completeness/privacy
- attendance missing-record semantics
- optional minimal staff directory after Aidan's decision

### Backend Batch 5 — Stream and contract hygiene

- nested comment binding
- content bounds and pagination
- timezone/PATCH/error-contract cleanup

### Backend Batch 6 — Evidence and handoff

- focused and full backend suite on a verified disposable test database
- fresh and populated migration runs
- Nginx upload-boundary and authenticated role smoke
- runtime OpenAPI reconciliation
- per-operation updates to `docs/API_CONTRACT_STATUS.md`

Bagas may coordinate these in one branch, but Aidan should re-audit and integrate per exact Current operation rather than waiting for or accepting one blanket completion claim.

## Required validation evidence from Bagas

Run only against an explicitly verified disposable test database.

- Focused authorization, unpublished-resource, cross-course, and own-data privacy tests.
- Forced-password tests across all roles and protected domains.
- Redis/fallback/multi-worker/spoofed-IP rate-limit tests.
- CSRF positive and negative tests.
- Fresh install and populated migration upgrades from relevant prior revisions.
- Assignment and module storage fault-injection, replay, concurrency, and cleanup tests.
- Upload validation and effective size limits through `http://localhost:8080/api/...`.
- Enrollment-removal, archive, and historical-record tests.
- Grade publish/unpublish/republish/completeness/concurrency/privacy tests.
- Personal attendance/grade shape, ordering, pagination, and missing-record tests.
- Full backend suite compared with the recorded historical failing baseline.
- `alembic upgrade head`, `docker compose config --quiet`, affected image builds, service health, and runtime OpenAPI smoke.
- Authenticated browser smoke using Nginx, not direct browser calls to port 8000 or 9000.

Every result must be recorded as PASS, FAIL, or SKIPPED. Reaching Alembic head or seeing a route in OpenAPI is not enough to promote it to Current.

## Frontend integration gates

Aidan can plan UI slices against Proposed behavior, but should not implement affected API integration until the required operation is Current in the ledger.

- **Profile/course shell:** Batch 0 plus runtime auth/course-scope evidence.
- **Stream:** Batch 0 and Stream integrity/CSRF items.
- **Modules:** Module Batch 3 and migration/storage evidence.
- **Assignments/submission/results:** Assignment Batch 2 and CSRF evidence.
- **Attendance:** Personal-history contract and tests from Batch 4.
- **Session grades:** Publication privacy/concurrency and personal-history contract from Batch 4.

## Definition of handoff complete

- A pending first password change cannot access any protected Praktikan domain.
- Login throttling uses shared Redis state and cannot be bypassed by caller-controlled forwarding headers.
- Cookie writes have an approved production CSRF defense.
- Unpublished assignments and modules are inaccessible according to the approved revocation contract.
- Praktikan responses expose only their own data and necessary public course/staff fields.
- Uploads are bounded and content-validated through Nginx; storage and database partial failures are recoverable.
- Resubmission cannot retain a stale grade or orphan/delete the wrong object.
- Cross-course nested-resource access and mutation are impossible.
- Enrollment changes and course lifecycle preserve the approved historical record experience.
- Published grade privacy remains correct under concurrency and lifecycle transitions.
- Populated database upgrades are proven.
- The required negative, concurrency, storage-fault, migration, and runtime tests pass.
- Runtime OpenAPI and `docs/API_CONTRACT_STATUS.md` match observed behavior per operation.
- Aidan re-audits the relevant Current contracts before starting each Praktikan frontend integration batch.
