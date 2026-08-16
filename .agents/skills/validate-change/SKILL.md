---
name: validate-change
description: Validate an implemented Praktis change for approved scope, correctness, regressions, performance, security/privacy, accessibility, safe testing, and build quality. Use after implementation and before reporting completion.
---

# Validate Change

## Scope and evidence

1. Compare changed files with approved `PLANS.MD` and collaboration mode.
2. Check Aidan-owned Asprak/Praktikan frontend boundaries, Bagas-owned backend/Superadmin frontend boundaries, unrelated churn, generated artifacts, secrets, and preserved owner changes.
3. Confirm Current behavior is not confused with Partial, Target, Proposed, or Blocked contracts; compare changed integration with `docs/API_CONTRACT_STATUS.md` and its source evidence.
4. Check whether documentation/status entries must change to avoid drift after the implementation.

## Commands

- For frontend implementation, run `pnpm typecheck`, `pnpm lint`, and `pnpm build` from `frontend/`.
- Run the approved production audit and affected Docker build for dependency work.
- Run Docker/Nginx checks only for affected service/configuration work.
- Run backend tests only when authorized and after verifying `TEST_DATABASE_URL` is disposable test-only data; its fixture truncates tables.
- Do not run nonexistent frontend tests.

## Review

- Exercise relevant success, loading, empty, validation, network/server, unauthorized, forbidden, conflict, retry, lifecycle, and responsive scenarios.
- Inspect duplicate requests, cache invalidation, client boundaries, global state, rendering cost, list bounds, dependencies, and multi-year growth.
- Inspect cookies/CSRF assumptions, role enforcement, unpublished grades, unpublished modules, sensitive data, unsafe HTML, upload validation/cleanup, migrations when relevant, and direct-service exposure.
- Inspect labels, keyboard/focus behavior, announcements, contrast, confirmations, and pending/disabled behavior.

## Report

Report each command and scenario as PASS, FAIL, SKIPPED, or NOT AVAILABLE. List changed files, performance/security/accessibility findings, backend assumptions, and known limitations. Never claim a test or contract exists without evidence.
