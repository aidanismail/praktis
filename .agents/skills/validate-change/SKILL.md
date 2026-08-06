---
name: validate-change
description: Validate an implemented Praktis change for correctness, regressions, performance, security, accessibility, and build quality. Use after implementation and before reporting completion.
---

# Validate Change

## 1. Scope and diff review

- Compare changed files with approved `PLANS.MD`.
- Check for backend or Superadmin scope violations.
- Check for unrelated formatting or refactors.
- Confirm no secrets or generated artifacts were added.

## 2. Relevant commands

For frontend changes, run from `frontend/`:

```text
pnpm typecheck
pnpm lint
pnpm build
```

Do not run `pnpm test`; it is not configured unless the approved change adds it.

For Docker/Nginx/dependency changes, run targeted Compose validation and builds.

For backend work, run checks only when backend edits were explicitly authorized. Preserve and report the known Pytest baseline.

## 3. Functional scenarios

Check success, loading, empty, validation error, server failure, unauthorized session, forbidden role, and responsive behavior as relevant.

## 4. Performance review

Inspect duplicate requests, cache behavior, client-component boundaries, unnecessary global state, unbounded lists, repeated expensive rendering, and dependency size.

## 5. Security review

Inspect auth/cookie behavior, role assumptions, input validation, sensitive-data exposure, unsafe HTML, upload constraints, and direct-service exposure.

## 6. Accessibility review

Inspect labels, keyboard navigation, focus behavior, status messaging, contrast, and disabled/pending behavior.

## 7. Report

For every command and scenario, report PASS, FAIL, SKIPPED, or NOT AVAILABLE. Never claim a test ran when it did not.
