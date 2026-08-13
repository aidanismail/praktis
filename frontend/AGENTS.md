# Frontend-Specific Instructions

These instructions extend the repository-root `AGENTS.md` for work inside `frontend/`.

## Default edit permission

Frontend work is allowed only after the root `PLANS.MD` is approved. The default product scope is the `asprak` and `praktikan` experiences.

Bagas owns Superadmin frontend integration. Do not implement, refactor, or complete `superadmin` behavior unless Aidan explicitly reassigns that work in the current task.

Shared auth, API plumbing, layouts, and design-system code may serve multiple roles. Name the affected consumers in `PLANS.MD`; do not use a shared file as a reason to expand into Superadmin behavior.

When Aidan requests ready-to-type collaboration, provide ordered code or patches and review what Aidan enters; do not edit implementation files silently.

## Current stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- TanStack Query
- React Hook Form
- Zod
- Zustand
- Lucide React
- pnpm 11.1.2

## Structure conventions

- Keep `app/**/page.tsx` and layouts thin.
- Put domain behavior in `features/<feature>/`.
- Preferred feature folders, when relevant:
  - `api/`
  - `components/`
  - `constants/`
  - `hooks/`
  - `schemas/`
  - `types/`
  - `utils/`
- Put cross-feature API plumbing in `lib/api/`.
- Put shared user/session state in the existing auth store only when it is genuinely client state.
- Do not duplicate TanStack Query server data into Zustand.
- Use kebab-case filenames and named exports for reusable components and hooks.
- Preserve strict types. Avoid `any`, broad assertions, and silent response coercion.
- Reuse the existing API error normalization rather than rendering raw backend objects.

## API integration

- Use browser-facing endpoints beginning with `/api/`.
- Never add a browser API base URL environment variable for local Docker development.
- Keep `credentials: "include"`.
- Do not store or inspect the HttpOnly token.
- Do not invent endpoint names, field names, enum values, or pagination contracts.
- When an API contract is missing or ambiguous, document it in `PLANS.MD` and ask the owner.
- Check `docs/API_CONTRACT_STATUS.md`; integrate only when the required contract is Current and its listed readiness conditions are satisfied.
- Follow `docs/FULL_STACK_WORKFLOW.md` for contract evidence, handoffs, query behavior, errors, and validation.
- Do not modify backend code to make frontend integration easier without explicit authorization.

## Authentication and routing

- Active roles are `superadmin`, `asprak`, and `praktikan`.
- Only `praktikan` is forced through first-login password change when `force_password_change` is true.
- Preserve route protection and avoid redirect loops.
- Logout must confirm backend success before clearing client state and redirecting; failures remain visible and retryable.
- UI role checks are for navigation and presentation only, not security authorization.

## UI expectations

- White-mode professional academic dashboard.
- Left sidebar navigation and right content area.
- Fast interaction with minimal full-page loading.
- Prefer dialogs or drawers for contained edit/create actions when suitable.
- Every data view needs loading, empty, error, and success behavior.
- Every form needs labels, validation feedback, disabled/pending states, and keyboard usability.
- Preserve responsive behavior; do not design only for one desktop width.
- Treat course offerings as academic-period records, draft grades as private, and unpublished modules as unavailable to Praktikan.

## Frontend validation

From `frontend/`:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`

There is currently no `pnpm test` script. Do not run or claim it exists. If automated frontend testing is needed, propose the framework and dependency changes in `PLANS.MD` and wait for approval.
