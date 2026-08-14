# Asprak Course Detail and Roster Plan

> Plan only. Do not edit implementation files until Aidan explicitly approves this plan.

## Status

- Requested by: Aidan
- Date: 2026-08-13
- Branch: `feature/asprak-features`
- State: Implemented and validated — manual browser smoke pending
- Collaboration mode: hybrid ready-to-type; Aidan writes implementation code from small agent-generated batches, while the agent maintains approved Markdown and reviews every code batch
- Progress:
  - [x] Batch 1 — route/API/type/query foundation
  - [x] Batch 2 — assigned-course card navigation
  - [x] Batch 3 — thin dynamic route and Asprak-only detail shell
  - [x] Batch 4 — roster request-state UI and detail integration
  - [x] Batch 5 — documentation, validation, and final review

## User outcome

An authenticated Asprak can select an assigned course, open a dedicated course-detail URL, confirm the academic-period identity, and view the enrolled Praktikan roster with complete loading, empty, 401, 403, 404, transient-error, and retry states.

This is Slice 2A. Session list/create/update/open/close/delete, modules, attendance, grades, exports, backend, Superadmin, and Praktikan work are excluded. Session integration will be planned separately after its Partial contract is confirmed Current.

## Current contracts used

### Assigned course identity

- `GET /api/courses/`
- Current and already integrated
- Used to confirm the selected course belongs to the signed-in Asprak and to render `code`, `name`, `academic_year`, `semester`, and `is_active`
- There is no invented single-course endpoint

### Enrolled roster

- Backend path: `GET /courses/{course_id}/students`
- Browser path: `GET /api/courses/{courseId}/students`
- Authentication: backend-managed HttpOnly cookie through the shared client
- Authorization: Superadmin or assigned Asprak; this frontend slice enables the query only for Asprak, while FastAPI remains authoritative
- Response: array of `{ id, username, email }`; `username` is displayed as NPM
- Request body/query parameters: none
- Current source caches the roster for about 30 seconds per course
- Expected errors: 401, 403, 404, network/5xx
- Focused roster-route tests were not found; the Current ledger entry, route source, shared access helper, enrollment tests, and shared permission tests are the available evidence. Backend tests remain Bagas-owned.

## Planned code files

| File | Change |
|---|---|
| `frontend/constants/routes.ts` | Add an encoded course-detail route builder. Shared file; only Asprak consumes it in this slice. |
| `frontend/lib/api/endpoints.ts` | Add an encoded course-roster endpoint builder. |
| `frontend/features/courses/types/enrolled-student.type.ts` | Add the exact roster response type. |
| `frontend/features/courses/api/courses.api.ts` | Add the typed roster read wrapper. |
| `frontend/features/courses/constants/course-query-keys.ts` | Add a user-and-course-scoped roster key. |
| `frontend/features/courses/hooks/use-course-roster.ts` | Add the roster query with 30-second freshness and no retry for 401/403/404. |
| `frontend/features/courses/components/asprak-course-list.tsx` | Link each course offering to its dedicated detail route with visible keyboard focus. |
| `frontend/features/courses/components/asprak-course-detail-page.tsx` | Resolve current Asprak, selected assigned course, invalid/unassigned course state, detail header, and back navigation. |
| `frontend/features/courses/components/course-roster.tsx` | Render roster loading, empty, error/retry, count, and responsive student rows. |
| `frontend/app/(dashboard)/dashboard/courses/[courseId]/page.tsx` | Add a thin App Router page that passes the dynamic ID into the feature component. |

## Planned Markdown files

- `PLANS.MD`: approval, batches, and final validation
- `docs/API_CONTRACT_STATUS.md`: record the frontend roster integration after validation without changing session readiness

If another implementation file becomes necessary, stop and amend/reapprove this plan.

## Delivery batches

1. Route/endpoint builder, roster type, API wrapper, query key, and hook.
2. Course-card navigation from the existing assigned-course list.
3. Thin dynamic route and Asprak-only detail shell using the cached assigned-course query.
4. Roster request-state UI and detail integration.
5. Agent-maintained documentation plus full validation and final review.

The agent will provide code paths and snippets; Aidan types code. Corrections will identify only the culprit and smallest replacement unless Aidan explicitly authorizes a direct code fix.

## Behavior and boundaries

- Course selection uses `/dashboard/courses/{courseId}`.
- Direct entry reuses the assigned-course list; an ID absent from the Asprak result is shown as unavailable and does not start the roster request.
- A non-Asprak role does not start either Asprak detail query and receives no Superadmin/Praktikan feature behavior.
- The detail header shows course code, name, academic year, semester, and active/history status.
- The roster shows total students, NPM, and email; no enrollment mutations or private fields are exposed.
- Back navigation returns to the dashboard. Preserving the exact dashboard subsection through URL state is excluded.
- No session placeholder may imply that session lifecycle integration is ready.

## API and data impact

- Backend, database, migrations, OpenAPI, Docker/Nginx, dependencies, and server data: no changes.
- New frontend operation is read-only.
- TanStack Query owns assigned-course and roster server state; Zustand remains auth/client state only.
- Dynamic identifiers are encoded before building browser URLs.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Arbitrary URL ID bypasses frontend selection | Resolve against assigned courses before querying; FastAPI authorization remains mandatory. |
| Another user's cached roster appears | Include user ID and course ID in the query key. |
| Shared route/API files expand another role | Add only builders consumed by this Asprak slice; do not alter Superadmin/Praktikan UI. |
| Roster grows | Render the initial course-scoped size responsively; record backend pagination/search as a future bound. |
| Session Partial status is blurred | No session request, mutation, or ready-looking session control. |
| Dirty worktree is overwritten | Touch only planned files and preserve prior docs, deletions, and `frontend/Dockerfile`. |

## Performance

- Reuse the cached assigned-course query instead of introducing a single-course request.
- Start the roster query only after role and assignment resolution.
- Match the backend roster cache with 30-second frontend freshness.
- Retry a transient failure once; never retry 401/403/404.
- No redundant Zustand copy, optimistic update, new dependency, or unbounded cross-course request.

## Security and privacy

- Preserve same-origin `/api/`, `credentials: "include"`, and HttpOnly-token opacity.
- Frontend role/assignment checks control presentation/request timing only; backend access checks remain authoritative.
- Do not expose tokens, secrets, raw errors, stack traces, or fields beyond NPM/email.
- Do not change authentication, CORS, cookies, CSRF, backend permissions, or Superadmin behavior.
- No CSRF-sensitive write is introduced.

## Accessibility and responsive review

- Course links and back/retry controls have visible focus and keyboard behavior.
- Detail and roster use semantic headings/list or table structure.
- Loading/error updates use appropriate status/alert semantics.
- Active/history meaning is textual, not color-only.
- NPM/email rows remain usable at narrow mobile and desktop dashboard widths.

## Validation

- focused ESLint for changed code
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `git diff --check` and exact-file/scope review
- frontend tests: NOT AVAILABLE; no test script
- backend tests/migrations: SKIPPED; backend-owned and unchanged
- Docker checks: SKIPPED unless a runtime-only issue appears

Manual scenarios: select active/historical course; direct valid URL; invalid/unassigned ID; populated/empty roster; loading; 401/403/404; transient failure/retry; non-Asprak direct entry; keyboard focus; mobile/desktop layout; back navigation.

## Validation results

Validated on 2026-08-14:

- PASS — `pnpm typecheck`
- PASS — `pnpm lint`
- PASS — `pnpm build`; Next.js generated `/dashboard/courses/[courseId]` as a dynamic route
- PASS — exact-file scope, contract, role-boundary, security/privacy, performance, and accessibility source review
- FAIL — `git diff --check`; the owner accepted a non-functional trailing-space warning in `frontend/lib/api/endpoints.ts`
- NOT AVAILABLE — frontend automated tests; no test script exists
- SKIPPED — browser/runtime scenarios; no authenticated browser session or controlled error-state harness was available
- SKIPPED — backend tests and migrations; backend-owned, unchanged, and the test fixture can truncate configured data
- SKIPPED — Docker/Nginx checks; runtime wiring and dependencies were unchanged

The roster remains an unpaginated course-scoped list. This is acceptable for the confirmed initial scale; pagination or search requires a future backend contract if individual rosters grow substantially.

## Rollback

Owner-managed Git rollback only. Removing the dynamic route/detail/roster files and reverting the route, endpoint, query, API, and course-list integration restores the existing assigned-course list. No data or runtime rollback is required.

## Approval

- [x] Aidan approves this exact Slice 2A scope
- [x] Aidan confirms ready-to-type code plus agent-maintained Markdown
- Approval notes: Approved conversationally on 2026-08-13. Deliver implementation in the five planned batches and review each owner-written code batch before continuing.
