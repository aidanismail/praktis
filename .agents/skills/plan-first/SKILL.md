---
name: plan-first
description: Plan any Praktis coding, refactoring, integration, configuration, dependency, or documentation change before implementation. Inspect current evidence, replace root PLANS.MD, distinguish implemented behavior from target proposals, present the plan, and stop for Aidan's approval.
---

# Plan First

1. Read the applicable `AGENTS.md` files and only the relevant project docs.
2. Inspect `git status`, `git diff`, current code, schemas, migrations, tests, and available contracts read-only.
3. Classify every important statement as Current, Partial, Target, Proposed, or Blocked.
4. Check `docs/API_CONTRACT_STATUS.md`, then verify relevant entries against source/OpenAPI, migrations, and tests; never treat the ledger or a proposal alone as implementation evidence.
5. Identify Asprak, Praktikan, Superadmin, backend, database, Docker/Nginx, auth, dependency, and security scope.
6. Treat backend and Superadmin frontend edits as Bagas-owned and out of scope unless Aidan explicitly reassigns them for the current task.
7. Ask only product questions that materially change scope or contracts.
8. Replace root `PLANS.MD` with exact files, assumptions, API/data impact, risks, performance/security/accessibility review, validation, manual scenarios, and rollback.
9. Record whether Aidan chose direct edits or ready-to-type guidance.
10. Present the plan and stop. Do not edit implementation or planned documentation files until explicit approval.

Planning may use non-mutating inspection. Do not perform Git write/history actions. A conversational approval is valid; record it in `PLANS.MD` before implementation.
