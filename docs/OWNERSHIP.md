# Ownership and Change Boundaries

## People

### Aidan

- Product owner and frontend owner
- Owns Asprak and Praktikan product flows
- Defines intended behavior and approves agent implementation plans
- Chooses whether the agent edits files directly or supplies ready-to-type code

### Bagas

- Backend owner
- Owns API and data contracts, persistence, migrations, authentication implementation, storage integration, infrastructure behavior, and backend tests
- Owns the Superadmin product area

## Agent operating boundary

The agent may inspect the entire repository. Its default implementation boundary is frontend work for Asprak and Praktikan after owner-approved planning.

The agent must not edit backend implementation, database schemas, migrations, API contracts, authentication cookies, Docker/Nginx contracts, or Superadmin features unless Aidan explicitly authorizes that category in the current task.

Product documentation may describe intended behavior that is not implemented. Such behavior must be labeled Target, Proposed, or Blocked rather than Current.

## Cross-team integration process

When frontend work needs backend support:

1. Inspect routes, schemas, models, migrations, tests, and available OpenAPI behavior.
2. Record the observed current contract in `PLANS.MD`.
3. Compare it with `docs/PRD.md`, `docs/DECISIONS.md`, and owner decisions.
4. Implement only against an existing confirmed contract.
5. If the contract is missing or incompatible, stop the affected implementation slice.
6. Create or update `BAGAS_BACKEND_HANDOFF.md` with a concise proposal.
7. Resume integration only after Bagas returns a confirmed contract and Aidan approves a new plan.

Each handoff item should contain:

- priority and user impact
- observed endpoint/data behavior
- intended product behavior
- proposed method/path and fields, labeled as proposals
- role/permission requirements
- validation, state transitions, and error cases
- pagination/filter/file constraints when relevant
- frontend acceptance criteria
- security/performance implications
- required backend tests

## Superadmin isolation

Superadmin may appear in shared role types and authentication/navigation infrastructure. The frontend agent must not add, refactor, or complete Superadmin behavior without explicit reassignment.

## Current cross-team blockers

The root `BAGAS_BACKEND_HANDOFF.md` currently tracks academic-period courses, grade publication, complete module/session lifecycle, and pre-pilot backend/security work. Its proposed shapes are not authoritative until Bagas confirms them.
