# Codex Usage for Praktis

## Install this pack

Copy the contents of this pack into the Praktis repository root while preserving paths:

```text
AGENTS.md
PLANS.MD
frontend/AGENTS.md
backend/AGENTS.md
docs/*
.agents/skills/*
```

Restart Codex after copying the files so it rebuilds its instruction chain.

## Verify instructions

From the repository root, ask Codex:

```text
Summarize the active repository instructions, ownership boundaries, Git restrictions, and plan-first workflow. Do not edit files.
```

From inside `frontend/`, ask it to list active instruction files and confirm that frontend-specific rules apply.

From inside `backend/`, confirm it recognizes the default inspect-only backend boundary.

## Verify skills

Use `/skills` in Codex CLI or mention a skill with `$`, such as:

```text
$plan-first
```

## Recommended task prompt

```text
Use the repository instructions and relevant skills. First inspect the current implementation and create PLANS.MD. Do not change implementation files until I approve the plan. The task is: <describe task>.
```

After approval:

```text
The PLANS.MD plan is approved. Implement only the approved scope, then run the required validation and report correctness, performance, and security findings. Do not perform Git actions.
```

## Owner review

Before accepting implementation:

- read `PLANS.MD`
- inspect the diff personally
- verify commands and results
- confirm no backend or Superadmin scope was changed
- perform Git add/commit/push personally
