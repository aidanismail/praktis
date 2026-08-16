---
name: implement-asprak-praktikan-feature
description: Implement an owner-approved Praktis feature for the Asprak or Praktikan role. Use after PLANS.MD approval for scoped feature work; check the API contract ledger and stop affected integration unless the required operation is Current. Do not implement Bagas-owned Superadmin frontend or backend work unless explicitly reassigned.
---

# Implement Asprak or Praktikan Feature

## Preconditions

- Read applicable `AGENTS.md` files and relevant product/security/testing docs.
- Confirm `PLANS.MD` approval, role scope, and direct-edit or ready-to-type mode.
- Read `docs/FULL_STACK_WORKFLOW.md` and the relevant `docs/API_CONTRACT_STATUS.md` entries.
- Verify required endpoints and fields in current backend code/OpenAPI; product requirements alone are insufficient.

## Workflow

1. Reinspect the exact approved files and preserve unrelated owner changes.
2. Reuse current feature patterns and keep route pages thin.
3. Define types only from confirmed contracts.
4. Implement all relevant request, empty, error, role, lifecycle, and success states.
5. Preserve same-origin cookie authentication and backend authorization assumptions.
6. Keep Asprak and Praktikan navigation/behavior isolated while sharing genuinely common code.
7. Treat unpublished grades as private and unpublished modules as inaccessible to Praktikan.
8. Add tests only when the approved plan contains a safe test approach.
9. Avoid unrelated refactors and backend/Superadmin edits.
10. Follow `validate-change` before reporting completion.

## Stop conditions

Stop the affected slice and update the contract ledger with owner and next action when an endpoint is missing, an operation is Partial/Proposed/Blocked, a field/state transition is ambiguous, authorization is absent, a dependency is unapproved, or work would require backend, migration, infrastructure, or Superadmin frontend changes.
