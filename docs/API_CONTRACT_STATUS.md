# API Contract Status

Last inspected: 2026-09-02
Branch: `dev`

This is the integration-readiness ledger, not a release certificate. Status meanings are in [FULL_STACK_WORKFLOW.md](FULL_STACK_WORKFLOW.md).

Final Asprak frontend automated audit on 2026-08-31: Batches 2.2 through 7 are
implemented in source; typecheck, lint, the network-enabled production build,
diff integrity, same-origin runtime health, scope, cache, privacy, performance,
and accessibility-source reviews pass. Authenticated end-to-end, real-file,
RBAC substitution, responsive, and keyboard browser acceptance remains pending
and is not represented as completed by this ledger.

Praktikan frontend integration audit on 2026-09-02: the approved read-only
course, Stream/comment, published-module, published-assignment/personal-result,
session/attendance, published-grade, profile, and password workflows are
implemented in source. Type checking, linting with only the three pre-existing
Superadmin warnings, a network-enabled production build, diff integrity,
same-origin runtime health/protected-route probes, and static scope/privacy
reviews passed. Authenticated end-to-end, representative-data, responsive, and
keyboard browser acceptance remains pending and is not reported as completed.

Asprak and Praktikan course workspace navigation was aligned on 2026-09-02 to
five URL-backed tabs: Stream, Modules, Assignments, People, and Sessions &
Attendance. Both roles use the same keyboard-accessible tab navigator while
retaining role-specific panels and permissions. Only the selected Modules or
Assignments panel mounts, and the legacy `?tab=classwork` value resolves to
Assignments for bookmark compatibility. Frontend typecheck, focused lint, full
lint, the network-enabled production build, and diff integrity passed; full lint
retained four warnings in unchanged Admin and announcement files.

## Summary

| Area                                                                    | Status                                                                                                | Consumers                              | Next action                                                                                            |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Cookie authentication & rate limiting                                   | Current and frontend-integrated for session identity/forced-password routing; Partial for client CSRF | all roles                              | Complete authenticated cross-role smoke; CSRF design remains for production                            |
| Academic-period course list                                             | Current and frontend-integrated for Asprak assignment and Praktikan enrollment reads                  | Asprak; Praktikan                      | Complete authenticated role-scoping smoke                                                              |
| Roster read / enrollment and staff                                      | Current and frontend-integrated for assigned-Asprak roster reads; Current backend contract for writes | Asprak roster reads; Superadmin writes | Runtime-smoke roster states; Bagas owns Superadmin FE                                                  |
| Session create/list/update/open/close                                   | Current and frontend-integrated for the assigned-Asprak session workspace                              | Asprak; Praktikan reads                | Complete authenticated lifecycle/browser smoke                                                         |
| Safe session delete/archive                                             | Blocked                                                                                               | Asprak                                 | Backend retention/archive contract absent                                                              |
| Module presign/confirm/list                                             | Current and frontend-integrated for Asprak management and Praktikan published-only list/download       | Asprak; Praktikan                      | Complete authenticated real-file browser smoke                                                          |
| Module update/publish/replace/delete                                    | Current backend contracts; metadata/publish are frontend-integrated for Asprak while replace/delete stay excluded | Asprak, Praktikan visibility | Complete authenticated metadata/publication smoke; keep replace/delete controls absent                  |
| Attendance bulk/list/personal                                           | Current and frontend-integrated for Asprak session management and Praktikan personal read-only history | Asprak; Praktikan                      | Complete authenticated record/privacy browser smoke                                                     |
| Grades bulk/list/personal                                               | Current and frontend-integrated for Asprak gradebook/publication and Praktikan published personal reads | Asprak; Praktikan                     | Complete authenticated publication/privacy browser smoke                                                |
| Assignments & submissions                                               | Current and frontend-integrated for Asprak management/review and Praktikan published/own-result reads plus upload/resubmit; deletion excluded | Asprak; Praktikan | Complete authenticated upload/resubmit browser smoke; keep delete controls excluded                      |
| Exports                                                                 | Current and frontend-integrated for assigned-Asprak attendance/grade CSV/XLSX downloads                | Asprak                                 | Complete authenticated file-content/browser smoke                                                      |
| OpenAPI-to-TypeScript automation                                        | Proposed                                                                                              | all FE owners                          | Separate tooling/CI plan                                                                               |
| CSRF design                                                             | Blocked before production                                                                             | all cookie writes                      | Bagas proposes; Aidan reviews FE impact                                                                |
| Superadmin overview reads                                               | Current and frontend-integrated for course, user, and health summary reads                            | Superadmin                             | Complete browser smoke for navigation, partial failures, and role scope                                |

