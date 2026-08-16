# Praktis Product Requirements

## Document status

- Product: **Praktis — Praktikum Management System**
- Original working title: Asprak Management System
- Started: June 13, 2026
- Product status: in progress
- Target release: TBD
- Product lead and Asprak/Praktikan frontend integration: Aidan
- Backend and Superadmin frontend integration: Bagas
- Last product-decision update: August 11, 2026

This document defines intended product behavior. It does not imply every requirement is implemented. `docs/API_CONTRACT_STATUS.md` records current operation-level readiness, and `docs/FULL_STACK_WORKFLOW.md` defines the integration process. Later explicit owner decisions override earlier requirements when they conflict.

## Background

Informatics practicum administration has relied on newly created email, Google Drive, and Classroom accounts with limited storage. Accounts change across semesters and years, fragmenting modules, attendance, grades, credentials, and operational ownership.

Praktis centralizes practicum administration on university-managed infrastructure and provides a durable record across academic periods.

## Product goals

- Eliminate recurring practicum storage-account creation.
- Centralize modules, attendance, grades, course offerings, and account administration.
- Reduce accidental data loss caused by fragmented account ownership.
- Reduce attendance and grade recap/export time to under one minute where feasible.
- Support active Informatics practicum classes and retain prior academic-period records.
- Provide a maintainable foundation for future practicum functionality.

## Initial operating scale

- Approximately 20 active practicum courses
- More than 200 Praktikan users in total across those courses
- Approximately 8-10 modules per course
- Multi-year retention is expected, so history APIs must be designed to become bounded as data grows

## Academic-period course model

A course record represents one practicum offering in a specific academic period. For example, DSA 2025/2026 and DSA 2026/2027 are different offerings even when they share the same subject code and name.

The target contract must distinguish academic year and term/semester. It may also need a section identifier when parallel offerings exist. Historical offerings must remain identifiable without appearing current accidentally.

Current implementation note: backend source includes academic-year, semester, and active-state fields. Migration/backfill safety, uniqueness behavior, response semantics, and focused tests must be confirmed before treating the full area as Current.

## Active roles

### Superadmin

System-level administration, user import, account management, course/enrollment/staff administration, and global configuration.

Ownership note: Bagas owns the Superadmin product area. The frontend agent must not implement it unless Aidan explicitly assigns the task.

### Asprak

For assigned practicum courses, Asprak may:

- view course offerings and rosters
- create, edit/reschedule, and safely delete or archive class sessions
- list, upload, download, edit, replace, delete, publish, and unpublish learning modules
- record attendance using `Hadir`, `Sakit`, `Izin`, and `Alfa`
- enter and correct grades
- publish, unpublish, correct, and republish grades per class session
- export or review relevant class records

Ownership note: Aidan owns this frontend product area. Backend authorization and contracts remain Bagas-owned.

### Praktikan

- authenticate using an imported account
- change the temporary password on first login when required
- view enrolled academic-period course offerings
- view or download visible modules
- view personal attendance
- view only grades from published class sessions
- view account/profile information

Ownership note: Aidan owns this frontend product area.

### Excluded role

`Dosen Pengampu` is not an application role. Do not add it without a new owner decision. A historical database enum migration does not change this product decision.

## Core features

### Authentication and user access

- Login uses a backend-managed HttpOnly session cookie.
- The first-login password rule applies only to Praktikan when `force_password_change` is true.
- Routing and navigation are role-aware.
- Logout invalidates the backend cookie before client session state is cleared.
- Backend authorization remains mandatory regardless of frontend visibility.

Current implementation gaps include frontend auth request/error handling and a backend role-invariant mismatch. They are not new product behavior.

### Student import

Superadmin can import CSV/XLSX student records, map NPM to usernames, create temporary credentials, and receive a result summary.

Temporary passwords must be unpredictable and delivered securely before a real pilot. The current predictable `Praktis{npm}` behavior is not the accepted production target. This area remains outside Aidan's default implementation scope.

### Module management

- Supported product formats are PDF and DOCX.
- Current configured maximum is 25 MiB per module.
- Asprak receives pending, success, failure, replace, delete, and visibility feedback.
- Praktikan can access only visible modules for enrolled courses.
- Backend validation must verify actual file content, authorization, size, and upload intent.
- Failed, expired, replaced, and abandoned uploads require safe object-storage cleanup.

Current source supports presign, confirmation, listing, metadata update, publish/unpublish, replace, and delete. The area remains Partial until intent ownership, actual-content validation, storage-compensation behavior, cleanup, permissions, and focused lifecycle tests are confirmed.

### Class sessions and attendance

- Asprak manages the session lifecycle for assigned courses.
- An Asprak opens a session roster and marks every student `hadir`, `sakit`, `izin`, or `alfa` on the wire.
- Status interaction updates immediately in the UI, but attendance is explicitly saved and confirmed.
- Praktikan can view personal attendance history.
- Sessions containing academic records must not be silently hard-deleted.

### Grading and publication

- Asprak enters and corrects scores per class session.
- Grades remain private drafts until the assigned Asprak publishes the session.
- Asprak may unpublish, correct, and republish.
- Praktikan sees only their own grades from published sessions.
- Published/unpublished state and transition failures must be explicit in the UI.
- Relevant records can be exported as CSV or XLSX when the backend supports the requested scope.

Current source includes per-session publication state, publish/unpublish operations, and published-only filtering for `/grades/me`. The area remains Partial until transition semantics, incomplete-roster handling, permissions, response errors, and focused privacy tests are confirmed.

## High-priority journeys

### Praktikan first login and module access

1. Login.
2. When the user is Praktikan and `force_password_change` is true, block protected application access and redirect to change-password.
3. After successful password change, enter the Praktikan dashboard.
4. View enrolled academic-period courses.
5. Open a course and view/download visible modules.

### Asprak module lifecycle

1. Open an assigned course and its module area.
2. Upload a valid file with title and description.
3. Show progress/pending state and append the confirmed module without a full-page reload.
4. Edit metadata, replace the file, publish/unpublish it, or delete it with clear confirmation and failure recovery.

### Asprak attendance recording

1. Select an assigned course and class session.
2. Open the roster.
3. Mark every student with one status.
4. Save explicitly.
5. Receive a clear success or failure result.

### Asprak grade publication

1. Enter or correct a complete session's scores.
2. Review draft grades.
3. Publish the session and receive confirmation.
4. If corrections are required, unpublish, edit, and republish.
5. Praktikan can see only their own published result.

## UX direction

- Professional, academic, clean, and speed-oriented
- Admin-dashboard layout with left navigation and right content area
- Minimal full-page loading
- Dialogs or drawers for focused creation/edit workflows when appropriate
- Responsive layouts, accessible controls, keyboard operation, and clear status messaging
- Loading, empty, error, retry, unauthorized, forbidden, and success states for data views

## Success metrics

### Primary

- No new Google Drive account is required for practicum file storage after launch.
- All active Informatics practicum offerings adopt Praktis.
- No loss of grade, attendance, or module data from fragmented ownership or unsafe lifecycle operations.

### Secondary

- Attendance/grade export completes in under one minute where one-click export is supported.
- At least 80% of Praktikan users access modules before weekly practicum sessions.
- Target critical-hours uptime is 99.9% after production infrastructure and monitoring exist.

## Out of scope for the current phase

- Dosen role
- quizzes, midterms, finals, or full LMS functionality
- secure-exam-browser behavior
- production deployment automation before the university server is provisioned
- unapproved backend or Superadmin implementation by the frontend agent
