# Codex Usage for Praktis

## Instruction chain

Run Codex from the repository root so it loads:

```text
AGENTS.md
frontend/AGENTS.md or backend/AGENTS.md when working in those trees
docs/* as routed by AGENTS.md
.agents/skills/* when a matching workflow triggers
```

Instructions and skills provide scope and procedure. They do not replace inspection of current code, diffs, schemas, migrations, tests, and confirmed runtime contracts.

## Plan and approval

For any implementation or Markdown correction:

1. Inspect the relevant repository state read-only.
2. Create or replace root `PLANS.MD` with exact expected files, assumptions, risks, API impact, validation, performance, and security checks.
3. Present the plan.
4. Wait for Aidan's explicit approval.
5. Implement only the approved scope.

A conversational approval is valid; record it in the plan for durable context.

## Direct-edit and ready-to-type modes

Aidan may choose either:

- direct edit: Codex patches approved files and validates them
- ready-to-type: Codex prints ordered code/patch guidance while Aidan types; Codex then reviews and validates the resulting files

Approval of a plan does not override an explicit ready-to-type preference. Record the chosen mode in `PLANS.MD`.

## Backend gaps

When an Asprak or Praktikan feature needs an absent backend contract:

1. Do not invent the endpoint or response shape.
2. Stop the affected integration slice.
3. Record current evidence and intended behavior.
4. Create or update `BAGAS_BACKEND_HANDOFF.md` using the format in the integration skill.
5. Resume only after Bagas confirms the contract and Aidan approves a new plan.

Proposals must be labeled as proposals. Product requirements are not proof of implementation.

## Useful prompts

Planning:

```text
Use the repository instructions and relevant skills. Inspect current code and contracts, write PLANS.MD, and stop for approval. Do not edit implementation files yet. Task: <task>.
```

Approved direct editing:

```text
PLANS.MD is approved. Implement only that scope, validate it, report every command, and perform no Git actions.
```

Approved ready-to-type collaboration:

```text
PLANS.MD is approved. Give me the changes in a safe typing order and review each file after I type it. Do not edit implementation files yourself.
```

## Owner review

Before accepting work:

- read `PLANS.MD`
- inspect the diff
- verify reported commands and results
- confirm current behavior was not confused with a target proposal
- confirm backend/Superadmin scope was respected
- perform Git add/commit/push personally