## Authentication

Implemented: login sets an HttpOnly cookie; logout deletes it; change-password returns a message; `/auth/me` returns the user; cookie is SameSite Lax and Secure in production. Browser paths add `/api`.

Backend auth hardening added on 2026-08-28:

- `force_password_change` invariant centralized to strictly enforce on `RoleEnum.PRAKTIKAN`
- `announcements` and `assignments` protected with `get_current_active_user`
- dynamic Redis client resolution implemented to eliminate static `None` fallback
- trusted client IP derived from Nginx `X-Real-IP` (`$remote_addr`) to eliminate rate-limit header spoofing

Frontend session integration added on 2026-09-02:

- one stable TanStack Query key resolves `/auth/me` and supplies confirmed user
  presentation state to all protected roles
- 401 cancels/removes cached role data and redirects to sign in, while a
  transient identity failure preserves session presentation and exposes Retry
- only a forced Praktikan is redirected to change password; onboarded users may
  deliberately use the same route for a voluntary password change
- confirmed login/password responses seed the identity cache, and confirmed
  logout removes all cached academic data before redirecting

Remaining Partial gaps:

- user model defaults the flag to true
- CSRF protection beyond SameSite is not defined

## Academic-period courses

Status: Current and frontend-integrated for Asprak assigned-course and
Praktikan enrolled-course reads.

Implemented and confirmed:

- `GET /courses/` returns only courses assigned through `CourseStaff` when the caller is an authenticated Asprak
- response fields are `id`, `code`, `name`, `academic_year`, `semester`, and `is_active`
- `semester` uses `Ganjil` or `Genap`
- uniqueness uses `(code, academic_year, semester)`
- the populated-database migration/backfill and Asprak authentication behavior are safe for this integration
- an Asprak assignment-scope test exists

Bagas confirmed the response and migration/auth readiness through Aidan on 2026-08-13.

Frontend integration added on 2026-08-13: the Asprak `My Practicum Classes` dashboard item uses a typed same-origin API wrapper, user-scoped TanStack Query key, bounded retry, and active/history request-state UI. Browser runtime smoke remains a manual validation item.

Frontend course-centric Overview integration added on 2026-08-20: the real Asprak Overview reuses the same user-scoped query to derive assigned, active, and historical counts and renders bounded active-course shortcuts. Global Asprak Modules, Attendance, Grading, and Reports placeholders are removed; those operations remain inside a selected course workspace and follow their individual readiness entries below.

Praktikan integration added on 2026-09-02: Overview and My Practicum Classes
use an authenticated-user-scoped enrollment query, expose active/history
academic periods in grid and table views, and gate every direct course child
request until the selected course is present in that enrollment result.

Integration boundaries:

- browser path is `GET /api/courses/`
- request body and query parameters are absent
- the frontend consumes the backend-scoped result and must not reconstruct assignment authorization
- course creation and other Superadmin writes remain Bagas-owned
- academic-year formatting validation and retained-history pagination remain follow-up concerns and do not block the confirmed initial scale

## Superadmin overview reads

Status: Current and frontend-integrated for the approved Superadmin overview
scope.

Confirmed source behavior:

- `GET /courses/` returns every academic-period course offering for an
  authenticated Superadmin.
- `GET /auth/users` is Superadmin-only and returns registered accounts using the
  existing `UserResponse` shape.
- `GET /health` returns service status, database connectivity, and Alembic
  revision currency.
- Browser integration uses `GET /api/courses/`, `GET /api/auth/users`, and
  `GET /api/health` through the shared same-origin client.
- No request body or query parameters are used by these overview reads.

