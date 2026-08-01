# Ownership and Change Boundaries

## People

### Aidan

- Product owner
- Frontend owner
- Owns Asprak product flows
- Owns Praktikan product flows
- Approves all agent implementation plans

### Bagas

- Backend owner
- Owns backend API, persistence, migrations, authentication implementation, storage integration, and related tests
- Owns the Superadmin product area

## Agent operating boundary

The agent may inspect all code to understand the system. Its default implementation boundary is frontend work for Asprak and Praktikan.

The agent must not edit:

- backend implementation
- database schemas or migrations
- backend API contracts
- authentication cookie implementation
- global Docker/Nginx infrastructure
- Superadmin features

unless Aidan explicitly authorizes that category in the current task.

## Cross-team integration process

When Asprak or Praktikan frontend work needs backend support:

1. Inspect existing routes, schemas, and Swagger behavior.
2. Record the current contract in `PLANS.MD`.
3. Implement only against an existing confirmed contract.
4. If the contract is missing or incompatible, stop and ask Aidan.
5. Produce a concise backend handoff proposal for Bagas instead of editing backend code.

A useful handoff contains:

- endpoint and HTTP method
- role/permission requirement
- request fields
- response fields
- error cases
- pagination/filter behavior
- file constraints, when applicable
- frontend acceptance criteria

## Superadmin isolation

The Superadmin role remains part of the product and may appear in shared auth types and navigation infrastructure. However, the agent must not add, refactor, or complete Superadmin feature behavior unless explicitly assigned.
