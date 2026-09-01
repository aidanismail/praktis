# Praktikan Assignment Submission — Absolute Backend Blocker Handoff

- Last audited: 2026-09-02
- Branch audited: `feature/praktikan-features`
- Frontend/product owner: Aidan
- Backend, Nginx, storage, database, and backend-test owner: Bagas
- Contract status: `Partial/Blocked` for safe frontend integration
- Runtime entry point: `http://localhost:8080`

## Message for Bagas

The Praktikan assignment submit/resubmit frontend cannot be integrated safely yet.

The FastAPI route exists, but route existence is not enough to classify this workflow as Current. The normal browser path through Nginx rejects uploads well below the backend's advertised 10 MiB limit, and the upload route still has file-validation, filename, database/storage recovery, concurrency, and test-evidence gaps.

Please treat this as one bounded assignment-upload contract fix. The frontend can already list published assignments, open assignment details, and show the current Praktikan's historical submission/result. Aidan deliberately did not add an upload endpoint constant, API wrapper, mutation hook, form, or submit/resubmit button.

The frontend integration can resume only after the acceptance evidence in this document is available and `docs/API_CONTRACT_STATUS.md` is updated to reflect the verified Current operation.

## Executive verdict

**Stop only the Praktikan assignment submit/resubmit integration.**

The read-only Praktikan assignment workflow can continue and is already represented in the frontend. No other existing endpoint is an absolute blocker for the approved Praktikan branch scope.

Other unavailable capabilities are classified separately near the end of this document. They are not automatically assigned to Bagas as part of this handoff.

## Confirmed current backend contract

| Item | Current behavior |
| --- | --- |
| Browser operation | `POST /api/courses/{courseId}/assignments/{assignmentId}/submit` |
| FastAPI operation after Nginx prefix stripping | `POST /courses/{course_id}/assignments/{assignment_id}/submit` |
| Authentication | Backend-managed HttpOnly cookie through the shared same-origin client |
| Caller | Active `praktikan` only |
| Course authorization | Caller must have course access through current enrollment |
| Assignment authorization | Assignment must belong to the path course and be published |
| Request | `multipart/form-data` with one field named `file` |
| Advertised formats | PDF, ZIP, or DOCX; the actual accepted extensions come from the assignment's comma-separated `allowed_file_types` value |
| Advertised application limit | 10 MiB |
| Success response | HTTP 200 with `SubmissionResponse` |
| Late handling | The route compares the submission time with `due_date` and sets `is_late` |
| First submission | Creates one `Submission` row and uploads one MinIO object |
| Resubmission | Reuses the existing row, replaces its object reference, updates timestamps/late state, and clears score, feedback, grader, and grading time |
| Download | The response builder generates a time-limited presigned download URL |

Primary source:

- `backend/api/routers/assignments.py`
- `backend/schemas/assignment.py`
- `backend/models/assignment.py`
- `nginx/default.conf`

## Why this is an absolute blocker

### 1. The real browser upload limit contradicts the 10 MiB API contract

The assignment submission request goes through Nginx's `location /api/`.

That location has no assignment-specific `client_max_body_size`. The separate `client_max_body_size 30m` setting belongs to `location /praktis-modules/` and does not apply to assignment submissions.

Live same-origin probes through `http://localhost:8080/api/...` on 2026-09-02 produced:

| Multipart file size | Observed response | Meaning |
| --- | --- | --- |
| 512 KiB | HTTP 401 | The request reached FastAPI and was rejected by authentication, as expected for the unauthenticated probe. |
| 2 MiB | HTTP 413 | Nginx rejected the request before FastAPI authentication or upload validation ran. |

This proves that a normal assignment file can fail before reaching the backend and that the advertised 10 MiB upload cannot work end to end. Multipart overhead must also be accounted for when aligning the proxy and application limits.

This alone is a functional blocker.

### 2. The route buffers the complete file before enforcing its limit

The route currently runs:

`content = await file.read()`

It then checks `len(content)` against 10 MiB.

Therefore the OpenAPI description saying the route “directly streams” to MinIO is inaccurate. The complete untrusted payload is retained in application memory before the application-size decision. Under concurrent submissions, memory usage grows with the number and size of uploads.

The route needs a bounded read/streaming strategy that stops accepting data after the permitted limit rather than reading the entire upload first.