Frontend integration updated on 2026-08-27:

- overview query keys are scoped by authenticated Superadmin ID
- course, user, and health reads use independent TanStack Query states and
  bounded retry
- 401, 403, transient failure, loading, empty, refresh, and partial-data states
  are represented
- active course shortcuts are sorted deterministically and bounded to six
- navigation uses native keyboard-accessible controls
- the overview no longer calls the Partial global module-list operation merely
  to calculate a count

Limitations:

- course and user endpoints still return complete unpaginated lists
- browser runtime smoke remains required
- the existing public health-endpoint exposure is backend behavior and is not
  broadened by this frontend integration
- module management remains governed by the existing Partial module lifecycle
  entries

## Roster and staff

Status: Current and frontend-integrated for assigned-Asprak roster reads.

Confirmed backend behavior:

- `GET /courses/{course_id}/students` returns `{ id, username, email }[]`; `username` is the Praktikan NPM
- browser integration uses `GET /api/courses/{courseId}/students` through the shared same-origin cookie client
- Superadmin or an assigned Asprak may read the roster; the frontend enables this slice only for Asprak, while FastAPI remains authoritative
- the backend returns 401, 403, or 404 as applicable and caches the course roster for about 30 seconds

Frontend integration added on 2026-08-14:

- assigned-course cards link to an encoded dynamic course-detail route
- direct entry first resolves the selected ID against the authenticated Asprak's assigned-course result, so an invalid or unassigned ID does not start a roster request
- the roster uses a user-and-course-scoped TanStack Query key, 30-second freshness, one transient retry, and no automatic retry for 401/403/404
- loading, empty, unauthorized, forbidden, missing-course, transient-error/retry, count, NPM, email, responsive, and keyboard-focus states are represented

Limitations:

- browser runtime smoke remains pending
- no focused roster-route backend test was found; route source, the shared access helper, enrollment tests, and shared permission tests are the available evidence
- the response is unpaginated; pagination/search requires a future contract if individual course rosters grow beyond the confirmed initial scale
- Superadmin enrollment/staff frontend work remains Bagas-owned

## Class sessions

Status: Current and frontend-integrated for assigned-Asprak list, create,
update, open, close, reopen, and verified session deep links. Safe
delete/archive remains Blocked and absent from the frontend.

Current and evidenced:

- create/list under course routes
- update by session ID
- attendance open/close
- response publication and attendance-status fields

Frontend integration added on 2026-08-31:

- the fourth course workspace tab loads one authenticated, user/course-scoped
  session query only while active and renders loading, empty, access, retry,
  stale-refresh, create, edit, and attendance-transition states
- create and update responses replace only the affected course-session cache;
  open/close/reopen waits for server confirmation and then invalidates the
  exact course query
- all attendance-transition controls in the course are disabled while one
  transition is pending, and 400/409 states remain explicit and non-destructive
- a successful transition updates only the already-confirmed target session in
  its scoped cache before the exact course-session background reconciliation,
  preventing a stale control state if that refresh is interrupted
- the encoded session route verifies the assigned course first and then finds
  the session in that authorized course list before later attendance, grade,
  or export requests may start
- no delete/archive endpoint is wrapped or rendered
- `pnpm typecheck`, `pnpm lint`, the network-enabled production build, and
  `git diff --check` passed on 2026-08-31; lint retained only the three
  pre-existing Superadmin warnings

Limitations:

- focused update/open/close tests were not found
- repeated transition statuses are inconsistent
- safe delete/archive is absent
- new non-null state fields lack documented existing-row backfill

- authenticated create/edit/open/close/reopen, 409, responsive, and keyboard
  browser acceptance remains pending

## Modules

Status: Current and frontend-integrated for the approved assigned-Asprak
management workflow and Praktikan enrolled-course published-only list and
download. Replacement and deletion remain excluded from the locked frontend
scope.

Current and evidenced:

- `GET /modules/?course_id={course_id}` validates course access, scopes Asprak
  rows through `CourseStaff`, filters Praktikan rows to enrolled-course
  published modules, and orders newest first.
