# Bagas Backend Handoff

## Status

- Prepared for: Bagas, backend and Superadmin owner
- Product decisions approved by: Aidan
- Prepared: 2026-08-02
- Repository branch inspected: `feature/asprak-features`
- Contract status: **proposed; not implemented or approved by Bagas**

This handoff describes backend work needed before the complete Asprak and Praktikan product scope can be implemented safely. It does not authorize an agent to edit backend code, migrations, infrastructure, or Superadmin features.

## Confirmed product context

- A course is one academic-period practicum offering. DSA 2025/2026 and DSA 2026/2027 are different records.
- Asprak owns the full lifecycle of modules and class sessions for assigned courses.
- Asprak publishes grades per class session and may unpublish, correct, and republish them.
- Praktikan may see only published grades.
- Expected initial scale is about 20 courses and 200+ Praktikan users total, with 8-10 modules per course.
- Active application roles remain `superadmin`, `asprak`, and `praktikan`; `dosen` is excluded.

## Priority summary

| Priority | Work | Why |
|---|---|---|
| P0 | Academic-period courses | Required to identify offerings across years correctly. |
| P0 | Grade publish/unpublish | Required to prevent premature grade disclosure. |
| P0 | Complete module lifecycle | Required for owner-approved Asprak management scope. |
| P0 | Session update and safe deletion | Required for owner-approved Asprak session management. |
| P1 | Unpredictable temporary passwords | Required before real student onboarding. |
| P1 | Praktikan-only forced-password invariant | Align backend authorization with the product rule. |
| P1 | Effective import upload limit | Make Nginx and backend limits agree. |
| P2 | Pagination and index review | Support retained multi-year data efficiently. |
| P2 | Rate-limit and infrastructure hardening | Prepare shared-campus and production operation. |
| P2 | Legacy `dosen` enum disposition | Remove ambiguity between database history and active roles. |

## P0.1 Academic-period course identity

### Current behavior

- `courses` contains `id`, globally unique `code`, and `name`.
- The same subject code cannot be represented as a new offering in a later academic year.
- Course API responses do not identify academic year or semester.

### Confirmed target

- Each academic-period offering is a separate course record.
- A subject code may recur in different academic periods.
- Assigned/enrolled course lists expose enough period information for users to distinguish offerings.

### Proposed contract

Bagas should choose the final schema, but the frontend needs stable equivalents of:

- `code`
- `name`
- `academic_year`, formatted consistently such as `2025/2026`
- `semester` or another explicit term identifier
- optional `section` if parallel offerings must be distinguished
- an active/archive indicator when historical offerings are retained

Replace global `code` uniqueness with academic-offering uniqueness, for example `(code, academic_year, semester, section)` after confirming whether `section` is required.

Existing course create/list/session/enrollment/staff contracts should return the academic-period identity. Backfill and migration behavior are Bagas-owned decisions.

### Acceptance criteria

- DSA 2025/2026 and DSA 2026/2027 can coexist.
- Duplicate offerings for the same confirmed uniqueness tuple are rejected consistently.
- Asprak and Praktikan course lists remain role-scoped.
- Historical offerings can be retained without appearing as current by accident.
- Focused migration, uniqueness, authorization, and serialization tests exist.

## P0.2 Per-session grade publishing

### Current behavior

- Grade records contain session, student, score, and audit fields only.
- Asprak can bulk upsert and list grades for an assigned session.
- `GET /grades/me` returns every grade for the caller immediately.
- No release field, timestamp, actor, publish endpoint, or release test exists.

### Confirmed target

- Grade visibility is controlled per class session by an assigned Asprak.
- Praktikan cannot see grades while the session is unpublished.
- Asprak can publish, unpublish, correct, and republish.

### Proposed contract

Store session-level publication state, either on `class_sessions` or in an equivalent audited release record:

- `grades_published` or equivalent
- `grades_published_at`
- `grades_published_by`

Suggested browser-facing operations, subject to Bagas's naming review:

- `POST /api/grades/sessions/{session_id}/publish`
- `POST /api/grades/sessions/{session_id}/unpublish`
- existing `GET /api/grades/me`, filtered to published sessions only

Return publication state with the Asprak session/grade view so the frontend can render Draft or Published accurately.

### Behavioral rules

- Only an Asprak assigned to the session's course may publish or unpublish. Any Superadmin override requires a separate owner decision.
- Reject grade edits while published with a clear conflict response; Asprak must unpublish first.
- Publishing should be transactional and auditable.
- Proposed: reject publishing an incomplete active roster and return missing student identifiers. Confirm this rule with Aidan before implementation if partial publication is desired.
- Current grade export is staff-only and may remain a draft-review tool if Aidan confirms that behavior. It must never become accessible to Praktikan, and any future Praktikan export must include published grades only.

### Acceptance criteria

- An unpublished score never appears in `/grades/me`.
- Publishing exposes only the caller's own grades.
- Unpublishing hides them again.
- Unassigned Asprak and Praktikan users receive 403 for publication actions.
- Missing sessions return 404; invalid state transitions return a documented 409 or 422.
- Tests cover publish, unpublish, republish, incomplete roster, role boundaries, and data isolation.

