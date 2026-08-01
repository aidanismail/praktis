---
name: integrate-backend-api
description: Integrate Praktis frontend code with an existing FastAPI endpoint while preserving Nginx same-origin routing and HttpOnly-cookie authentication. Use for API wrappers, types, hooks, and UI integration. Do not edit backend contracts.
---

# Integrate an Existing Backend API

1. Confirm `PLANS.MD` approval.
2. Inspect the backend route, Pydantic schemas, and current frontend endpoint constants.
3. Record the confirmed method, browser-facing path, body, response, role requirement, and error cases.
4. Use the browser-facing `/api/...` path. Remember Nginx removes `/api/` before FastAPI.
5. Use the shared API client with `credentials: "include"`.
6. Do not read or store the HttpOnly token.
7. Create precise TypeScript types; do not use `any`.
8. Normalize backend validation errors through the existing client.
9. Use TanStack Query for remote data and mutation state.
10. Invalidate or update only the relevant query cache after mutations.
11. Handle unauthorized and forbidden responses distinctly when the product behavior differs.
12. If the backend contract is absent, inconsistent, or insecure, stop and prepare a handoff for Bagas. Do not patch backend code.
13. Run frontend checks and relevant browser scenarios.
