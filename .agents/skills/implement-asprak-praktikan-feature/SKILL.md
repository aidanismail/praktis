---
name: implement-asprak-praktikan-feature
description: Implement an owner-approved Praktis feature for the Asprak or Praktikan role. Use only after PLANS.MD is approved. Do not use for Superadmin or backend-owned implementation unless explicitly reassigned by the owner.
---

# Implement Asprak or Praktikan Feature

## Preconditions

- Read the applicable `AGENTS.md` files.
- Confirm `PLANS.MD` exists and its approval checkbox or owner message explicitly approves implementation.
- Confirm the feature belongs to Asprak or Praktikan.
- If backend support is missing, stop and produce a backend handoff instead of editing backend code.

## Workflow

1. Re-inspect the exact files listed in `PLANS.MD`.
2. Reuse current feature patterns and shared components.
3. Keep route pages thin and feature logic modular.
4. Define or update typed request/response contracts based only on confirmed backend behavior.
5. Implement loading, empty, error, unauthorized, and success states.
6. Preserve same-origin `/api/` paths and cookie credentials.
7. Keep role-specific navigation and behavior isolated.
8. Avoid unrelated refactors.
9. Add focused tests only when the approved plan includes a test approach.
10. Invoke or follow the `validate-change` skill before reporting completion.

## Stop conditions

Stop and ask the owner when:

- an endpoint does not exist
- request or response fields are ambiguous
- backend authorization appears missing
- a dependency addition is needed but not approved
- implementation would affect Superadmin
- implementation would require a migration or backend edit
