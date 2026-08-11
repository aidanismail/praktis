# Praktis Frontend

Next.js App Router frontend for the Praktis practicum management system.

## Standard development entry point

Start the complete stack from the repository root:

```powershell
docker compose up -d
docker compose ps
```

Open `http://localhost:8080`. Use this Nginx entry point for normal development so `/api/` requests and HttpOnly cookies follow the real same-origin contract.

The direct Next.js port is an internal service detail in the Compose workflow, not the documented browser entry point.

## Frontend structure

```text
app/        route files and layouts
features/   domain components, hooks, schemas, types, APIs, and constants
lib/        shared API and TanStack Query plumbing
stores/     client/session-derived UI state
types/      shared TypeScript types
constants/  shared route and application constants
```

Keep `app/**/page.tsx` thin. Put feature behavior under `features/<feature>/`.

## Local checks

From `frontend/`:

```powershell
pnpm typecheck
pnpm lint
pnpm build
```

There is currently no frontend test script.

## API and authentication rules

- Use browser-facing same-origin endpoints beginning with `/api/`.
- Keep `credentials: include` in the shared API client.
- Never add a browser base URL for `localhost:8000`.
- Never read or store the HttpOnly access token.
- Use TanStack Query for remote server state; do not create redundant Zustand copies.
- Frontend role checks control presentation only; FastAPI authorization is required.

## Ownership

Aidan owns Asprak and Praktikan frontend work. Bagas owns backend contracts and Superadmin. Read root `AGENTS.md`, `frontend/AGENTS.md`, and the relevant `docs/` files before planning changes.
