# Code Review Checklist

Use this after implementation and before returning control to the owner.

## Scope and contract

- [ ] Work matches the approved `PLANS.MD` and chosen direct-edit/ready-to-type mode.
- [ ] Current behavior is not confused with a proposed target contract.
- [ ] No backend, infrastructure, or Superadmin file changed without explicit authorization.
- [ ] No unrelated refactor, formatting noise, generated artifact, or Git write occurred.
- [ ] Any unresolved backend gap is recorded in `BAGAS_BACKEND_HANDOFF.md`.

## Correctness

- [ ] Success, loading, empty, validation, network/server, unauthorized, forbidden, retry, and conflict states are handled.
- [ ] API fields, enum wire values, methods, and errors match the confirmed contract.
- [ ] Academic-period identity is displayed when course offerings could be confused.
- [ ] Role routing does not loop or leak another role's interface.
- [ ] Server state is not copied unnecessarily into Zustand.

## Lifecycle and privacy

- [ ] Draft/unpublished grades never reach Praktikan UI or any Praktikan-facing export.
- [ ] Publish, unpublish, correct, and republish states remain explicit.
- [ ] Hidden modules remain hidden from Praktikan.
- [ ] Replace/delete/session-delete flows handle confirmation and partial failure.
- [ ] No UI implies successful deletion when backend/storage cleanup failed.
- [ ] Academic records are not silently destroyed by session deletion.

## Frontend architecture

- [ ] Routes under `frontend/app/` remain thin.
- [ ] Feature behavior stays under `frontend/features/<feature>/`.
- [ ] Shared API plumbing stays under `frontend/lib/api/`.
- [ ] Types avoid `any`, unjustified assertions, and token-shaped browser responses.
- [ ] Same-origin `/api/` and `credentials: include` remain intact.

## UX and accessibility

- [ ] Controls have visible labels and native keyboard behavior.
- [ ] Focus, dialogs/drawers, confirmations, and status messages are usable.
- [ ] Pending actions cannot be submitted repeatedly.
- [ ] Errors are understandable and expose no internals.
- [ ] Representative desktop and mobile widths work.

## Performance

- [ ] No obvious duplicate request or invalidation loop exists.
- [ ] Client-component boundaries are justified.
- [ ] Lists are bounded when expected retained size requires it.
- [ ] Expensive work is not repeated on every render.
- [ ] New dependencies are approved and justified.
- [ ] Cache behavior cannot expose stale role, publication, or visibility data improperly.

## Security

- [ ] Tokens, passwords, secrets, private env values, and stack traces are absent.
- [ ] Backend-managed HttpOnly token storage remains intact.
- [ ] Frontend role UI is not treated as authorization.
- [ ] User-controlled content is rendered safely.
- [ ] Upload type, size, intent, and cleanup assumptions match the backend.
- [ ] Backend tests, if authorized, target an explicitly verified disposable database.

## Validation and report

- [ ] Every command is listed with PASS, FAIL, SKIPPED, or NOT AVAILABLE.
- [ ] Frontend typecheck, lint, and build ran when required.
- [ ] Automated tests ran when available and safe, or limitations are explicit.
- [ ] Performance, security, accessibility, API assumptions, and known gaps are reported.
- [ ] Changed files are listed and owner changes are preserved.
