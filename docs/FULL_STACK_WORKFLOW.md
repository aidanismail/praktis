# Full-Stack Workflow

Canonical vendor-neutral workflow for Praktis frontend/backend work.

## Ownership

| Work | Owner |
|---|---|
| Product direction and acceptance | Aidan |
| Asprak and Praktikan frontend integration | Aidan |
| Backend, API/data contracts, migrations, infrastructure, backend tests | Bagas |
| Superadmin frontend integration | Bagas |
| Git write/history actions | Aidan |

Shared auth, API plumbing, layouts, and design-system code must name affected role consumers. Shared location does not erase role ownership.

## Authority

When evidence conflicts:

1. explicit current owner decision
2. [DECISIONS.md](DECISIONS.md)
3. backend routes, schemas, permissions, migrations, tests, and runtime OpenAPI for Current API behavior
4. [API_CONTRACT_STATUS.md](API_CONTRACT_STATUS.md) for readiness
5. [PRD.md](PRD.md) for Target behavior
6. approved root `PLANS.MD` for execution scope

Source existence does not prove migration safety, complete authorization, test coverage, failure recovery, or production readiness.

## Status vocabulary

| Status | Meaning | Integration action |
|---|---|---|
| Current | Implemented and evidenced for the stated scope | May plan integration |
| Partial | Implementation exists but material safety, tests, auth, errors, or lifecycle work remains | Limit or stop affected integration |
| Proposed | Shape is suggested but not confirmed by Bagas | Do not build against it |
| Blocked | A contract, decision, migration, or security dependency prevents progress | Stop and record owner/next action |

Update the status ledger whenever readiness changes.

## Contract-first lifecycle

1. Name the smallest user outcome, role consumer, owner, and collaboration mode.
2. Inspect the diff and preserve unrelated changes.
3. Verify backend method/path, browser `/api/` path, request/response models, authorization, transitions, errors, bounds, migrations, tests, and runtime OpenAPI when available.
4. Record the contract as Current, Partial, Proposed, or Blocked.
5. For a gap, record Current evidence, Target behavior, Proposed shape, roles, transitions, errors, limits, migration impact, acceptance criteria, security/performance impact, tests, owner, and next action.
6. Replace root `PLANS.MD` and wait for Aidan's approval.
7. Implement only the approved files and role scope.
8. Validate and update documentation/status with the same change.

Product requirements never prove an endpoint exists. Frontend-only authorization, publication, visibility, academic identity, or destructive lifecycle substitutes are forbidden.

## Frontend integration

```text
thin app route
  -> feature component
    -> feature hook
      -> feature API wrapper
        -> shared API client
          -> /api/... through Nginx
```

- Preserve same-origin `/api/`, `credentials: include`, and HttpOnly-token opacity.
- Use precise types from confirmed evidence; do not invent or silently coerce fields.
- OpenAPI-generated or CI-validated TypeScript types are Proposed, not implemented.
- Use Zod/React Hook Form for input, TanStack Query for server state, and Zustand only for genuine client state.
- Define stable query-key factories; choose freshness/retry intentionally.
- Do not retry confirmed 401, 403, validation, or conflict responses.
- Expose transient failures and retry; prevent duplicate submissions.
- Invalidate only affected keys and clear user-scoped data only after confirmed logout.
- Avoid optimistic publication, deletion, or storage updates until rollback is proven.
- Implement loading, empty, error, retry, unauthorized, forbidden, conflict, pending, and success states as applicable.

## Errors and security

Until Bagas confirms a stable error envelope, normalize observed FastAPI `detail` variants.

- 401: invalid/missing session
- 403: authenticated but forbidden/gated
- 404: resource not found
- 409: lifecycle/state/concurrency conflict
- 413: request too large
- 422: field/domain validation
- 5xx: server failure; expose no internals

FastAPI owns authorization. Frontend checks are presentation only. Draft grades and unpublished modules are private. Cookie-authenticated writes require an explicit CSRF decision before production.

Presigned-upload contracts must cover intent ownership/expiry, type/size, direct upload, content validation, confirmation, persistence, replacement/deletion ordering, and cleanup for rejected, abandoned, superseded, or partially failed objects.

## Delivery order

### Asprak — current Aidan priority

1. assigned academic-period course list
2. course-detail shell, roster, and session context
3. module list/upload; lifecycle only after Partial gaps resolve
4. attendance roster and explicit save
5. draft grades; publication only after transitions/errors are confirmed
6. reports/export

### Praktikan

1. enrolled courses
2. published modules
3. personal attendance
4. published personal grades
5. profile/account

Bagas owns Superadmin frontend integration. Each slice requires its own approved plan.

## Validation

Frontend changes run narrow checks, `pnpm typecheck`, `pnpm lint`, `pnpm build`, available tests, and relevant network/auth/role/lifecycle/responsive/keyboard scenarios.

Backend checks are Bagas-owned. Never run Pytest until `TEST_DATABASE_URL` is resolved without exposing credentials and confirmed disposable; fixtures truncate tables.

Report every result as PASS, FAIL, SKIPPED, or NOT AVAILABLE, followed by files, contract status, performance, security/privacy, accessibility, limitations, and owner follow-ups. No agent Git write/history actions.