### 3. File validation checks only the filename extension

The current validation extracts the suffix from `file.filename` and compares it with `assignment.allowed_file_types`.

It does not prove that:

- a `.pdf` file is a PDF
- a `.docx` file is a valid DOCX ZIP package
- a `.zip` file is a valid and acceptable ZIP archive
- the content matches its claimed extension or MIME type
- an archive satisfies an approved entry-count, path, compression, or uncompressed-size policy

The assignment create/update schema also accepts `allowed_file_types` as an unrestricted comma-separated string. Extension-only validation must not be described as actual PDF/DOCX/ZIP content validation.

This is a file-upload security boundary, not merely a frontend validation concern. The frontend may provide convenience checks, but backend validation remains authoritative.

### 4. Original filenames are not normalized or bounded safely

The object key currently includes the raw uploaded filename:

`assignments/{assignment_id}/{student_id}/{uuid}_{file.filename}`

The same filename is written to `Submission.file_name`.

Current database limits are:

- `file_name`: 255 characters
- `file_key`: 500 characters

The route does not normalize the basename, constrain characters, or ensure both persisted values fit those limits before uploading. An overlong or problematic filename can therefore create an object first and then fail during database persistence, leaving an orphan.

A generated storage key should not depend on an unbounded user-controlled path-like value. A sanitized, bounded display filename can be stored separately.

### 5. Database and object-storage changes are not recoverable as one workflow

The new object is uploaded before the database commit. There is no compensation path that deletes the new object if the database operation or response construction fails.

Current failure risks include:

- a database commit failure after object upload leaves an unreferenced object
- a presigned-response failure after a successful commit can return an error even though the submission changed
- old-object deletion happens after commit, but deletion exceptions are swallowed, so a replaced object can remain orphaned
- there is no durable reconciliation mechanism for objects left behind by partial failures

Post-commit deletion is safer than deleting the old object before commit, but it does not by itself make the operation recoverable.

### 6. Concurrent submissions are not serialized or handled deterministically

The database has a unique constraint on `(assignment_id, student_id)`, but the route does not lock the existing row, provide idempotency, perform a conflict-safe upsert, or handle the unique-constraint race.

Two concurrent first submissions can both upload objects and both attempt to create the same logical submission. One request can fail at commit and leave its uploaded object orphaned.

Concurrent resubmissions can also upload multiple new objects, race to update the same row, and leave the losing object's file unreferenced.

The accepted behavior must be deterministic: one current submission row, one referenced current object, no stale grade, and a documented response for the losing/conflicting request.

### 7. Focused upload evidence is absent

The existing assignment test inserts a `Submission` directly into the database before testing staff list/grading behavior. It does not exercise the multipart submit route.

Focused evidence was not found for:

- effective limits through Nginx
- empty and over-limit payloads
- real content versus extension mismatch
- malformed PDF, DOCX, or ZIP files
- unsafe and overlong filenames
- storage failure
- database failure after upload
- concurrent first submissions
- concurrent resubmissions
- orphan compensation and cleanup
- stable 413/validation response semantics

Backend Pytest was not run during this audit because its fixture executes `TRUNCATE ... CASCADE`, and `TEST_DATABASE_URL` was not independently verified as disposable test-only data.

### 8. Cookie-write CSRF remains a shared production gate

Assignment submit/resubmit is a cookie-authenticated write. The project still has no completed production CSRF token design or validated Origin/Referer policy beyond the current SameSite-Lax cookie behavior.

This is a cross-cutting production security gate rather than a second assignment-specific endpoint defect. A fix must preserve HttpOnly cookies and same-origin `/api/` routing.

## Current fixes that should not be repeated as stale work

The current source is better than the older `docs/PRAKTIKAN_SPRINT_BACKEND_READINESS.md` audit in several places:

- empty files are rejected
- only published assignments can be submitted by Praktikan
- assignment and course IDs are bound in the assignment query
- the boto3 `put_object` call is offloaded with `asyncio.to_thread`
- resubmission clears score, feedback, grader, grading timestamp, and restores `status="submitted"`
- the old object is deleted only after a successful database commit

These are already implemented. They should be preserved and tested, not reported to Bagas as missing.

Remaining risk after those improvements:

