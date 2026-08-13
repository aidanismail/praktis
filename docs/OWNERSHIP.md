# Ownership and Change Boundaries

## People

### Aidan

- Product owner
- Owns frontend integration for the Asprak and Praktikan product flows
- Defines intended behavior and approves agent implementation plans
- Chooses whether the agent edits files directly or supplies ready-to-type code

### Bagas

- Backend owner and Superadmin frontend owner
- Owns API and data contracts, persistence, migrations, authentication implementation, storage integration, infrastructure behavior, and backend tests
- Owns frontend integration for the Superadmin product area

## Agent operating boundary

The agent may inspect the entire repository. Its default implementation boundary is frontend work for Asprak and Praktikan after owner-approved planning.

The agent must not edit backend implementation, database schemas, migrations, API contracts, authentication cookies, Docker/Nginx contracts, or Superadmin frontend features unless Aidan explicitly authorizes that category in the current task. Changes to shared frontend code must preserve all roles and remain limited to what the approved Asprak/Praktikan slice requires.

Product documentation may describe intended behavior that is not implemented. Such behavior must be labeled Target, Proposed, or Blocked rather than Current.

## Cross-team integration process

When frontend work needs backend support:

1. Inspect routes, schemas, models, migrations, tests, and available OpenAPI behavior.
2. Record the observed contract and its evidence in `docs/API_CONTRACT_STATUS.md` and the current `PLANS.MD`.
3. Compare it with `docs/PRD.md`, `docs/DECISIONS.md`, and owner decisions.
4. Implement only against an existing confirmed contract.
5. If the contract is missing or incompatible, stop the affected implementation slice.
6. Add a concise Proposed or Blocked entry to `docs/API_CONTRACT_STATUS.md` using the handoff fields in `docs/FULL_STACK_WORKFLOW.md`.
7. Resume integration only after Bagas returns a confirmed contract and Aidan approves a new plan.

Each unresolved-contract entry should contain:

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

## Current cross-team status

Use `docs/API_CONTRACT_STATUS.md` as the canonical readiness ledger. Academic-period courses, publication controls, module/session lifecycle, authentication invariants, migration readiness, and CSRF have different readiness levels; do not reduce them to a single implemented/not-implemented claim. `docs/FULL_STACK_WORKFLOW.md` defines how Bagas and Aidan move an entry from Proposed or Blocked to Current.
