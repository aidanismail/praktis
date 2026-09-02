# Authentication and Role-Based Access

## Active roles

```text
superadmin
asprak
praktikan
```

`Dosen Pengampu` is not an active application role. A historical database enum value does not authorize introducing it into product behavior.

## Session model

- FastAPI stores the authentication token in an HttpOnly cookie (`access_token`).
- Frontend JavaScript cannot and must not read the token.
- Authenticated requests use `credentials: include` through the shared API client.
- `/api/auth/me` resolves session identity.
- Zustand may store the returned user for UI presentation but never the access token.
- TanStack Query coordinates current-user request caching.

## Role-based authorization matrix

| Domain / Resource | Operation | `superadmin` | `asprak` (Assigned) | `praktikan` (Enrolled) |
|---|---|---|---|---|
| **Users / Accounts** | List / Import / Reset Password | ✅ Full Access | ❌ Forbidden | ❌ Forbidden |
| **Courses** | Create / Update / Delete | ✅ Full Access | ❌ Forbidden | ❌ Forbidden |
| **Courses** | List / View Detail | ✅ All Courses | ✅ Assigned Courses | ✅ Enrolled Courses |
| **Enrollment & Staffing** | Enroll / Assign Staff | ✅ Full Access | ❌ Forbidden | ❌ Forbidden |
| **Course Stream** | Post / Pin / Delete Announcements | ✅ Full Access | ✅ Assigned Courses | ❌ Read-Only |
| **Course Stream** | Post / Delete Comments | ✅ Full Access | ✅ Assigned Courses | ✅ Enrolled (Own Comments) |
| **Course Modules** | Upload / Publish / Unpublish | ✅ Full Access | ✅ Assigned Courses | ❌ Read Published Only |
| **Assignments** | Create / Update / Delete / Publish | ✅ Full Access | ✅ Assigned Courses | ❌ Read Published Only |
| **Assignments** | Submit Solution File (MinIO) | ❌ Read Submissions | ❌ Read Submissions | ✅ Enrolled Students Only |
| **Assignments** | Grade Submission & Feedback | ✅ Full Access | ✅ Assigned Courses | ❌ Read Own Grade Only |
| **Class Sessions** | Create / Update / Open / Close | ✅ Full Access | ✅ Assigned Courses | ❌ Read Session Info |
| **Attendance** | Log Presence / Window Control | ✅ Full Access | ✅ Assigned Courses | ✅ Submit When Window Open |
| **Grades** | Enter Scores / Publish Session | ✅ Full Access | ✅ Assigned Courses | ❌ Read Published Only |
| **Exports** | Download CSV / XLSX Reports | ✅ Full Access | ✅ Assigned Courses | ❌ Forbidden |

## Browser-facing auth endpoints

Confirmed current paths:

- `POST /api/auth/login` returns `{ message: string }` and sets the HttpOnly cookie.
- `GET /api/auth/me` returns the current user profile.
- `POST /api/auth/logout` returns `{ message: string }` and clears the cookie.
- `POST /api/auth/change-password` returns `{ message: string }`.

Nginx removes `/api/` before forwarding requests to the FastAPI backend.

## First-login password rule

Confirmed product predicate:

```ts
user.role === "praktikan" && user.force_password_change === true
```

Use this predicate consistently in login handling and route guards. Asprak and Superadmin are not intended to be blocked by this product rule.

## Logout flow

1. Call the backend logout endpoint (`POST /api/auth/logout`).
2. Confirm success before claiming logout completed.
3. Clear current-user query data and client user state.
4. Redirect to login page (`/login`).
5. Confirm a subsequent `/api/auth/me` is unauthorized.

On network or 5xx failure, keep the user informed and allow retry. Clearing Zustand alone does not invalidate the server-managed cookie.

## Authorization boundary

Frontend checks control navigation and presentation only. FastAPI authorizes every protected read, write, publication, visibility, export, and lifecycle action against the caller's role and course assignment/enrollment in `backend/api/permissions.py`.

## Sensitive-data rules

- Never log passwords or full login/change-password payloads.
- Never expose JWT secrets or MinIO secret keys.
- Never move auth tokens into localStorage, sessionStorage, Zustand, or readable cookies.
- Do not put secrets in `NEXT_PUBLIC_*` variables.
- Treat unpublished grades as private data and enforce visibility in the backend.
- Uploaded files are validated for size (10MB for assignments, 25MB for modules) and allowed extension.
