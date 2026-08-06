# Code Review Checklist

Use this after implementation and before returning control to the owner.

## Scope

- [ ] The implementation matches the approved `PLANS.MD`.
- [ ] No backend files changed without explicit authorization.
- [ ] No Superadmin feature changed without explicit authorization.
- [ ] No unrelated refactor or formatting noise was introduced.
- [ ] No Git write/history action was performed.

## Correctness

- [ ] Success path works.
- [ ] Loading, empty, validation-error, server-error, and unauthorized states are handled.
- [ ] API fields and enum values match the confirmed backend contract.
- [ ] Role-specific routing does not loop or leak another role's interface.
- [ ] State is not duplicated unnecessarily.

## Frontend architecture

- [ ] Route files remain thin.
- [ ] Feature code is modular and colocated appropriately.
- [ ] Types avoid `any` and unjustified assertions.
- [ ] Shared abstractions are genuinely shared.
- [ ] Same-origin `/api/` routing and cookie credentials are preserved.

## UX and accessibility

- [ ] Controls have visible labels.
- [ ] Keyboard navigation and focus behavior work.
- [ ] Pending actions cannot be submitted repeatedly.
- [ ] Errors are understandable and do not expose internals.
- [ ] Layout works at representative desktop and mobile widths.

## Performance

- [ ] No obvious duplicate requests.
- [ ] No unnecessary large client component boundary.
- [ ] Large lists are paginated or otherwise bounded.
- [ ] Expensive work is not repeated during every render.
- [ ] New dependencies are justified and approved.

## Security

- [ ] No secrets, tokens, passwords, or private env values appear in code or logs.
- [ ] Token storage remains HttpOnly/backend-managed.
- [ ] Role UI is not presented as authorization.
- [ ] User-controlled content is rendered safely.
- [ ] Upload constraints and error cases are represented accurately.

## Validation

- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm build`
- [ ] Relevant automated tests, or explicit “not available” report
- [ ] Relevant manual scenarios
- [ ] Docker checks when service configuration changed

## Final report

- [ ] Lists changed files.
- [ ] Lists every validation command and result.
- [ ] Includes performance findings.
- [ ] Includes security findings.
- [ ] Includes known limitations and backend assumptions.
