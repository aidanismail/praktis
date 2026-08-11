# Execution Plan

> Present this plan and wait for explicit owner approval before implementation.

## Task

- Request: Stabilize frontend production dependencies and cookie-auth behavior while Bagas works on the backend handoff.
- Requested by: Aidan
- Date: 2026-08-02
- Branch observed read-only: `feature/asprak-features`
- Collaboration mode: ready-to-type for implementation files; Aidan types code and commands, Codex reviews each result. Codex may directly correct the approved Markdown quote artifacts.

## Goal

Remove the current production dependency advisories and make the frontend auth flow contract-accurate, network-efficient, accessible, and resilient to transient failures without changing backend behavior.

Success means:

- Next.js and its paired ESLint config use the current 16.2.12 patch.
- Patched Sharp and PostCSS versions resolve without audit suppression.
- `pnpm audit --prod`, typecheck, lint, and production build pass.
- Login/password change perform one required `/auth/me` request and seed the destination guard cache.
- Direct protected entry performs one current-user request.
- Only a confirmed 401 clears auth and redirects; network/5xx failures show retry.
- Logout clears query/client state only after backend success and exposes pending/failure UI.
- Auth response types match the confirmed backend message objects.
- Touched forms and errors have accurate accessible status/field associations.
- Existing documentation work and dashboard viewport/sticky-sidebar changes remain intact.

## Current evidence

### Current implementation

- Installed Next and `eslint-config-next`: 16.2.9.
- Installed vulnerable transitive versions: Sharp 0.34.5 and Next-owned PostCSS 8.4.31.
- `pnpm audit --prod`: FAIL with 13 advisories, 7 high and 6 moderate.
- Registry versions observed August 2, 2026: Next/eslint-config 16.2.12, Sharp 0.35.3, PostCSS 8.5.25.
- Next 16.2.12 still declares PostCSS 8.4.31 and optional Sharp `^0.34.5`; overrides remain necessary.
- Login and password change each call `/auth/me`, then `AuthGuard` calls it again after navigation.
- `AuthGuard` treats all request failures as unauthenticated.
- Logout clears local state and redirects even when backend logout fails.
- Frontend login types still contain browser-readable token fields that the backend does not return.
- Change-password and logout return types do not match `{ message: string }`.
- `isAuthReady` and `setAuthReady` are unused Zustand state.
- Form request errors are not announced, and field errors are not associated through `aria-describedby`.

### Confirmed backend contract

- `POST /api/auth/login` returns a message object and sets an HttpOnly cookie.
- `GET /api/auth/me` returns `User`.
- `POST /api/auth/change-password` returns a message object.
- `POST /api/auth/logout` returns a message object and deletes the cookie.
- Browser requests remain same-origin with `credentials: 'include'`.

### Blocked backend issue

The backend currently blocks every role whose `force_password_change` flag is true, while the product predicate is Praktikan-only. This remains Bagas P1 work. The frontend will preserve `user.role === 'praktikan' && user.force_password_change` and will not patch or conceal the backend mismatch.

## Scope

### Included implementation guidance

- Upgrade paired Next packages to 16.2.12.
- Add exact pnpm overrides for Sharp 0.35.3 and PostCSS 8.5.25.
- Regenerate the pnpm lockfile mechanically.
- Replace token-shaped/mismatched auth response types with a shared message response.
- Add one current-user query key and hook with 30-second freshness and 401-aware retry behavior.
- Seed current-user query data after login and password change.
- Refactor `AuthGuard` around the query hook, confirmed-401 redirect, and retryable transient state.
- Add a logout mutation with pending/failure UI and coordinated cache/Zustand cleanup after success.
- Remove unused Zustand auth-ready state.
- Add request alert/live semantics and field error associations in touched forms.
- Preserve existing dashboard layout changes.

### Included direct Markdown corrections

Correct quote-stripping artifacts in auth examples such as `credentials: 'include'` and `user.role === 'praktikan'` without changing product meaning.

