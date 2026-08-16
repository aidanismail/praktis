# Praktis Repository Instructions

## Project identity

Praktis is a Praktikum Management System for Informatics practicum operations at Universitas Padjadjaran. The active application roles are:

- `superadmin`
- `asprak`
- `praktikan`

`dosen pengampu` is not an application role and must not be introduced unless the owner explicitly changes this decision.

## Ownership and scope

- Aidan owns product direction and frontend integration for the `asprak` and `praktikan` experiences.
- Bagas owns backend/API/data work and frontend integration for the `superadmin` experience.
- You may inspect the whole repository.
- You may edit frontend code for `asprak` and `praktikan` work when the owner requests it.
- Do not edit backend code, backend API contracts, database models, migrations, infrastructure contracts, or `superadmin` frontend features unless the owner explicitly instructs you to do so in the current task.
- Never silently expand a task into Bagas's ownership area.
- Shared auth, API plumbing, layouts, and design-system code must identify affected role consumers. A shared location does not erase role ownership.

## Mandatory plan-first workflow

Before changing implementation files for any coding task:

1. Inspect the relevant code, documentation, current Git diff, available API contracts, and `docs/API_CONTRACT_STATUS.md`.
2. Create or replace the repository-root `PLANS.MD` using its required template.
3. Include exact files expected to change, assumptions, risks, API impact, test plan, performance checks, and security checks.
4. Present the plan to the owner.
5. Stop and wait for explicit owner approval before implementing.

Planning and read-only inspection are allowed before approval. Implementation edits are not.

Record whether the owner wants direct agent edits or ready-to-type guidance. Approval does not override an explicit ready-to-type preference.

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
- Keep `frontend/app/**/page.tsx` files thin. Put feature behavior in `frontend/features/<feature>/`.
- Prefer modular components, typed API payloads, schemas, hooks, and constants over large route components.
- Reuse existing components and patterns before creating new abstractions.
- Do not invent backend endpoints or response shapes. Inspect the existing contract or ask the owner.

## Documentation authority and status

Use this order when evidence conflicts:

1. Aidan's explicit current decision
2. `docs/DECISIONS.md`
3. backend routes, schemas, permissions, migrations, tests, and runtime OpenAPI for Current API behavior
4. `docs/API_CONTRACT_STATUS.md` for integration readiness
5. `docs/PRD.md` for Target product behavior
6. approved `PLANS.MD` for the current execution scope

Classify material behavior as:

- `Current`: implemented and evidenced; readiness limitations may still be listed
- `Partial`: implemented in part or missing tests, migration safety, authorization clarity, or failure semantics
- `Proposed`: desired shape not confirmed by the backend owner
- `Blocked`: integration must stop pending a contract, decision, or safety requirement

Source existence does not by itself prove production readiness. Keep volatile status in `docs/API_CONTRACT_STATUS.md` and link to it rather than duplicating status across documents.

## Role boundaries

### Asprak

Expected domain areas include assigned academic-period practicum courses; full module and class-session lifecycle; attendance; grade entry and per-session publication; and report/export interactions. Product requirements do not prove a backend contract exists.

### Praktikan

Expected domain areas include enrolled academic-period courses, visible module access/download, personal attendance, published grades only, profile, and first-login password change.

### Superadmin

Do not implement or modify Superadmin frontend features unless the owner explicitly assigns that work. Bagas owns this area.

## Testing and completion

After approved implementation:

1. Run the narrowest relevant checks first.
2. Run frontend type checking and linting for frontend changes.
3. Run a production frontend build for meaningful frontend changes.
4. Run automated tests when a test runner exists.
5. If no suitable test runner exists, report that limitation and perform documented manual verification. Do not claim tests passed when no tests ran.
6. Review the final diff for regressions, security issues, performance risks, accessibility issues, and accidental scope expansion.
7. Report every command run and whether it passed, failed, or was skipped.

Recorded baseline from August 1, 2026:

- Frontend `pnpm typecheck`: passes.
- Frontend `pnpm lint`: passes.
- Frontend `pnpm build`: passes.
- Frontend has no `test` script yet.
- Backend Pytest collects 42 tests, but the provided baseline run ends in errors. Do not attribute new failures to your change without comparison.
- `alembic upgrade head` passes in the provided local baseline.
- `docker compose config` passes in the provided local baseline.

Read `docs/TESTING_AND_QUALITY.md` before validation.

Backend tests execute `TRUNCATE ... CASCADE` against the configured test database. Never run them until `TEST_DATABASE_URL` is explicitly resolved and verified as disposable test-only data.

## Performance requirements

For every implementation review:

- avoid unnecessary client components and repeated network requests
- avoid unbounded rendering of large lists; use pagination or virtualization when needed
- preserve loading, empty, error, and retry states
- avoid redundant Zustand copies of server state
- use TanStack Query for server-state caching where appropriate
- avoid premature memoization, but investigate visible rerender or request duplication
- verify file-size and row-count constraints for upload/import interfaces
- treat approximately 20 courses, 200+ Praktikan users total, and 8-10 modules per course as the initial scale; still bound retained multi-year histories
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
- treat unpublished grades as private and unpublished modules as inaccessible to Praktikan
- never claim extension-only upload checks prove actual PDF/DOCX content

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
- `docs/FULL_STACK_WORKFLOW.md`: contract lifecycle and frontend/backend integration standard
- `docs/API_CONTRACT_STATUS.md`: Current, Partial, Proposed, and Blocked integration ledger

## Final response format

After implementation, summarize:

1. What changed
2. Files changed
3. Validation results
4. Performance review
5. Security review
6. Known limitations or follow-up items

Never claim a command passed unless you ran it and observed success.