- The list returns `id`, `title`, optional `description`, a time-limited
  `download_url`, `is_published`, `created_at`, `course_id`, and `file_key`.
  Current source deliberately serializes `file_key: null` for Praktikan.
- Assigned-course and enrollment permission tests cover unassigned/enrolled
  list access plus assigned/unassigned Asprak presign access.
- Presign intents are time-limited and bound to actor, course, extension, and
  operation type. Confirmation validates the intent, object existence, the
  25 MiB bound, initial PDF/DOCX signature, and file-key format.
- Runtime OpenAPI exposes list, presign, confirm, metadata update,
  publish/unpublish, replacement, and deletion operations. The locked frontend
  integrates only the explicitly approved non-destructive subset.

Frontend list/download integration added on 2026-08-31:

- the Modules tab starts a same-origin, authenticated, course-filtered module
  read only after the assigned-course workspace gate succeeds
- query state is scoped by authenticated user and course, remains fresh for
  30 seconds, and retries only one transient failure
- module loading, empty, unauthorized, forbidden, missing/invalid course,
  transient retry, stale refresh, count, draft/published, and download states
  are independent from assignment request state
- presigned download URLs remain in TanStack Query memory and are exposed only
  through native links; the internal `file_key` is typed but neither rendered
  nor persisted
- `pnpm typecheck`, `pnpm lint`, and the network-enabled production build
  passed on 2026-08-31; lint retained only three pre-existing Superadmin
  warnings

Praktikan module presentation added on 2026-09-02 uses explicit read-only
access mode, defensively omits unpublished rows, and mounts no upload, editor,
publication, replacement, deletion, or storage-key control. A deliberate
Refresh links action renews the user/course-scoped in-memory list.

Frontend upload/metadata/publication integration added on 2026-08-31:

- the upload form validates a non-empty PDF/DOCX up to 25 MiB, requests a
  same-origin presigned intent, uploads directly to storage without cookies,
  and confirms through the backend before showing success
- presign, storage PUT, and confirmation failures remain distinct; retry is
  explicit and bounded to the same in-memory attempt for 55 minutes, with no
  automatic duplicate write or browser persistence
- metadata update, publish, and unpublish are server-confirmed mutations that
  invalidate only the authenticated user/course module query
- write controls are disabled while their operation is pending, recoverable
  form input is preserved after failure, and status/focus behavior is exposed
  for keyboard and assistive-technology use
- replacement and deletion endpoints are not wrapped or rendered
- `pnpm typecheck`, `pnpm lint`, the network-enabled production build, and
  `git diff --check` passed on 2026-08-31; lint retained only the three
  pre-existing Superadmin warnings

Integration boundaries:

- authenticated browser acceptance for real PDF/DOCX upload/download,
  metadata/publication transitions, failure/retry states, responsive layout,
  and keyboard use remains pending
- `is_published` migration backfill remains undocumented
- focused tests do not cover the complete visibility, update, publication,
  replacement, deletion, and cleanup lifecycle
- ZIP magic alone does not prove complete DOCX structure
- download URLs remain usable until their expiry, including after unpublish;
  the current expiration can be up to one hour
- database/storage ordering and abandoned/rejected/superseded object cleanup
  remain material for replacement/deletion, so those controls stay absent
- the approved Batch 3.2 frontend integration does not expand backend or
  Superadmin ownership

## Attendance

Bulk upsert validates active enrolled Praktikan IDs. Session reads are staff-protected and personal history is user-scoped. Tests cover deduplication, invalid students, audit fields, role denial, and missing sessions.

Status: Current and frontend-integrated for the assigned-Asprak session
attendance list/full-roster bulk save and Praktikan personal read-only history.
Attendance-window lifecycle limitations remain documented under class sessions.

Frontend integration added on 2026-08-31:

- attendance starts only inside a course/session context already verified by
  the assigned-course and course-session queries
- roster and saved rows remain independent user/course/session-scoped queries;
  missing rows display `Not recorded` and never become an academic status
  implicitly
- the form requires one explicit lowercase backend status for every enrolled
  Praktikan, sends one deduplicated full-roster request, disables automatic
  write retries, and invalidates only the selected session attendance query
