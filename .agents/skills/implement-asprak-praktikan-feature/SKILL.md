---
name: implement-asprak-praktikan-feature
description: Implement an owner-approved Praktis feature for the Asprak or Praktikan role. Use after PLANS.MD approval for scoped feature work; check the Bagas backend handoff and stop affected integration when a required contract is unresolved. Do not implement Superadmin or backend-owned work unless explicitly reassigned.
---

# Implement Asprak or Praktikan Feature

## Preconditions

- Read applicable `AGENTS.md` files and relevant product/security/testing docs.
- Confirm `PLANS.MD` approval, role scope, and direct-edit or ready-to-type mode.
- Read root `BAGAS_BACKEND_HANDOFF.md` for dependencies.
- Verify required endpoints and fields in current backend code/OpenAPI; product requirements alone are insufficient.

## Workflow

1. Reinspect the exact approved files and preserve unrelated owner changes.
2. Reuse current feature patterns and keep route pages thin.
3. Define types only from confirmed contracts.
4. Implement all relevant request, empty, error, role, lifecycle, and success states.
5. Preserve same-origin cookie authentication and backend authorization assumptions.
6. Keep Asprak and Praktikan navigation/behavior isolated while sharing genuinely common code.
7. Treat unpublished grades as private and hidden modules as inaccessible to Praktikan.
8. Add tests only when the approved plan contains a safe test approach.
9. Avoid unrelated refactors and backend/Superadmin edits.
10. Follow `validate-change` before reporting completion.

## Stop conditions

Stop the affected slice and update the owner/handoff when an endpoint is missing, a field/state transition is ambiguous, authorization is absent, a dependency is unapproved, or work would require backend, migration, infrastructure, or Superadmin changes.
