# Praktis Repository Instructions

## Project identity

Praktis is a Praktikum Management System for Informatics practicum operations at Universitas Padjadjaran. The active application roles are:

- `superadmin`
- `asprak`
- `praktikan`

`dosen pengampu` is not an application role and must not be introduced unless the owner explicitly changes this decision.

## Ownership and scope

- Aidan owns product direction and frontend work for the `asprak` and `praktikan` experiences.
- Bagas owns backend work and the `superadmin` experience.
- You may inspect the whole repository.
- You may edit frontend code for `asprak` and `praktikan` work when the owner requests it.
- Do not edit backend code, backend API contracts, database models, migrations, infrastructure contracts, or `superadmin` features unless the owner explicitly instructs you to do so in the current task.
- Never silently expand a task into Bagas's ownership area.

## Mandatory plan-first workflow

Before changing implementation files for any coding task:

1. Inspect the relevant code, documentation, current Git diff, and available API contracts.
2. Create or replace the repository-root `PLANS.MD` using its required template.
3. Include exact files expected to change, assumptions, risks, API impact, test plan, performance checks, and security checks.
4. Present the plan to the owner.
5. Stop and wait for explicit owner approval before implementing.

Planning and read-only inspection are allowed before approval. Implementation edits are not.

For a trivial documentation-only correction, still update `PLANS.MD`, but the plan may be brief.

## Git restrictions

Allowed:

- `git status`
- `git diff`
- `git log`
- `git show`
- `git branch --show-current`
- other read-only Git inspection

Forbidden unless the owner explicitly performs the action personally outside the agent workflow:

- create or delete branches
- `git add`
- commit
- push or pull
- merge or rebase
- reset, restore, checkout, or switch when it changes the worktree
- stash
- tag
- force operations

Do not suggest that these actions were completed. Report the changed files and let the owner handle Git writes.

## Destructive-operation restrictions

Never run without explicit owner confirmation:

- `docker compose down -v`
- `docker volume prune`
- database downgrade, reset, drop, truncate, or destructive data migration
- deletion of uploaded storage objects or MinIO buckets
- deletion of environment files, credentials, user data, or generated migrations
- broad automated rewrites or mass formatting

Non-destructive schema upgrades may be proposed in `PLANS.MD`. Because backend changes are outside default ownership, only run Alembic changes when the owner explicitly authorizes backend work.

## Product and architecture constraints

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS.
- Frontend state and data tools currently include TanStack Query, React Hook Form, Zod, and Zustand.
- Backend: FastAPI, Pydantic, SQLAlchemy, Alembic, PostgreSQL, Redis, and MinIO.
- Runtime entry point is Nginx at `http://localhost:8080` during local development.
- Frontend API requests must use same-origin paths beginning with `/api/`.
- Do not add `NEXT_PUBLIC_API_URL` or direct browser calls to `localhost:8000`.
- Browser authentication uses backend-managed HttpOnly cookies. Never store access tokens in Zustand, localStorage, sessionStorage, or client-readable cookies.
- Preserve `credentials: "include"` for authenticated browser requests.
- Nginx strips the browser-facing `/api/` prefix before forwarding requests to FastAPI. Do not change that contract casually.
- Keep route `page.tsx` files thin. Put feature behavior in `src/features/<feature>/`.
- Prefer modular components, typed API payloads, schemas, hooks, and constants over large route components.
- Reuse existing components and patterns before creating new abstractions.
- Do not invent backend endpoints or response shapes. Inspect the existing contract or ask the owner.

## Role boundaries

### Asprak

Expected domain areas include assigned practicum classes, module management, attendance, grading, and report/export interactions.

### Praktikan

Expected domain areas include enrolled practicum classes, module access/download, personal attendance, released grades, profile, and first-login password change.

### Superadmin

Do not implement or modify superadmin features unless the owner explicitly assigns that work. Bagas owns this area.

## Testing and completion

After approved implementation:

1. Run the narrowest relevant checks first.
2. Run frontend type checking and linting for frontend changes.
3. Run a production frontend build for meaningful frontend changes.
4. Run automated tests when a test runner exists.
5. If no suitable test runner exists, report that limitation and perform documented manual verification. Do not claim tests passed when no tests ran.
6. Review the final diff for regressions, security issues, performance risks, accessibility issues, and accidental scope expansion.
7. Report every command run and whether it passed, failed, or was skipped.

Current known baseline:

- Frontend `pnpm typecheck`: passes.
- Frontend `pnpm lint`: passes.
- Frontend `pnpm build`: passes.
- Frontend has no `test` script yet.
- Backend Pytest collects 42 tests, but the provided baseline run ends in errors. Do not attribute new failures to your change without comparison.
- `alembic upgrade head` passes in the provided local baseline.
- `docker compose config` passes in the provided local baseline.

Read `docs/TESTING_AND_QUALITY.md` before validation.

## Performance requirements

For every implementation review:

- avoid unnecessary client components and repeated network requests
- avoid unbounded rendering of large lists; use pagination or virtualization when needed
- preserve loading, empty, error, and retry states
- avoid redundant Zustand copies of server state
- use TanStack Query for server-state caching where appropriate
- avoid premature memoization, but investigate visible rerender or request duplication
- verify file-size and row-count constraints for upload/import interfaces
- check responsive layout and keyboard usability

## Security requirements

For every implementation review:

- frontend role visibility is not authorization; backend enforcement remains required
- never expose secrets, passwords, tokens, stack traces, or private environment values
- do not weaken HttpOnly cookie behavior, CORS, validation, upload limits, or role checks
- validate user-controlled data with existing schemas
- do not render unsafe HTML
- do not log credentials or complete authentication payloads
- preserve same-origin Nginx routing
- flag any backend authorization gap to the owner instead of patching backend code without permission

## Documentation map

Read only the documents relevant to the current task:

- `docs/PRD.md`: product requirements and scope
- `docs/OWNERSHIP.md`: team and role ownership
- `docs/ARCHITECTURE.md`: runtime and integration architecture
- `docs/DEVELOPMENT.md`: local environment and commands
- `docs/AUTH_AND_RBAC.md`: authentication and role rules
- `docs/TESTING_AND_QUALITY.md`: validation matrix and known baselines
- `docs/SECURITY.md`: security checklist
- `docs/DECISIONS.md`: durable project decisions
- `docs/ROADMAP.md`: current and future product direction
- `docs/CODE_REVIEW.md`: final review checklist
- `docs/SKILLS.md`: available repository skills

## Final response format

After implementation, summarize:

1. What changed
2. Files changed
3. Validation results
4. Performance review
5. Security review
6. Known limitations or follow-up items

Never claim a command passed unless you ran it and observed success.
