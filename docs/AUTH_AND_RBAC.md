# Authentication and Role-Based Access

## Active roles

```text
superadmin
asprak
praktikan
```

`Dosen Pengampu` is not an active application role. A historical database enum value does not authorize introducing it into product behavior.

## Session model

- FastAPI stores the authentication token in an HttpOnly cookie.
- Frontend JavaScript cannot and must not read the token.
- Authenticated requests use `credentials: include` through the shared API client.
- `/api/auth/me` resolves session identity.
- Zustand may store the returned user for UI behavior but never the access token.
- TanStack Query may coordinate current-user request caching.

## Browser-facing auth endpoints

Confirmed current paths:

- `POST /api/auth/login` returns `{ message: string }` and sets the cookie.
- `GET /api/auth/me` returns the current user.
- `POST /api/auth/logout` returns `{ message: string }` and deletes the cookie.
- `POST /api/auth/change-password` returns `{ message: string }`.

Nginx removes `/api/` before forwarding.

## First-login password rule

Confirmed product predicate:

```ts
user.role === praktikan && user.force_password_change === true
```

Use this predicate consistently in login handling and route guards. Asprak and Superadmin are not intended to be blocked by this product rule.

Current backend mismatch: `get_current_active_user` blocks every role when `force_password_change` is true, and the model defaults that field to true. Bagas must align creation and authorization invariants before pilot; see `BAGAS_BACKEND_HANDOFF.md`.

## Logout flow

1. Call the backend logout endpoint.
2. Confirm success before claiming logout completed.
3. Clear current-user query data and client user state.
4. Redirect to login.
5. Confirm a subsequent `/api/auth/me` is unauthorized.

On network or 5xx failure, keep the user informed and allow retry. Clearing Zustand alone does not invalidate the cookie.

Current frontend mismatch: the dashboard clears local auth and redirects even when the backend request fails. This remains part of the frontend auth stabilization follow-up.

## Route guards

Route guards should:

- resolve/reuse one current-user query
- redirect to login only on confirmed unauthenticated responses
- show retryable state for network/5xx failures
- enforce the Praktikan first-login rule
- apply allowed-role presentation rules
- avoid redirect and request loops

React development behavior can reveal repeated effects, but login and password-change navigation should seed/reuse current-user data rather than force an avoidable second `/auth/me` request.

## Authorization boundary

Frontend checks control navigation and presentation only. FastAPI must authorize every protected read, write, publication, visibility, export, and lifecycle action against the caller's role and course assignment/enrollment.

Report backend gaps to Aidan and Bagas. Do not patch backend authorization without explicit current-task permission.

## Sensitive-data rules

- Never log passwords or full login/change-password payloads.
- Never expose JWT secrets or MinIO secret keys.
- Never move auth tokens into localStorage, sessionStorage, Zustand, or readable cookies.
- Do not put secrets in `NEXT_PUBLIC_*` variables.
- Treat unpublished grades as private data and enforce visibility in the backend.
- Temporary imported passwords must be unpredictable before pilot.