- the full file is still buffered
- validation is still extension-only
- filename handling is still unsafe/unbounded
- a new object still has no compensation if later work fails
- cleanup failure is still swallowed
- concurrent submissions remain unsafe
- the Nginx and backend limits still disagree
- focused upload evidence is still absent

## Current frontend workflow

### User journey

```text
Dashboard
  -> My Practicum Classes
    -> enrolled course
      -> course workspace
        -> Classwork
          -> published assignment card
            -> assignment detail
              -> published metadata
              -> my existing submission/result only
```

The Praktikan can currently:

- see assignments returned by the enrollment-scoped, published-only list
- open a refresh-safe assignment detail route
- see title, instructions, due date, maximum points, and advertised formats
- see only their own `my_submission`
- see filename, size, submitted time, late/on-time state, status, score, private feedback, grading time, and a time-limited download link when present
- see a neutral “No recorded submission” state when no historical submission exists

The Praktikan cannot currently submit or resubmit from the UI, by design.

### Code path

| Layer | File | Current responsibility |
| --- | --- | --- |
| Thin route | `frontend/app/(dashboard)/dashboard/courses/[courseId]/assignments/[assignmentId]/page.tsx` | Resolves route parameters and mounts the feature gateway. |
| Role gateway | `frontend/features/assignments/components/assignment-detail-page.tsx` | Selects Asprak or Praktikan presentation from the authenticated user role. |
| Praktikan enrollment gate | `frontend/features/assignments/components/praktikan-assignment-detail-page.tsx` | Uses the enrolled-course query first and does not enable the assignment read until the course is verified. |
| Assignment query | `frontend/features/assignments/hooks/use-course-assignments.ts` | Runs the user/course/assignment-scoped TanStack Query detail read. |
| Typed API read | `frontend/features/assignments/api/assignments.api.ts` | Calls the current assignment detail endpoint through the shared client. |
| Endpoint builder | `frontend/lib/api/endpoints.ts` | Builds same-origin assignment list/detail/staff-operation paths. |
| Shared transport | `frontend/lib/api/client.ts` | Sends same-origin `/api/` requests with `credentials: "include"`. |
| Result presentation | `frontend/features/assignments/components/praktikan-submission-summary.tsx` | Displays only the caller's existing submission and private result state. |
| Classwork entry | `frontend/features/assignments/components/course-classwork.tsx` and `assignment-card.tsx` | Shows published classwork and links Praktikan to the detail route without staff controls. |

### Deliberately absent frontend integration

There is no Praktikan:

- submit/resubmit entry in `API_ENDPOINTS`
- multipart submission function in `assignments.api.ts`
- TanStack mutation hook for assignment upload
- file-selection schema or form
- upload progress/pending/error/success UI
- submit or resubmit button

This keeps the browser from advertising a workflow the current backend path cannot fulfill safely.

After the backend contract is verified Current, the frontend insertion point is the existing Praktikan assignment detail feature. It should continue using the same architecture:

```text
thin App Router page
  -> role gateway
    -> Praktikan feature component
      -> scoped TanStack Query mutation
        -> typed feature API wrapper
          -> API_ENDPOINTS
            -> apiClient with credentials: "include"
              -> same-origin /api/
                -> Nginx
                  -> FastAPI authorization and validation
```

Frontend visibility will never replace backend RBAC, enrollment, publication, size, or content enforcement.

## Required outcome before frontend integration resumes

Bagas does not need to redesign unrelated Praktikan features for this handoff. The assignment submission operation is unblocked when all of the following are evidenced:

### Proxy and error contract

- The Nginx `/api/` upload allowance and FastAPI maximum are intentionally aligned, including multipart overhead.
- A valid file at the supported maximum succeeds through `http://localhost:8080/api/...`.
- An over-limit request receives a stable, documented response, preferably HTTP 413.
- The frontend is not required to call port 8000 or MinIO directly.

### Bounded and content-aware validation

- The application stops reading once the accepted maximum is exceeded.
- Empty payloads remain rejected.
- Accepted extensions are restricted to the owner-approved set.
- Backend validation checks meaningful file content, not only the suffix.
- DOCX and ZIP handling includes archive safety limits appropriate to the accepted policy.
- Validation failures do not create storage objects or database rows.

### Filename and storage safety

