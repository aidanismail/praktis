# Security Requirements

## Current configured controls

- JWT-based authentication using an HttpOnly cookie
- default password minimum length: 8
- CORS default origin: `http://localhost:8080`
- student import maximum: 5 MiB and 2,000 rows
- module upload maximum: 25 MiB
- Redis service available for caching or security controls
- MinIO object storage behind internal Docker networking and Nginx public routing

Some PRD controls, such as rate limiting, may be planned rather than fully implemented. Verify the repository before claiming they exist.

## Frontend rules

- Never store access tokens in localStorage, sessionStorage, Zustand, or JavaScript-readable cookies.
- Never include secrets in client bundles or `NEXT_PUBLIC_*` variables.
- Keep authenticated fetches same-origin with `credentials: "include"`.
- Treat all backend strings and uploaded metadata as untrusted input.
- Do not use unsafe HTML rendering unless content is explicitly sanitized and approved.
- Avoid exposing internal exception data in user-facing errors.
- Do not log credentials, tokens, reset values, or sensitive personal data.

## Authorization

- Hiding a sidebar item is not authorization.
- Every protected backend action must verify identity and role.
- The agent must report suspected backend authorization gaps to Aidan and Bagas.
- The agent must not patch backend authorization without explicit owner permission.

## File handling

For module upload/download UI:

- enforce accepted file types in the UI as a convenience, while recognizing backend validation is authoritative
- show the configured size limit
- avoid trusting the client-provided MIME type or filename as proof of safety
- do not expose MinIO credentials
- do not construct arbitrary bucket paths from unsanitized user input
- handle failed, interrupted, and oversized uploads clearly

## Session behavior

- Logout must invalidate the backend cookie.
- Unauthorized responses must clear stale user UI state and redirect safely.
- Avoid redirect loops between login, dashboard, and change-password.
- Only Praktikan users with `force_password_change` are blocked by the first-login rule.

## Dependency and supply-chain checks

- Do not add dependencies without approval in `PLANS.MD`.
- Prefer existing libraries and platform APIs.
- Review the purpose and maintenance status of any proposed package.
- Never weaken CI checks to make a build pass.

## Security review output

After implementation, the agent must report:

- auth/session impact
- role/permission impact
- input validation impact
- sensitive-data impact
- file/upload impact, when applicable
- remaining backend assumptions
