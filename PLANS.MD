# Execution Plan

> This file must be created or replaced before implementation work begins. The agent must stop after presenting this plan and wait for explicit owner approval.

## Task

- Request:
- Requested by:
- Date:
- Current branch, read-only observation:

## Goal

Describe the exact user-visible or engineering outcome.

## Scope

### Included

- 

### Excluded

- Backend edits unless explicitly authorized
- Superadmin work unless explicitly authorized
- Git write actions
- Unrelated refactors

## Current-state findings

- Relevant existing files:
- Existing patterns to reuse:
- Existing API contracts:
- Constraints or baseline issues:

## Assumptions and open questions

- 

Do not silently resolve material ambiguity. Ask the owner before implementation when an answer changes the contract or scope.

## Proposed implementation

1. 
2. 
3. 

## Expected file changes

| File | Action | Reason |
|---|---|---|
|  | create/edit/delete |  |

## API and data impact

- Browser endpoint(s):
- Request payload(s):
- Response shape(s):
- Authentication requirements:
- Database impact: none unless explicitly authorized
- Backend contract change: none unless explicitly authorized

## Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---:|---:|---|
|  | low/medium/high | low/medium/high |  |

## Security review plan

- Role and authorization assumptions:
- Cookie/session handling:
- Input validation:
- Sensitive-data exposure:
- Upload or download safety, when applicable:

## Performance review plan

- Network requests and caching:
- Rendering and list size:
- Bundle/client-component impact:
- Loading and error behavior:

## Accessibility and UX review plan

- Keyboard interaction:
- Focus management:
- Labels and error messages:
- Responsive layout:

## Validation plan

Run only commands relevant to the approved scope.

### Frontend

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- Automated tests: currently unavailable unless the approved task adds a test runner
- Manual scenarios:

### Backend

Only when backend work is explicitly authorized:

- `python -m compileall .`
- targeted `pytest` command
- `alembic upgrade head` when migration work is authorized

### Docker and integration

Only when Docker, dependency, proxy, or environment configuration changes:

- `docker compose config`
- targeted `docker compose build <service>`
- relevant logs and browser smoke checks through `http://localhost:8080`

## Rollback approach

Describe how the owner can revert the implementation files without destructive data operations.

## Approval status

- [ ] Owner approved implementation
- Approval notes:
