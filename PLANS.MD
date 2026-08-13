# Asprak Assigned-Course List Plan

> Plan only. Do not edit implementation files until Aidan explicitly approves this plan and direct-edit mode.

## Status

- Requested by: Aidan
- Date: 2026-08-13
- Branch: `feature/asprak-features`
- State: Complete — approved implementation and available automated validation finished
- Collaboration mode: hybrid ready-to-type; Aidan writes all implementation code from agent-generated batches, while the agent directly maintains approved Markdown files and reviews each code batch before continuing
- Backend confirmation: Aidan reported Bagas confirmed the assigned-course contract, populated-database safety, response stability, semester values, and Asprak authentication behavior are safe to integrate.

## User outcome

An authenticated Asprak can open **My Practicum Classes** in the existing dashboard and see only their assigned academic-period course offerings, separated into active and historical sections with useful loading, empty, forbidden/session, transient-error, and retry states.

This is the first dependency slice. Course-detail navigation, roster, sessions, modules, attendance, grades, reports, Praktikan behavior, Superadmin behavior, and backend changes are not part of this plan.

## Confirmed contract

### Current for this slice

- Method/backend path: `GET /courses/`
- Browser path: `GET /api/courses/`
- Authentication: backend-managed HttpOnly cookie; frontend preserves `credentials: include`
- Authorization: Bagas's backend returns only `CourseStaff`-assigned courses for an authenticated `asprak`
- Response: `CourseResponse[]`
- Fields: `id`, `code`, `name`, `academic_year`, `semester`, `is_active`
- Semester wire values for integration: `Ganjil | Genap`
- Errors used by the UI: 401 unauthenticated/expired session, 403 forbidden/gated, 5xx/network transient failure
- Request body: none
- Pagination/filter query parameters: none in the confirmed contract

### Explicitly not inferred

- The frontend does not receive or evaluate staff-assignment records itself.
- Frontend role checks do not replace backend authorization.
- No course-detail endpoint, mutation, pagination, or filtering contract is invented.

## Approved-scope files

| File | Planned change |
|---|---|
| `PLANS.MD` | Record this plan, approval, and final validation results. |
| `docs/API_CONTRACT_STATUS.md` | Move the academic-period course-list operation to Current for the confirmed scope and record Bagas's owner confirmation/date without overstating other course operations. |
| `frontend/lib/api/endpoints.ts` | Add the same-origin course-list endpoint constant. Shared file; new entry is consumed only by the Asprak feature in this slice. |
| `frontend/features/courses/types/course.type.ts` | Add the exact confirmed `Course` and `Semester` TypeScript types. |
| `frontend/features/courses/api/courses.api.ts` | Add a typed read-only wrapper around the shared API client. |
| `frontend/features/courses/constants/course-query-keys.ts` | Add a stable query-key factory for assigned courses. |
| `frontend/features/courses/hooks/use-assigned-courses.ts` | Add TanStack Query behavior with bounded retry that does not retry confirmed 401/403 responses. |
| `frontend/features/courses/components/asprak-course-card.tsx` | Render one accessible academic-period offering and active/history status. |
| `frontend/features/courses/components/asprak-course-list.tsx` | Render grouped active/history results plus loading, empty, error, and retry states. |
| `frontend/features/dashboard/components/role-dashboard.tsx` | Replace only the Asprak `classes` placeholder with the live list; preserve Superadmin and Praktikan behavior. |

If implementation evidence requires any additional file, stop and amend/reapprove this plan before editing it.

## Implementation sequence

1. Record the confirmed course-list scope as Current in the contract ledger.
2. Add the endpoint constant and exact response types.
3. Add the feature API wrapper and query-key factory.
4. Add the query hook with one transient retry and no retry for 401/403.
5. Build the course card and grouped list states.
6. Mount the list only when `user.role === asprak` and `activeItem.id === classes`.
7. Preserve placeholders for every other role/navigation item.
8. Run validation and review the complete diff for ownership/scope drift.

## UI behavior

- Active offerings appear before historical offerings.
- Each card shows course code, name, academic year, semester, and active/history status.
- Loading uses a stable skeleton/status region without a full-page navigation.
- Empty state explains that no assigned course is available and points the user to the administrator responsible for assignments.
- 401 explains that the session expired and directs the user to sign in again without exposing token details.
- 403 explains that access is unavailable without implying the frontend is the authorization source.
- Network/5xx errors remain visible and retryable.
- No course card implies a detail page or mutation that is not implemented in this slice.

## API and data impact

- Backend/API/database/migrations/OpenAPI: no changes.
- Frontend adds a read-only consumer of the confirmed response.
- Server state stays in TanStack Query; no course data is copied into Zustand.
- Cache key is user-session scoped by logout behavior; no optimistic updates or invalidation are needed for a read-only list.

## Assumptions