### Excluded

- Backend, migrations, API contracts, Nginx, Compose, CI, Superadmin, or Bagas handoff implementation
- Academic-period, module, session, attendance, grade-publication, or export features
- New test framework or runtime dependency
- Dashboard redesign, URL navigation changes, or unrelated refactors
- Git write/history actions
- Direct Codex edits to frontend implementation files in ready-to-type mode

## Proposed typing sequence

1. Update `frontend/package.json`; run the approved pnpm command to regenerate the lockfile.
2. Correct auth response types and API wrapper return types.
3. Remove unused auth-ready Zustand state.
4. Add the current-user query key and hook.
5. Seed query data in login and password-change hooks.
6. Refactor `AuthGuard` with 401 versus transient behavior and retry UI.
7. Add the logout hook and wire dashboard/sidebar pending and error state.
8. Add accessible request/field error semantics to both auth forms.
9. Apply the small direct Markdown quote corrections.
10. Run full approved validation and final diff review.

## Expected file changes

| File | Action |
|---|---|
| `PLANS.MD` | Replace with this plan. |
| `frontend/package.json` | Type paired upgrades and exact overrides. |
| `frontend/pnpm-lock.yaml` | Regenerate through pnpm. |
| `frontend/features/auth/types/auth.type.ts` | Match message/User contracts; remove token fields. |
| `frontend/features/auth/api/auth.api.ts` | Apply correct response types. |
| `frontend/stores/auth-store.ts` | Remove unused auth-ready state. |
| `frontend/features/auth/constants/auth-query-keys.ts` | Create stable current-user query key. |
| `frontend/features/auth/hooks/use-current-user.ts` | Create cached session query. |
| `frontend/features/auth/hooks/use-login.ts` | Seed current-user cache before navigation. |
| `frontend/features/auth/hooks/use-change-password.ts` | Seed refreshed current-user cache. |
| `frontend/features/auth/hooks/use-logout.ts` | Create reliable logout lifecycle. |
| `frontend/features/auth/components/auth-guard.tsx` | Use query state, 401 redirect, and retry UI. |
| `frontend/features/auth/components/login-form.tsx` | Add accessible request/field errors. |
| `frontend/features/auth/components/change-password-form.tsx` | Add accessible request/field errors. |
| `frontend/features/dashboard/components/dashboard-shell.tsx` | Integrate logout hook; preserve owner layout edits. |
| `frontend/features/dashboard/components/dashboard-sidebar.tsx` | Show pending/failure logout state; preserve sticky edit. |
| `docs/AUTH_AND_RBAC.md` | Correct auth-example quote artifacts. |
| `docs/SECURITY.md` | Correct credential-example quote artifact. |
| `docs/CODE_REVIEW.md` | Correct credential-example quote artifact. |
| `frontend/README.md` | Correct credential-example quote artifact. |
| `.agents/skills/frontend-feature/SKILL.md` | Correct credential-example quote artifact. |
| `.agents/skills/integrate-backend-api/SKILL.md` | Correct credential-example quote artifact. |

No backend or Superadmin file will change.

## API and state impact

- Existing auth endpoints, bodies, status codes, and cookie behavior remain unchanged.
- Expected request counts:
  - login: login plus one `/auth/me`; destination guard reuses fresh cache
  - password change: change plus one `/auth/me`; destination guard reuses fresh cache
  - direct protected entry: one `/auth/me`
  - logout: one backend request; cache/client state clears after success
- Zustand remains the dashboard consumer temporarily, while TanStack Query coordinates remote current-user state.
- Successful login/password change seed Query and Zustand together; successful logout clears the complete Query cache and Zustand to prevent cross-user data reuse.
- Database and backend impact: none.

## Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---:|---:|---|
| Sharp/PostCSS override is incompatible | medium | high | Exact pins, frozen install, audit, typecheck/lint/build, Docker build; stop rather than suppress. |
| Query cache and Zustand diverge | medium | medium | Seed/clear together through one query key and logout hook. |
| Cached role/activity is briefly stale | low | medium | 30-second stale period; backend remains authorization boundary. |
| Redirect loop or stuck guard | low | high | Preserve exact Praktikan predicate and test all auth routes. |
| Logout cookie remains after failure | medium | high | Keep current UI/session, show retry, never claim success. |
| User code is overwritten | low | high | Codex does not edit implementation; review each typed file and preserve dashboard hunks. |
| Lockfile churn exceeds dependency scope | medium | medium | Use pnpm 11.1.2 and inspect package/lockfile diff before continuing. |
| Markdown corrections broaden previous docs | low | low | Change only the six exact quote artifacts. |

## Security review plan

- Preserve backend-managed HttpOnly cookie and same-origin API paths.
- Never read, store, print, or log the token, passwords, cookie, or auth payloads.
- Remove token-shaped frontend response fields.
- Redirect and clear only on confirmed 401 or successful logout.
- Clear all Query cache on successful logout to avoid cross-user server-state leakage.
- Require production audit success without ignores or weakened checks.
- Preserve the documented backend forced-password mismatch as Bagas-owned.

## Performance review plan

- Verify cache seeding prevents destination `/auth/me` refetch.
- Verify direct protected entry performs one request.
- Verify 401 is not retried; transient failure uses at most the intended automatic retry plus explicit user retry.
- Add no runtime dependency.
- Compare production build output and inspect unexpected bundle growth.
- Avoid memoization or abstractions unrelated to demonstrated request/state problems.

## Accessibility and UX plan

- Associate field errors with inputs through stable IDs, `aria-invalid`, and `aria-describedby`.
- Announce request errors with `role='alert'` or equivalent live semantics.
- Keep password toggles keyboard accessible and accurately labeled.
- Disable submit/logout during pending actions.
- Provide a keyboard-operable retry for transient session/logout failure.
- Preserve current responsive layout; broader mobile sidebar redesign remains excluded.

## Validation plan

Report every command and scenario as PASS, FAIL, SKIPPED, or NOT AVAILABLE.

### Dependency and frontend commands

- Regenerate with pnpm 11.1.2, then verify `pnpm install --frozen-lockfile`.
- `pnpm audit --prod`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `pnpm why sharp`
- `pnpm why postcss`
- Frontend automated tests: NOT AVAILABLE unless package scripts change unexpectedly.

### Manual/static scenarios

- successful normal login
- successful forced-password Praktikan login
- password-change success and stale/401 behavior
- direct authenticated and unauthenticated protected entry
- forbidden/product-role redirect behavior
- transient `/auth/me` failure, automatic retry, and manual retry
- logout success, repeated click prevention, and logout failure/retry
- field/request error announcement and keyboard behavior
- request-count inspection

### Docker integration

- `docker compose config --quiet`
- `docker compose build frontend`
- Start only through the approved normal Compose workflow when browser smoke testing is performed.
- Smoke through `http://localhost:8080`; inspect targeted frontend/Nginx logs for request loops or warnings.

### Scope preservation

- `git diff --check`
- Inspect every implementation file after Aidan types it.
- Verify no backend/Superadmin/config file changed.
- Verify prior documentation changes and `BAGAS_BACKEND_HANDOFF.md` remain intact.
- Verify dashboard `min-h-dvh`, `items-start`, sticky `top-0 h-dvh`, and newline edits remain intact.

## Rollback approach

- Stop if overrides fail audit/build compatibility; do not retain partial overrides or suppressions.
- Report every typed/generated file and previous dependency version.
- Aidan handles restoration through the owner-managed Git workflow.
- No database, migration, storage, or persistent-volume rollback is involved.

## Approval status

- [ ] Owner approved ready-to-type frontend stabilization
- Approval notes:
