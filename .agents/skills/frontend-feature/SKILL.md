---
name: frontend-feature
description: Build or refactor an approved modular Next.js frontend feature in Praktis. Use for components, hooks, schemas, API wrappers, state, routes, and role-based UI after PLANS.MD approval. Avoid backend edits and Superadmin scope.
---

# Frontend Feature Workflow

1. Confirm the approved plan and role scope.
2. Inspect existing nearby features before choosing structure.
3. Prefer `src/features/<feature>/` for domain logic.
4. Keep `page.tsx` responsible for composition only.
5. Use:
   - typed API payloads and responses
   - Zod for form/input schemas
   - React Hook Form for forms
   - TanStack Query for server state
   - Zustand only for true cross-route client state
6. Reuse the existing API client and normalized errors.
7. Use `/api/...` endpoints and `credentials: "include"`.
8. Include loading, empty, error, retry, pending, and success states as applicable.
9. Preserve keyboard access, labels, focus behavior, and responsive layout.
10. Avoid broad abstractions, unnecessary client boundaries, and new dependencies.
11. Run the validation steps from the approved plan.
12. Report changed files, checks, performance findings, and security findings.
