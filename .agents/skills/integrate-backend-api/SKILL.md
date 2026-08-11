---
name: integrate-backend-api
description: Integrate Praktis frontend code with a confirmed FastAPI endpoint while preserving Nginx same-origin routing and HttpOnly-cookie authentication. Use for wrappers, types, hooks, query state, and UI integration; create a standardized Bagas handoff instead of inventing absent or insecure contracts.
---

# Integrate an Existing Backend API

1. Confirm `PLANS.MD` approval and collaboration mode.
2. Inspect the route, Pydantic schemas, models/migrations when relevant, authorization helpers, tests, and frontend endpoint constants.
3. Record method, browser path, request, response, roles, state transitions, errors, bounds, and file constraints.
4. Check `BAGAS_BACKEND_HANDOFF.md`; stop if the required item remains unresolved.
5. Use `/api/...`; Nginx removes the prefix before FastAPI.
6. Use the shared API client with `credentials: include`; never read/store the HttpOnly token.
7. Create precise TypeScript types and normalized errors without `any` or silent coercion.
8. Use TanStack Query for remote state and invalidate/update only relevant keys.
9. Distinguish unauthorized, forbidden, validation, conflict, server, and network behavior.
10. Verify publication/visibility privacy and backend role enforcement where relevant.
11. Run approved frontend and browser/network validation.

## Bagas handoff format

When a contract is absent, inconsistent, or insecure, update root `BAGAS_BACKEND_HANDOFF.md` with:

- priority and user impact
- Current evidence with file/endpoint references
- confirmed Target behavior
- Proposed method/path and request/response fields, labeled Proposed
- roles, authorization, state transitions, and error statuses
- pagination/filter/file limits
- frontend acceptance criteria
- security/performance impact
- required backend tests

Do not edit backend code or present a proposed shape as confirmed.
