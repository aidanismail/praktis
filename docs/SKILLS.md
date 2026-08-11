# Repository Skills

Praktis skills live under `.agents/skills/<skill-name>/SKILL.md`. They are concise procedures; project requirements remain in `docs/`, and live contracts remain in source/OpenAPI.

## Available skills

### `plan-first`

Inspect the applicable instructions, docs, diff, and contracts; replace `PLANS.MD`; distinguish Current, Target, Proposed, and Blocked behavior; then stop for owner approval. Record direct-edit or ready-to-type mode.

### `implement-asprak-praktikan-feature`

Implement an approved Asprak or Praktikan slice. Check `BAGAS_BACKEND_HANDOFF.md` and stop affected integration when a required contract remains unresolved.

### `frontend-feature`

Build modular Next.js behavior under the actual `frontend/app`, `frontend/features`, and `frontend/lib` structure after approval.

### `integrate-backend-api`

Connect frontend behavior to a confirmed FastAPI contract while preserving same-origin `/api/` routing and HttpOnly-cookie authentication. Produce a standardized Bagas handoff instead of inventing missing behavior.

### `validate-change`

Review approved changes for scope, correctness, performance, security, privacy/publication, accessibility, build quality, and safe testing. Report PASS, FAIL, SKIPPED, or NOT AVAILABLE.

### `debug-docker-development`

Diagnose local Compose, Nginx, health, build, migration, hot-reload, proxy limits, and host exposure non-destructively. Never delete volumes or reset data.

## Usage

Skills trigger automatically when the task matches, or Aidan may name one explicitly, for example:

```text
$plan-first Plan the Asprak module-management screen. Do not implement yet.
```

```text
$implement-asprak-praktikan-feature Implement the approved attendance slice.
```

Repository instructions remain authoritative when a skill and project rule overlap.