- The display filename is normalized and bounded before persistence.
- The object key is generated independently of an unbounded raw filename.
- Database field lengths are validated before upload/commit.
- No credential, private bucket detail, or internal key is exposed unnecessarily.

### Recoverable state changes

- A database failure after object upload compensates or records the object for guaranteed reconciliation.
- A storage failure cannot create or mutate the submission row.
- Failed old-object cleanup is observable and recoverable rather than silently forgotten.
- Response-signing failure does not make a committed submission ambiguous to the caller.
- Resubmission continues to clear all stale grading state.

### Concurrency

- Concurrent first submissions cannot produce a 500 plus an orphan.
- Concurrent resubmissions have deterministic winner/conflict semantics.
- Exactly one current row and one referenced current object remain after the race.
- Expected conflicts use a documented response rather than an unhandled database exception.

### Focused evidence

Run only against an explicitly verified disposable test database:

- active Praktikan, wrong role, unenrolled caller, wrong course, missing assignment, draft assignment
- valid PDF/DOCX/ZIP according to the approved policy
- empty, malformed, extension-mismatched, unsafe-name, overlong-name, and over-limit uploads
- just-below, at, and just-above the effective limit through Nginx
- first submission and resubmission
- late and on-time state
- resubmission grade/feedback reset
- storage and database fault injection
- concurrent first submission and resubmission
- orphan/reconciliation behavior

Record each result as PASS, FAIL, or SKIPPED. Reconcile runtime OpenAPI and `docs/API_CONTRACT_STATUS.md` with the observed operation.

## Definition of Current for this operation

Aidan can resume frontend upload integration when:

1. the advertised supported file size works through Nginx at port 8080
2. larger and invalid files fail predictably without excessive buffering
3. file content and filename handling satisfy the approved security policy
4. storage and database partial failures do not leave ambiguous state
5. concurrent submissions are deterministic
6. focused automated and same-origin runtime evidence passes
7. the API contract ledger classifies this exact operation as Current with any remaining non-blocking limitations stated explicitly

A route appearing in source or OpenAPI is not sufficient on its own.

## Is anything else blocked?

For the approved `feature/praktikan-features` scope, **assignment submit/resubmit is the only absolute existing-endpoint blocker**.

| Capability | Current classification | Does it block this branch? |
| --- | --- | --- |
| Published assignment list/detail and own result | Current and frontend-integrated read-only | No |
| Assignment submit/resubmit | Existing endpoint, `Partial/Blocked` | **Yes — the only absolute feature blocker in the locked scope** |
| Praktikan attendance self-check-in | No student-owned write endpoint; not explicitly required by the current Praktikan PRD | No. It is a future product/contract decision, not part of this Bagas handoff. |
| Course People roster | Student roster endpoint explicitly returns 403 for Praktikan | No. Current branch preserves roster privacy and shows only the caller's membership context. |
| Assigned-Asprak directory for Praktikan | Current staff-list operation is Superadmin-only | No. This needs an explicit minimum-data product/privacy decision before any new contract. |
| Profile identity/email editing | No self-profile update endpoint; current PRD requires viewing account/profile information | No. The current read-only profile satisfies the stated Praktikan requirement. |
| Praktikan CSV/XLSX exports | Export endpoints intentionally reject Praktikan; export is an Asprak workflow | No |
| Draft/unpublished modules or grades | Intentionally inaccessible to Praktikan | No. This is required privacy behavior. |
| Staff creation, attendance recording, grading, publication, or administration controls | Forbidden to Praktikan by RBAC | No. These controls must remain absent. |
| Production CSRF protection | Shared cookie-write security gap | Not a second UI feature, but still a production release gate for assignment submission and other writes. |

Therefore Bagas can focus on the bounded assignment upload contract above. The other rows are context, exclusions, or future owner decisions—not extra work silently added by this document.

## Evidence limitations

- The upload probes were unauthenticated on purpose and contained no credentials. Their purpose was to identify whether the request reached FastAPI or was rejected by Nginx first.
- No successful authenticated upload was claimed.
- No backend test was run because the destructive test database target was not proven disposable.
- No backend, Nginx, storage, database, migration, frontend runtime, dependency, or Superadmin code was changed for this handoff.
- `docs/API_CONTRACT_STATUS.md` remains the operation-status authority. This document explains the evidence and acceptance boundary; it does not promote the operation to Current.
