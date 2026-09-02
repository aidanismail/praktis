# Praktikan Assignment Submission Resolution Record

Status: Resolved on 2026-09-02
Current contract authority: [`API_CONTRACT_STATUS.md`](API_CONTRACT_STATUS.md)

## Outcome

The earlier absolute blocker for Praktikan assignment submit/resubmit is
resolved. Bagas's backend and Nginx changes made the existing operation Current,
and the Praktikan frontend now integrates it. This document is retained as a
resolution record so the former blocker is not accidentally reported as active.

No additional Bagas-owned work is created by this resolution record.

## Confirmed operation

| Item | Current behavior |
| --- | --- |
| Browser operation | `POST /api/courses/{courseId}/assignments/{assignmentId}/submit` |
| FastAPI operation | `POST /courses/{course_id}/assignments/{assignment_id}/submit` |
| Request | `multipart/form-data` with one `file` field |
| Caller | Active, enrolled `praktikan` |
| Assignment | Must belong to the path course and be published |
| Formats | Assignment-configured intersection of PDF, ZIP, and DOCX |
| Application limit | 10 MiB |
| Proxy allowance | 11 MiB for `/api/`, including multipart overhead |
| Success | HTTP 200 `SubmissionResponse` |
| Resubmission | Replaces the current file and clears stale score, feedback, grader, and grading time |

The backend now performs bounded reads, signature/archive validation, bounded
filename sanitization, generated storage keys, database/storage compensation,
conflict handling, and post-commit presigned-URL fallback. The API ledger lists
the remaining non-blocking limitations.

## Current frontend workflow

```text
Dashboard
  -> enrolled course
    -> Assignments
      -> published assignment
        -> enrollment-gated detail
          -> private current submission/result
          -> upload or confirmed replacement
            -> same-origin multipart request
              -> returned submission updates scoped detail/list caches
```

The frontend:

- uses the shared `/api/` client with `credentials: "include"`
- lets the browser set the multipart boundary instead of setting
  `Content-Type` manually
- validates non-empty files, the 10 MiB limit, and the assignment's supported
  extension as a convenience; FastAPI remains authoritative for content and
  authorization checks
- disables duplicate submission while the mutation is pending and performs no
  automatic mutation retry
- preserves the selected file after failure and maps expected 400, 401, 403,
  404, 409, 413, and 422 outcomes
- asks for confirmation before resubmission because the previous file and
  grading state are replaced
- treats an empty returned `download_url` as a saved submission whose link is
  temporarily unavailable
- displays only the authenticated Praktikan's `my_submission`

## Verification boundary

Source inspection, runtime OpenAPI, same-origin unauthenticated size probes, and
frontend static checks support the integration. Authenticated browser acceptance
with representative PDF, ZIP, and DOCX files remains a release verification
step; it is not a new backend implementation request.

Backend Pytest was not run during frontend integration because the test fixture
executes `TRUNCATE ... CASCADE` and `TEST_DATABASE_URL` was not independently
verified as disposable test-only data.
