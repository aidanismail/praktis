# Repository Skills

Codex repository skills are stored under `.agents/skills/<skill-name>/SKILL.md`.

## Available skills

### `plan-first`

Use before every implementation task. It inspects context, writes `PLANS.MD`, presents the plan, and stops for owner approval.

### `implement-asprak-praktikan-feature`

Use for end-to-end feature work in Aidan's Asprak or Praktikan scope.

### `frontend-feature`

Use for modular Next.js frontend implementation after a plan is approved.

### `integrate-backend-api`

Use when connecting frontend behavior to an existing FastAPI contract without editing backend code.

### `validate-change`

Use after implementation to run checks and perform performance/security review.

### `debug-docker-development`

Use for local Docker, Nginx, hot-reload, service-health, and routing diagnostics without destructive operations.

## Invocation examples

In Codex CLI, mention a skill explicitly with `$` when desired, for example:

```text
$plan-first Plan the Praktikan module-list screen. Do not implement yet.
```

```text
$implement-asprak-praktikan-feature Implement the approved attendance plan.
```

The root `AGENTS.md` already requires plan-first behavior, so explicit skill invocation is optional but useful for emphasis.