- Bagas's confirmation relayed by Aidan is authoritative for the stated contract and migration/auth readiness.
- The backend continues to enforce Asprak assignment scope.
- The initial expected scale (about 20 active courses total) permits rendering the assigned result without frontend pagination.
- Existing documentation changes, two owner deletions, and the pre-existing `frontend/Dockerfile` modification must be preserved.
- No new dependency or automated-test framework is needed.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| A shared dashboard edit changes other roles | Gate the new content on both Asprak role and the `classes` item; manually verify all other items retain their current output. |
| A stale session causes repeated requests | Do not retry 401/403; present a clear session/access state. |
| Backend response drifts | Use exact types from the confirmed schema and update the ledger; future OpenAPI generation remains separate work. |
| Historical results grow without a bound | Accept the confirmed initial scale; record pagination/history bounding as a future contract concern. |
| Frontend appears to authorize assignments | Never filter from global data or trust client role checks; consume the backend-scoped list only. |
| Dirty-worktree changes are overwritten | Patch only approved files and inspect the final diff by path. |

## Performance review

- One query when the Asprak opens `classes`; no request for other roles or inactive dashboard items.
- Use TanStack Query caching and avoid a duplicate Zustand copy.
- Avoid unnecessary global state and new client boundaries beyond the existing client dashboard.
- Render the confirmed small result directly; note future history bounding rather than adding premature virtualization.
- Confirm retry cannot create a request loop.

## Security and privacy review

- Preserve `/api/` same-origin routing and `credentials: include`.
- Never read, store, log, or display the HttpOnly token or authentication payload.
- Treat backend assignment checks as the authorization boundary.
- Do not expose raw backend objects, stack traces, or private environment values.
- Do not change CORS, cookies, CSRF behavior, role checks, backend code, or Superadmin UI.
- This read-only request adds no new CSRF-sensitive mutation.

## Accessibility and responsive review

- Use semantic headings/list structure and meaningful status labels.
- Expose loading/error updates through an appropriate status region.
- Retry/sign-in controls must be keyboard accessible with visible focus behavior.
- Cards must remain readable at narrow mobile widths and desktop dashboard widths.
- Do not rely on color alone for active/history meaning.

## Validation plan

Report every result as PASS, FAIL, SKIPPED, or NOT AVAILABLE:

1. Narrow TypeScript/ESLint inspection of changed files when available.
2. `pnpm typecheck` from `frontend/`.
3. `pnpm lint` from `frontend/`.
4. `pnpm build` from `frontend/`.
5. Frontend automated tests: NOT AVAILABLE because no `test` script exists.
6. Backend tests/migrations: SKIPPED; backend-owned and no backend change.
7. Docker checks: SKIPPED unless implementation reveals a runtime-only integration issue; no service/config change is planned.
8. `git diff --check` and changed-file/scope review.

Manual scenarios:

- Asprak with active and historical assigned courses
- Asprak with no assigned courses
- loading state
- expired/unauthenticated response
- forbidden response
- transient network/server failure and successful retry
- Superadmin and Praktikan dashboard content remains unchanged
- other Asprak navigation items remain placeholders
- narrow mobile and normal desktop layout
- keyboard focus and retry/sign-in operation

## Rollback

Frontend/documentation-only and owner-managed through Git. Removing the new feature files and reverting the two approved integration points restores the placeholder. No runtime data, backend, migration, dependency, storage, or infrastructure rollback is required.

## Approval

- [x] Aidan approves this exact scope
- [x] Aidan selected ready-to-type implementation guidance for code and direct agent edits for Markdown
- Approval notes: Approved conversationally on 2026-08-13. Deliver code in small batches with exact file paths and review each owner-written batch before continuing. The agent continuously maintains Markdown files within the approved scope.
- Implementation exception: Aidan explicitly authorized the agent to directly correct only the identified Batch 3 UI defects before returning to owner-written code for Batch 4.

## Completion and validation

- PASS — focused ESLint for the Batch 1-3 course/API files
- PASS — `pnpm typecheck`
- PASS — `pnpm lint`
- PASS — `pnpm build`
- PASS — `git diff --check`
- PASS — final scope, role-gating, same-origin credentials, token-storage, direct-backend-call, unsafe-HTML, and server-state ownership review
- NOT AVAILABLE — frontend automated tests; no `test` script exists
- SKIPPED — backend tests and migrations; backend-owned and no backend change
- SKIPPED — Docker checks; no service, dependency, or configuration change
- SKIPPED — interactive browser/manual scenarios; not executed in this ready-to-type batch session

Implemented scope: the Asprak `My Practicum Classes` item now consumes the confirmed assigned-course read through typed feature APIs and TanStack Query, rendering loading, empty, 401, 403, transient-error/retry, active, and historical states. Course-detail navigation remains the next separately planned slice.