- Scheduled and Closed sessions remain readable but not editable; FastAPI also
  rejects assigned-Asprak writes unless the server session state is `OPEN`
- search preserves hidden values, counts are derived locally, and unmatched
  saved records produce a visible data-mismatch warning
- a 422 roster refresh preserves dirty values by student ID rather than row
  position, and unsaved navigation/reset warnings avoid silent loss
- deterministic student ordering plus dirty-form refresh isolation prevents a
  background roster reorder from attaching an academic status to another row
- `pnpm typecheck`, `pnpm lint`, the network-enabled production build, and
  `git diff --check` passed on 2026-08-31; lint retained only the three
  pre-existing Superadmin warnings

Praktikan integration added on 2026-09-02:

- `/attendance/me` uses a separate authenticated-user query key and feeds a
  grouped, filtered, bounded personal history
- the course session panel merges records only by `session_id`; a missing row
  is labeled `Not recorded` and never inferred as an attendance status
- no staff roster/list/write, attendance-window mutation, export, or student
  check-in control is mounted in the Praktikan tree

Limitations:

- authenticated full-roster save/reload, error simulation, long-roster,
  responsive, and keyboard browser acceptance remains pending
- the 30 requests/minute backend bulk rate limit remains authoritative
- attendance contains sensitive academic data and remains only in query/form
  memory

## Grades

Implemented: bulk upsert, score validation, edit rejection while published, staff session list, publish/unpublish, and personal filtering to published sessions.

Status: Current and frontend-integrated for assigned-Asprak session list,
finite-score bulk save, publish/unpublish, and Praktikan personal published
history.

Frontend integration added on 2026-08-31:

- grade reads and writes start only in an assigned-course/session context and
  use user/course/session-scoped query keys separate from assignment grading
- blank rows remain ungraded and are omitted; numeric zero remains a real
  score, while finite decimal validation enforces 0 through 100
- the frontend does not imply deletion when a saved score is cleared because
  the current backend has no grade-record delete operation
- all grade writes disable automatic retry; a server 409 preserves local
  input and refreshes the exact session list so publication remains
  server-authoritative
- successful publication updates only the confirmed session's boolean in its
  scoped cache before exact background reconciliation; no pre-response
  optimistic publication is used
- publication is never optimistic, is disabled when zero saved rows exist,
  discloses `saved / roster` completeness, and requires explicit confirmation
  for partial publication and unpublication
- published sessions are read-only until server-confirmed unpublication;
  copy states that draft data is staff-only and each Praktikan sees only their
  own published saved result
- deterministic student ordering plus dirty-form refresh isolation keeps score
  input bound to student ID across background roster changes
- `pnpm typecheck`, `pnpm lint`, the network-enabled production build, and
  `git diff --check` passed on 2026-08-31; lint retained only the three
  pre-existing Superadmin warnings

Praktikan integration added on 2026-09-02:

- `/grades/me` uses a separate authenticated-user query key and feeds grouped,
  filtered, bounded personal history plus cached Overview metrics
- course context matches personal results to readable sessions by `session_id`
  and distinguishes `Not released`, no published score, numeric zero, and
  finite decimal results
- no staff grade read/write/publication, roster, or export operation is mounted
  in the Praktikan tree

Limitations:

- no focused publication/privacy-transition tests found
- repeated transitions use 400 while lifecycle conflict may require 409
- route text says Asprak-only while shared permission code allows Superadmin
- backend intentionally permits partial-roster publication; the frontend
  exposes this rather than implying completeness
- pre-publication tests require reconciliation
- authenticated save/publish/unpublish/correct/republish, conflict, responsive,
  and keyboard browser acceptance remains pending
- the non-null grade-publication migration backfill remains undocumented

## Exports

Status: Current and frontend-integrated for assigned-Asprak attendance and
session-grade CSV/XLSX downloads.

Current and integrated behavior:

- `GET /export/attendance/{session_id}?format=csv|xlsx` returns saved
  attendance rows with `username`, `email`, and `status`; unrecorded roster
  members are omitted
- `GET /export/grades/{session_id}?format=csv|xlsx` returns saved grade rows
  with `username`, `email`, and `score` regardless of publication state