## P0.3 Complete module lifecycle

### Current behavior

- Backend supports presigned upload, upload confirmation, and role-scoped listing.
- Only `.pdf` and `.docx` key extensions and object size are checked.
- There is no metadata edit, file replacement, delete, visibility state, content verification, upload-intent ownership, or abandoned-object cleanup contract.

### Confirmed target

Assigned Asprak can list, upload, download, edit metadata, replace files, delete modules, and control Praktikan visibility.

### Proposed operations

Final paths are Bagas-owned; the frontend needs equivalents of:

- metadata update for title/description
- publish/hide visibility transition
- replacement presign and confirmation tied to the existing module
- delete with coordinated database/object-storage behavior
- Asprak listing that includes drafts; Praktikan listing that includes visible modules only

### Security and lifecycle requirements

- Verify actual PDF/DOCX structure or trusted file signatures server-side; do not trust extension or browser MIME alone.
- Bind an upload intent to actor, course, allowed extension, expiry, and object key before confirmation.
- Confirm that the actor still has write access at confirmation time.
- Delete rejected oversized/invalid objects.
- Clean expired, unconfirmed objects through a documented job or lifecycle policy.
- Make replacement atomic from the user's perspective and clean the old object only after successful persistence.
- Define failure recovery when database and object-storage operations partially succeed.

### Acceptance criteria

- Unassigned Asprak cannot mutate or presign for the course.
- Hidden modules never appear in Praktikan lists.
- Replacement retains module identity and updates the downloadable object safely.
- Delete removes or schedules removal of the correct object without affecting another module.
- Tests cover invalid content, oversize files, expired/mismatched intent, authorization, visibility, replacement rollback, delete, and orphan cleanup.

## P0.4 Class-session lifecycle

### Current behavior

- Assigned Asprak can create and list sessions.
- No update/reschedule or delete/archive operation exists.
- Hard deletion currently risks cascading attendance and grade records through foreign keys.

### Confirmed target

Assigned Asprak may create, edit/reschedule, and delete sessions for assigned courses.

### Proposed behavior

- Add a session update operation for title and date.
- Permit hard deletion only for an empty session, or prefer archive/cancel behavior once attendance or grade records exist.
- Return a documented conflict when destructive deletion would remove recorded academic data.
- Keep historical records auditable and exclude cancelled/archived sessions from default active workflows as appropriate.

### Acceptance criteria

- Only assigned Asprak can mutate a session.
- Cross-course identifiers cannot be combined to bypass access checks.
- Empty-session deletion behavior is documented and tested.
- Sessions containing attendance or grades cannot silently cascade-delete academic records.
- Update, archive/delete, conflict, not-found, and authorization tests exist.

## P1 Pre-pilot security and integration

### Temporary passwords

Current import passwords use the predictable pattern `Praktis{npm}`. Replace this with cryptographically random temporary credentials and define a secure delivery process. Continue forcing Praktikan password change, but do not treat forced change as protection against first-login account takeover.

### Forced-password role invariant

The product rule is Praktikan-only, but `get_current_active_user` blocks any role whose flag is true and the user model defaults the flag to true. Enforce one invariant across account creation, backend dependencies, frontend routing, and tests.

### Import body-size limit

The backend accepts up to 5 MiB, while the Nginx `/api/` location has no matching repository-defined limit. Configure and test an effective proxy limit that permits the backend policy without weakening the separate 25 MiB module policy.

## P2 Scale and production hardening

- Add bounded history contracts before retained multi-year attendance/grade data grows substantially.
- Review indexes for `class_sessions.course_id`, `modules.course_id`, `attendances.student_id`, and `grades.student_id`, plus actual query plans.
- Review five-login-attempts-per-IP for shared campus/NAT traffic and document Redis fail-open behavior.
- Use least-privilege MinIO application credentials rather than root credentials in production.
- Bind local-only published ports explicitly or remove unnecessary host exposure for production.
- Decide how to handle the historical PostgreSQL `dosen` enum value without destructive or unsafe migration shortcuts.

## Frontend sequencing impact

Frontend work that can proceed without these new contracts:

- approved auth/dependency stabilization
- shared dashboard structure and design work
- integration against already confirmed attendance/export contracts

Frontend work that should wait for Bagas confirmation:

- final academic-period course cards and filters
- full module management
- session edit/delete behavior
- grade release controls
- Praktikan published-grade views

Do not invent temporary frontend-only publication, deletion, visibility, or academic-period behavior. Frontend role checks remain presentation only; backend authorization is required.

## Requested response from Bagas

For each P0 item, please return:

1. accepted or revised data model
2. accepted or revised endpoint paths and methods
3. request and response schemas
4. authorization and state-transition rules
5. error-status contract
6. migration/backfill approach
7. test coverage and expected delivery order

Once confirmed, Aidan can create owner-approved frontend plans against the real contracts.
