# Praktis Frontend

Next.js App Router frontend for Praktis.

## Ownership

- Aidan: Asprak and Praktikan frontend integration
- Bagas: Superadmin frontend integration and all backend contracts

Shared auth, API plumbing, layouts, and design-system code must name its role consumers. Read [../AGENTS.md](../AGENTS.md), [AGENTS.md](AGENTS.md), [../docs/FULL_STACK_WORKFLOW.md](../docs/FULL_STACK_WORKFLOW.md), and [../docs/API_CONTRACT_STATUS.md](../docs/API_CONTRACT_STATUS.md) before planning work.

## Standard entry point

Start the complete stack from the repository root and browse through Nginx:

```powershell
docker compose up -d
docker compose ps
```

Open <http://localhost:8080>. Browser API requests use `/api/...`; never call `localhost:8000` directly or add a browser-facing API base URL.

## Structure

```text
app/        thin route pages and layouts
features/   domain APIs, components, hooks, schemas, types, constants, and utilities
lib/        shared API and TanStack Query plumbing
stores/     genuine client/session-derived state
types/      cross-feature TypeScript types
constants/  routes and shared constants
```

Use TanStack Query for server state and Zustand only for genuine client state. Preserve `credentials: include`; never read or store the HttpOnly access token.

## Integration sequence

For each feature:

1. Confirm the role owner and approved `PLANS.MD`.
2. Confirm the endpoint is Current in the contract ledger.
3. Inspect the route, Pydantic schemas, permissions, tests, and runtime OpenAPI when available.
4. Define precise API types and normalized errors; do not invent fields or silently coerce responses.
5. Add query keys, query/mutation hooks, and targeted invalidation.
6. Implement loading, empty, error, retry, unauthorized, forbidden, conflict, pending, and success states as applicable.
7. Validate privacy, performance, accessibility, and responsive behavior.

The proposed future standard is generated or CI-validated TypeScript types from FastAPI OpenAPI. It is not currently implemented.

## Checks

From `frontend/`:

```powershell
pnpm typecheck
pnpm lint
pnpm build
```

There is no frontend test script. Report tests as NOT AVAILABLE unless an approved task adds one.