- both routes authorize through the session's course, deny Praktikan, return
  404 for zero saved rows, and sanitize spreadsheet formula prefixes
- the verified session UI discloses saved-row/roster counts and labels grade
  files as draft or published before the deliberate download action
- the frontend validates a strict format union, fetches same-origin with the
  HttpOnly cookie, uses a safe generated filename, parses errors without raw
  navigation or internal details, prevents repeat clicks, and revokes each
  temporary object URL in success and cleanup paths
- blobs, filenames, and downloaded academic rows are not cached in TanStack
  Query, Zustand, or browser storage
- `pnpm typecheck`, `pnpm lint`, the network-enabled production build, and
  `git diff --check` passed on 2026-08-31; lint retained only the three
  pre-existing Superadmin warnings

Limitations:

- authenticated CSV/XLSX content, Unicode, row-count, filename, empty/error,
  responsive, and keyboard browser acceptance remains pending
- grade exports intentionally contain saved draft rows while unpublished; the
  publication-aware frontend copy must remain visible

## Migration readiness

Recent course, grade-publication, module-publication, and attendance-status migrations add non-null fields without server defaults or staged backfills. Empty-database success does not prove a populated upgrade.

Bagas evidence required:

1. existing-row values
2. nullable/default/backfill/not-null sequence
3. populated-database upgrade test
4. safe rollback policy

## Course Stream & Announcements

Status: Current and frontend-integrated for Asprak management and Praktikan
enrolled-course read/comment workflows.

Implemented and evidenced:

- `GET /courses/{course_id}/announcements`: list stream announcements with pinned-first sorting, comment counts, and author information.
- `POST /courses/{course_id}/announcements`: create course announcement (Superadmin & assigned Asprak).
- `PATCH /courses/{course_id}/announcements/{id}`: update announcement (author or Superadmin).
- `DELETE /courses/{course_id}/announcements/{id}`: delete announcement (author or Superadmin).
- `POST /courses/{course_id}/announcements/{id}/comments`: add discussion comments (all enrolled Praktikan and assigned staff).
- `DELETE /courses/{course_id}/announcements/{id}/comments/{comment_id}`: delete comment (author or Superadmin).
- Pytest test suite in `tests/test_announcements_assignments.py` covers full lifecycle.

Frontend integration added on 2026-08-20:

- the initial assigned-Asprak course workspace slice exposed Stream and People before the later Modules, Assignments, and Sessions & Attendance integrations
- the Stream uses exact response/payload types, Zod forms, same-origin wrappers, and user-and-course-scoped TanStack Query state
- Asprak can list and create announcements, manage only their own announcement controls, add comments, and manage only their own comment controls; FastAPI remains authoritative
- writes wait for confirmed server success and invalidate only the affected course Stream instead of using optimistic destructive updates
- loading, empty, 401, 403, 404, transient-error/retry, validation, pending, confirmation, and success states are represented

Praktikan integration added on 2026-09-02 uses an explicit viewer role: it
mounts no announcement composer or announcement-management mutation, while
retaining enrollment-scoped reads, comment creation, and own-comment deletion.
The People tab displays only the current user's identity and never calls roster
or staff endpoints.

Limitations:

- authenticated browser lifecycle smoke remains pending
- the list contract is unpaginated and needs a future bound for long-lived course streams
- cookie-write CSRF design remains blocked before production even though local same-origin integration is Current

## Assignments & Submissions

Status: Current and frontend-integrated for assigned-Asprak assignment
list/create/detail/update, submission review, and grading. Praktikan
submit/resubmit is Current and frontend-integrated with the limitations below.
Assignment deletion remains excluded. Praktikan published assignment
list/detail and own `my_submission` result reads are integrated.

Current and evidenced:

- `GET /courses/{course_id}/assignments` returns all draft and published
  assignments for an assigned Asprak, ordered newest first, with
  `submissions_count`.
- `POST /courses/{course_id}/assignments` allows an assigned Asprak to create an
  assignment with title, optional description and due date, 1-1000 maximum points,
  comma-separated allowed formats, and explicit publication state.
