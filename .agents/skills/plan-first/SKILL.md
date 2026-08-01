---
name: plan-first
description: Plan any Praktis coding, refactoring, integration, or configuration task before implementation. Inspect context, write repository-root PLANS.MD, present it, and stop for owner approval. Do not use for answering a purely informational question that requires no repository change.
---

# Plan First

1. Read the applicable `AGENTS.md` files.
2. Read only the project documents relevant to the request.
3. Inspect `git status`, `git diff`, and relevant implementation files using read-only commands.
4. Identify whether the request touches Asprak, Praktikan, Superadmin, backend, database, Docker/Nginx, auth, or dependencies.
5. Treat backend and Superadmin work as out of scope unless the owner explicitly authorizes it.
6. Create or replace repository-root `PLANS.MD` using the existing template.
7. Include exact expected file changes, API assumptions, risks, security review, performance review, tests, manual scenarios, and rollback.
8. State unresolved questions. Do not invent missing API contracts.
9. Present a concise summary of `PLANS.MD` to the owner.
10. Stop. Do not edit implementation files until the owner explicitly approves the plan.

Planning may include read-only repository inspection and non-mutating commands. Do not perform Git write/history actions.
