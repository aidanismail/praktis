---
name: frontend-feature
description: Build or refactor an owner-approved modular Next.js frontend feature in Praktis. Use for components, hooks, schemas, API wrappers, state, routes, and role-based Asprak or Praktikan UI after PLANS.MD approval; require Current API operations and avoid Bagas-owned Superadmin frontend/backend edits.
---

# Frontend Feature Workflow

1. Confirm approved scope and direct-edit or ready-to-type mode.
2. Reinspect nearby features, `docs/FULL_STACK_WORKFLOW.md`, and relevant `docs/API_CONTRACT_STATUS.md` entries.
3. Verify the required operation against source/OpenAPI and stop the affected integration if it is Partial, Proposed, or Blocked.
4. Keep `frontend/app/**/page.tsx` and layouts focused on composition.
5. Put domain behavior under `frontend/features/<feature>/`; reuse `frontend/lib/`, shared types, and existing components.
6. Use precise API types, Zod for input schemas, React Hook Form for forms, TanStack Query for server state, and Zustand only for genuine client state.
7. Preserve same-origin `/api/`, the shared API client, and `credentials: include`; never handle the HttpOnly token.
8. Handle loading, empty, error, retry, pending, unauthorized, forbidden, conflict, and success states as applicable.
9. Preserve labels, keyboard/focus behavior, status announcements, and responsive layouts.
10. Treat academic periods, module visibility, and grade publication as backend-enforced contracts.
11. Avoid broad abstractions, unnecessary client boundaries, redundant requests/state, and unapproved dependencies.
12. Run the approved validation and report files, commands, performance, security, accessibility, and limitations.