- Both operations call the existing course-access permission dependency; write
  access requires assigned course staff.
- The create response returns the confirmed assignment with
  `submissions_count: 0` and `my_submission: null`.
- Runtime OpenAPI and inspected Pydantic schemas confirm the request and
  response fields.
- `GET /courses/{course_id}/assignments/{assignment_id}` binds the assignment
  to the authorized course and returns 404 for an unpublished assignment read
  by Praktikan.
- `PATCH /courses/{course_id}/assignments/{assignment_id}` uses unset-aware
  updates, supports explicit `null` for description and due date, and returns
  the real submission count.
- `GET /courses/{course_id}/assignments/{assignment_id}/submissions` proves the
  assignment belongs to the authorized course before returning staff-only
  submission metadata and time-limited download URLs.
- `POST /courses/{course_id}/assignments/{assignment_id}/submissions/{submission_id}/grade`
  binds course, assignment, and submission and enforces a score from zero
  through the assignment's `max_points`.
- These operations use the active-user dependency and assigned-course access
  checks. Runtime OpenAPI exposed all four operations on 2026-08-29.

Praktikan submit/resubmit backend fix added on 2026-09-02:

- `POST /courses/{course_id}/assignments/{assignment_id}/submit` is now Current
  with the following fixes applied:
- Nginx `/api/` location sets `client_max_body_size 11m` to align with the
  backend's 10 MiB limit plus multipart framing overhead.
- The route uses bounded chunked reads (64 KiB iterations, stops at the
  configured `ASSIGNMENT_MAX_UPLOAD_BYTES`) instead of buffering the entire file.
- File content is validated via magic-byte signatures (`%PDF-` for PDF,
  `PK\x03\x04` for ZIP/DOCX), consistent with the modules router pattern.
- ZIP and DOCX archives are checked for entry count (max 100), path traversal
  (`../`), and total uncompressed size (max 50 MiB) using stdlib `zipfile`.
- Uploaded filenames are sanitized to basename-only, ASCII-safe, bounded to
  200 characters. Storage keys are generated independently of user input using
  `assignments/{assignment_id}/{student_id}/{uuid4}.{ext}`.
- Database and storage changes use compensation: if the DB commit fails after
  object upload, the orphan object is deleted. Old-object cleanup failures are
  logged rather than silently swallowed.
- Concurrent submissions use `SELECT ... FOR UPDATE` to serialize access.
  `IntegrityError` from a unique-constraint race returns HTTP 409 and
  compensates by deleting the orphan object.
- Presigned URL generation failure after a successful commit returns a response
  with an empty `download_url` rather than failing the committed submission.
- Resubmission continues to clear score, feedback, grader, grading timestamp,
  and restore `status="submitted"`.
- Focused test suite in `tests/test_assignment_submit.py` covers: valid
  PDF/ZIP/DOCX, empty file, over-limit, wrong extension, extension-content
  mismatch, malformed ZIP, path traversal, unsafe filename, wrong role,
  unenrolled caller, draft assignment, wrong course, resubmission grade reset,
  late submission, and on-time submission.

Frontend integration added on 2026-08-27:

- Assignments load only after the assigned Asprak selects the Assignments tab.
- The list and create operations use same-origin `/api/` paths, HttpOnly-cookie
  authentication, typed payloads, Zod validation, React Hook Form, and a user-and-
  course-scoped TanStack Query key.
- New assignments default to draft, omit `session_id`, and allow only the
  documented PDF, ZIP, and DOCX choices.
- The UI represents loading, empty, 401, 403, 404, transient retry, validation,
  pending, success, draft/published, deadline, maximum-points, allowed-format, and
  submission-count states.
- Creation waits for confirmed server success and invalidates only the affected
  course assignment list.

Frontend detail/review integration added on 2026-08-29:

- assignment cards link to a thin, refresh-safe course/assignment route
- course workspace tabs use a validated URL query so Back to Assignments restores
  the intended tab without client-only search-param hydration
- the detail read starts only after the authenticated Asprak's assigned-course
  query proves the selected course; the submission read starts only after the
  returned assignment is bound to that course
