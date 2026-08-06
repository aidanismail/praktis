# Authentication and Role-Based Access

## Active roles

```text
superadmin
asprak
praktikan
```

There is no Dosen Pengampu role in the current product.

## Session model

- The backend manages the authentication token in an HttpOnly cookie.
- Frontend code cannot and must not read the token.
- Authenticated requests use `credentials: "include"`.
- The frontend resolves session identity through `/api/auth/me`.
- Zustand may store the returned user object for UI behavior.
- Zustand must never store the access token.

## Browser-facing auth endpoints

Use confirmed repository contracts. Known browser-facing paths include:

- `/api/auth/login`
- `/api/auth/me`
- `/api/auth/logout`
- `/api/auth/change-password`

Nginx removes `/api/` before forwarding to FastAPI.

## First-login password rule

A user is forced to the password-change page only when both conditions are true:

```ts
user.role === "praktikan" && user.force_password_change === true
```

The same predicate must be used consistently in login success handling and route guards.

Asprak and Superadmin users are not redirected to change-password under the current owner decision.

## Logout flow

1. Call the backend logout endpoint.
2. Backend deletes the same cookie key/path used during login.
3. Clear the frontend user state.
4. Redirect to login.
5. A subsequent `/api/auth/me` request should be unauthorized.

Clearing Zustand alone is not logout.

## Route guards

Route guards should:

- resolve the current user from the backend
- redirect unauthenticated users to login
- enforce the Praktikan first-login rule
- apply allowed-role presentation rules
- avoid repeated redirects and infinite request loops

React development mode may cause duplicate effect execution. A small number of duplicate `/auth/me` requests during development can occur, but continuous repeated calls indicate a dependency/remount problem and must be investigated.

## Authorization boundary

Frontend role checks control navigation and user experience only. They do not protect data. FastAPI must authorize every protected operation.

Because backend changes are outside default agent scope, report missing authorization to the owner and backend lead rather than silently patching it.

## Sensitive-data rules

- Never log passwords.
- Never log complete login payloads.
- Never expose JWT secrets or MinIO credentials.
- Never move auth tokens into localStorage or client-readable cookies.
- Do not include secrets in `NEXT_PUBLIC_*` variables.
