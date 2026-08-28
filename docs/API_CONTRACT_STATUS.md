# API Contract Status

Last inspected: 2026-08-28
Branch: `feature/asprak-features`

This is the integration-readiness ledger, not a release certificate. Status meanings are in [FULL_STACK_WORKFLOW.md](FULL_STACK_WORKFLOW.md).

## Summary

| Area | Status | Consumers | Next action |
| --- | --- | --- | --- |
| Cookie authentication | Partial | all roles | Aidan retains auth-guard follow-up; Bagas resolves the role-aware forced-password invariant, rate limiting, session invalidation policy, and CSRF |
| Praktikan sprint readiness | Blocked as a complete workflow; individual reads vary | Praktikan | Bagas works through [PRAKTIKAN_SPRINT_BACKEND_READINESS.md](PRAKTIKAN_SPRINT_BACKEND_READINESS.md); promote exact operations independently |
| Academic-period course list | Current and frontend-integrated for Asprak assigned-course reads | Asprak; Praktikan source read exists | Runtime-smoke role scoping and resolve Praktikan historical-access semantics |
| Roster read / enrollment and staff | Current and frontend-integrated for assigned-Asprak roster reads; Current backend contract for Superadmin writes | Asprak roster reads; Superadmin writes | Runtime-smoke roster states; correct Asprak enrollment removal; decide Praktikan-safe staff read |
| Session create/list/update/open/close | Partial | Asprak; Praktikan reads | Confirm transitions, concurrency, migrations, and focused tests |
| Safe session/course archive | Blocked | Asprak; Praktikan history | Backend retention/archive contract absent |
| Module presign/confirm/list | Partial | Asprak; Praktikan | Resolve response privacy, download lifetime, intent/cleanup, migrations, and tests |
| Module update/publish/replace/delete | Partial | Asprak; Praktikan visibility | Resolve storage/database failure and revocation semantics |
| Attendance bulk/list/personal | Current for implemented operations; Praktikan history shape Partial | Asprak; Praktikan | Confirm context-complete history, missing-record semantics, and tests |
| Grades and publication | Partial | Asprak; Praktikan | Confirm privacy transitions, concurrency, completeness, history shape, and tests |
| Assignments/submissions/results | Partial; Praktikan detail/submit Blocked | Asprak; Praktikan | Reject unpublished access and resolve upload, response privacy, grade reset, and storage integrity |
| Exports | Partial | Asprak | Confirm tests and draft/publication scope |
| OpenAPI-to-TypeScript automation | Proposed | all frontend owners | Separate tooling/CI plan |
| CSRF design | Blocked before production | all cookie writes | Bagas proposes; Aidan reviews frontend impact |
| Superadmin overview reads | Current and frontend-integrated | Superadmin | Complete browser smoke for navigation, partial failures, and role scope |

## Authentication

Implemented: login sets an HttpOnly cookie; logout deletes it; change-password returns a message; `/auth/me` returns the user; cookie is SameSite Lax and Secure in production. Browser paths add `/api`.

Frontend auth hardening added on 2026-08-27:

- login, logout, and change-password use the backend's `{ message: string }` response contract instead of a browser-readable token shape
- logout waits for confirmed backend success before clearing client authentication and cached server state
- logout failures retain the active client session, remain visible, and can be retried without claiming success
- the Praktikan-only first-login redirect predicate remains unchanged

Remaining Partial gaps:

- backend blocks every role with `force_password_change=true`, while Target is Praktikan-only
- user model defaults the flag to true
- the current auth guard conflates transient failures with 401 and can duplicate requests
- CSRF protection beyond SameSite is not defined

## Praktikan sprint readiness

Status: Blocked as a complete end-to-end workflow. Individual source-backed
reads exist, but each frontend integration must follow its exact operation status
in this ledger.

The consolidated Bagas implementation and acceptance handoff is
[PRAKTIKAN_SPRINT_BACKEND_READINESS.md](PRAKTIKAN_SPRINT_BACKEND_READINESS.md).

Confirmed source behavior includes enrollment-scoped course reads,
published-only module and assignment lists, user-scoped personal attendance,
published-only personal session grades, and a read-only profile through
`GET /auth/me`.

Blocking classes include inconsistent forced-password enforcement, ineffective
shared login throttling, known-ID unpublished assignment access, assignment
upload/resubmission/storage integrity, module response and download-lifetime
privacy, cookie-write CSRF, historical access after enrollment changes,
context-poor personal history responses, unsafe populated migration paths, and
missing negative/concurrency/fault-injection evidence.

Docker services were not running during the 2026-08-27 audit, so runtime OpenAPI,
authenticated Nginx flows, Redis behavior, MinIO behavior, and browser smoke were
not verified. Do not promote an operation from source inspection alone.

## Academic-period courses

Status: Current for the Asprak assigned-course read.

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

Implemented:

- create/list under course routes
- update by session ID
- attendance open/close
- response publication and attendance-status fields

Partial/Blocked:

- focused update/open/close tests were not found
- repeated transition statuses are inconsistent
- safe delete/archive is absent
- new non-null state fields lack documented existing-row backfill

The Asprak shell may list sessions. Do not build delete/archive UI.

## Modules

Implemented: presigned intent, confirmation, size/initial signature checks, role-scoped list, Praktikan published filter, metadata update, publish/unpublish, delete, and replacement.

Partial gaps:

- `is_published` migration backfill is undocumented
- lifecycle/visibility/replacement/delete/cleanup tests were not found
- intent consumption/replay is not documented
- ZIP magic alone does not prove DOCX structure
- database/storage ordering can report failure after one side succeeded
- abandoned/rejected/superseded/orphan cleanup requires validation
- list response now includes `course_id`, but also exposes the internal
  `file_key` to Praktikan and issues download URLs valid for up to one hour;
  response minimization and unpublish revocation semantics remain unresolved

Plan list/upload separately. Treat replacement/delete as blocked for final integration until failure semantics are resolved.

## Attendance

Bulk upsert validates active enrolled Praktikan IDs. Session reads are staff-protected and personal history is user-scoped. Tests cover deduplication, invalid students, audit fields, role denial, and missing sessions.

Status: Current for implemented bulk/list/personal operations. Open/close remains Partial under sessions.

## Grades

Implemented: bulk upsert, score validation, edit rejection while published, staff session list, publish/unpublish, and personal filtering to published sessions.

Partial gaps:

- no focused publication/privacy-transition tests found
- repeated transitions use 400 while lifecycle conflict may require 409
- route text says Asprak-only while shared permission code allows Superadmin
- complete-roster publication is undecided
- pre-publication tests require reconciliation

Plan draft grade entry separately. Do not build final publication controls until Bagas confirms roles, transitions, completeness, and tests.

## Exports

Attendance and grade CSV/XLSX routes exist for staff. Confirm tests and whether grade exports intentionally include drafts before final Asprak integration.

## Migration readiness

Recent course, grade-publication, module-publication, and attendance-status migrations add non-null fields without server defaults or staged backfills. Empty-database success does not prove a populated upgrade.

Bagas evidence required:

1. existing-row values
2. nullable/default/backfill/not-null sequence
3. populated-database upgrade test
4. safe rollback policy

## Course Stream & Announcements

Status: Current and frontend-integrated for the Asprak course Stream.

Implemented and evidenced:

- `GET /courses/{course_id}/announcements`: list stream announcements with pinned-first sorting, comment counts, and author information.
- `POST /courses/{course_id}/announcements`: create course announcement (Superadmin & assigned Asprak).
- `PATCH /courses/{course_id}/announcements/{id}`: update announcement (author or Superadmin).
- `DELETE /courses/{course_id}/announcements/{id}`: delete announcement (author or Superadmin).
- `POST /courses/{course_id}/announcements/{id}/comments`: add discussion comments (all enrolled Praktikan and assigned staff).
- `DELETE /courses/{course_id}/announcements/{id}/comments/{comment_id}`: delete comment (author or Superadmin).
- Pytest test suite in `tests/test_announcements_assignments.py` covers full lifecycle.

Frontend integration added on 2026-08-20:

- the assigned-Asprak course workspace exposes active Stream and People tabs while leaving Classwork and Sessions & Attendance visibly unavailable
- the Stream uses exact response/payload types, Zod forms, same-origin wrappers, and user-and-course-scoped TanStack Query state
- Asprak can list and create announcements, manage only their own announcement controls, add comments, and manage only their own comment controls; FastAPI remains authoritative
- writes wait for confirmed server success and invalidate only the affected course Stream instead of using optimistic destructive updates
- loading, empty, 401, 403, 404, transient-error/retry, validation, pending, confirmation, and success states are represented

Limitations:

- authenticated browser lifecycle smoke remains pending
- the list contract is unpaginated and needs a future bound for long-lived course streams
- cookie-write CSRF design remains blocked before production even though local same-origin integration is Current

## Classwork Assignments & Submissions

Status: Current and frontend-integrated only for assigned-Asprak assignment
list/create. Remaining assignment-detail, update, delete, submission, and
grading operations are Partial or Blocked.

Current and evidenced:

- `GET /courses/{course_id}/assignments` returns all draft and published
  assignments for an assigned Asprak, ordered newest first, with
  `submissions_count`.
- `POST /courses/{course_id}/assignments` allows an assigned Asprak to create an
  assignment with title, optional description and due date, 1-1000 maximum points,
  comma-separated allowed formats, and explicit publication state.
- Both operations call the existing course-access permission dependency; write
  access requires assigned course staff.
- The create response returns the confirmed assignment with `submissions_count:
0` and `my_submission: null`.
- Runtime OpenAPI and inspected Pydantic schemas confirm the request and
  response fields.

Frontend integration added on 2026-08-27:

- Classwork loads only after the assigned Asprak selects the Classwork tab.
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

Integration boundaries and blockers:

- Assignment detail, update, delete, Praktikan submission, Asprak submission
  review, and grading are not integrated.
- Praktikan detail and submission do not yet prove that unpublished assignments
  are rejected when their IDs are known.
- Submission-list and grading routes do not yet prove that the requested
  assignment belongs to the authorized `course_id`.
- Grade input is not yet bounded by the assignment's `max_points`.
- Assignment update cannot explicitly clear optional description or due-date
  values and does not return a proven accurate submission count.
- Assignment deletion does not yet provide proven database/storage cleanup or
  compensation semantics.
- The Nginx `/api/` location does not yet align its request-body limit with the
  backend's advertised 10 MiB assignment upload limit.
- Authenticated assigned-Asprak browser acceptance for assignment list/create,
  validation, draft/published creation, refresh persistence, responsive layout,
  and keyboard tab behavior was owner-reported PASS on 2026-08-27.

## Contract automation proposal

A later approved task should export deterministic FastAPI OpenAPI 3.1, define stable operation IDs, generate or validate TypeScript types, configure same-origin cookie transport, and fail CI on drift. This does not exist today.
