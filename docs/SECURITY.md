# Security Requirements

## Current implemented controls

- JWT authentication in an HttpOnly cookie
- cookie `SameSite=Lax`; `Secure` when `ENVIRONMENT=production`
- default password minimum length of 8, with bcrypt's 72-byte boundary handled
- default CORS origin `http://localhost:8080`
- login rate limit: 5 attempts per minute per client IP
- bulk-attendance rate limit: 30 requests per minute per client IP
- student import limits: 5 MiB and 2,000 rows in the backend
- module object-size limit: 25 MiB after direct-to-storage upload
- Redis-backed caching/rate limiting with fail-open behavior when Redis is unavailable
- role, course-assignment, and enrollment checks for implemented protected endpoints

Verify code before claiming a control exists; this list describes the repository as inspected on August 11, 2026.

## Known gaps by urgency

### Before complete Asprak/Praktikan functionality

- Grade publication and published-only `/grades/me` filtering exist in source, but transition, permission, and privacy tests remain incomplete.
- Module upload does not verify actual PDF/DOCX content.
- Upload intents are not bound persistently to actor/course/expiry before confirmation.
- Abandoned and partially failed object-storage uploads have no cleanup lifecycle.
- Module visibility, replacement, and deletion operations exist, but storage-compensation and lifecycle-test evidence remain incomplete.
- Session deletion must not silently cascade-delete academic records.

### Before pilot

- Imported passwords follow predictable `Praktis{npm}` values.
- Backend forced-password enforcement is broader than the Praktikan-only product rule.
- Nginx `/api/` does not define a limit matching the backend's 5 MiB import allowance.
- Frontend auth has known response-type, retry, duplicate-request, and logout-failure issues.

### Before production

- PostgreSQL and MinIO ports are host-published in local Compose.
- The backend signs storage URLs with MinIO root credentials rather than a least-privilege identity.
- Shared-campus/NAT behavior for per-IP login throttling needs review.
- CSRF protection for cookie-authenticated writes is unresolved; HTTPS, secret rotation, backup, monitoring, and incident procedures also need an explicit production threat-model review.

See `docs/API_CONTRACT_STATUS.md` for readiness and `docs/FULL_STACK_WORKFLOW.md` for required handoff evidence.

## Frontend rules

- Never store access tokens in browser-readable storage or state.
- Never include secrets in client bundles or `NEXT_PUBLIC_*` variables.
- Keep authenticated fetches same-origin with `credentials: include`.
- Treat backend strings and uploaded metadata as untrusted.
- Do not use unsafe HTML unless content is sanitized and explicitly approved.
- Do not expose internal exceptions or stack traces to users.
- Do not log credentials, tokens, temporary passwords, or sensitive personal data.
- Treat role UI as presentation, not authorization.

## Grade privacy

- Draft/unpublished grades are private.
- Praktikan may access only their own published grades.
- Publish/unpublish actions require assigned-Asprak authorization and audit fields.
- Staff-only draft exports must remain assigned-course protected and visibly identified; any future Praktikan export may contain published personal grades only.

## File handling

- UI extension/type checks are convenience only; backend validation is authoritative.
- Show the effective size limit before upload.
- Verify file signatures/structure server-side for PDF/DOCX.
- Bind upload intent to actor, course, key, allowed type, and expiry.
- Do not construct arbitrary bucket keys from unsanitized input.
- Make replace/delete behavior recoverable across database and storage failures.
- Clean rejected, expired, abandoned, and superseded objects safely.
- Never expose MinIO secret credentials.

## Dependency and supply chain

- Do not add dependencies without owner-approved planning.
- Prefer existing libraries and platform APIs.
- Review maintenance status and purpose of proposed packages.
- Run the approved production dependency audit for dependency changes.
- Do not suppress advisories or weaken CI to report success.

## Backend test safety

The backend fixture runs `TRUNCATE ... CASCADE`. Before any backend test, explicitly resolve `TEST_DATABASE_URL`, verify the database name is a disposable test database, and obtain owner confirmation if there is any ambiguity. Never point tests at development, staging, or production data.

## Security review output

After implementation, report auth/session impact, role/permission impact, input and file validation, publication/privacy behavior, sensitive-data impact, direct-service exposure, and remaining backend assumptions.