- detail and submission caches are scoped by authenticated user, course, and
  assignment IDs, with bounded read retry and no automatic mutation retry
- create and edit reuse the same React Hook Form and Zod field controls; edit
  supports explicit description/due-date clearing and server-confirmed
  publication changes
- submission review includes bounded local NPM/email search, graded/awaiting
  filtering, time-limited download links, late/on-time state, private feedback,
  and one expanded grade form at a time
- grade validation accepts finite decimal scores from zero through the selected
  assignment maximum; confirmed responses replace only the affected submission
  cache row
- loading, empty, unauthorized, forbidden, missing/invalid resource, transient
  retry, validation, pending, success, responsive, keyboard, focus-return, and
  non-color status behavior are represented in source
- `pnpm typecheck`, `pnpm lint`, and the network-enabled production build passed
  on 2026-08-29; lint retained only three pre-existing Superadmin warnings

Praktikan integration added on 2026-09-02:

- the Praktikan Assignments tab mounts no assignment composer and displays no class-wide submission
  count or staff controls
- the refresh-safe detail route verifies enrollment before its assignment read,
  treats unpublished/missing results neutrally, and renders only the caller's
  `my_submission`, score, feedback, and time-limited download link
- the detail page accepts one assignment-configured PDF, ZIP, or DOCX file,
  performs convenience validation for non-empty content, the 10 MiB limit, and
  the allowed extension, and leaves content validation authoritative on FastAPI
- submission uses same-origin multipart `POST /api/courses/{courseId}/assignments/{assignmentId}/submit`
  through the shared HttpOnly-cookie client without overriding the browser's
  multipart content type
- the mutation has no automatic retry, represents validation/pending/error/
  success states, preserves the selected file after failure, and requires
  confirmation before replacement
- a confirmed response updates only the authenticated user's assignment detail
  and selected-course assignment-list caches with the returned `my_submission`
- resubmission messaging states that the previous file, grade, and feedback are
  replaced; an empty post-commit `download_url` is represented as saved with a
  temporarily unavailable link rather than as a failed submission
- frontend `pnpm typecheck`, focused assignment/branding lint, full lint, and
  the network-enabled production build passed after this integration on
  2026-09-02; full lint retained four warnings in unchanged Admin and
  announcement files and reported no errors or warnings in the changed files

Integration boundaries and remaining limitations:

- Assignment deletion does not yet provide proven database/storage cleanup or
  compensation semantics, so no delete control is rendered.
- Content is still held in memory (up to 10 MiB per request) after the bounded
  read. True streaming to MinIO would require a presigned-upload architecture
  change. This is acceptable for the initial scale (~200 users).
- The `allowed_file_types` column accepts an unrestricted comma-separated
  string. Extension validation is restricted to the approved PDF/ZIP/DOCX set
  by content checks, but other extensions could be configured without
  corresponding magic-byte validation.
- ZIP magic bytes alone do not prove complete DOCX structure (shared limitation
  with the modules router).
- Focused backend regression tests for cross-course isolation, explicit-null
  update, grade bounds, and storage cleanup for non-upload operations were not
  found; current integration evidence is route/schema/permission source plus
  runtime OpenAPI and existing lifecycle coverage.
- Production CSRF protection beyond the current SameSite-Lax cookie behavior is
  unresolved and was not weakened by this integration. CSRF remains a shared
  production release gate for all cookie-authenticated writes.
- Authenticated assigned-Asprak browser acceptance for assignment list/create,
  validation, draft/published creation, refresh persistence, responsive layout,
  and keyboard tab behavior was owner-reported PASS on 2026-08-27.
- Authenticated browser acceptance for detail/edit/submission review/grading is
  still pending; grading/download scenarios may be blocked when development
  data contains no real submissions.
- Authenticated Praktikan browser acceptance for valid PDF/ZIP/DOCX upload,
  resubmission grade reset, failure/retry states, and the effective limit through
  `http://localhost:8080` remains pending.

## Contract automation proposal

A later approved task should export deterministic FastAPI OpenAPI 3.1, define stable operation IDs, generate or validate TypeScript types, configure same-origin cookie transport, and fail CI on drift. This does not exist today.
