# Praktis Frontend Code Review Report

## Executive Summary

This code review assesses the `frontend/` directory (focusing on `asprak` and `praktikan` roles) against the established Praktis product requirements and engineering guidelines. The codebase demonstrates a strong foundation, adhering strictly to the required tech stack (Next.js App Router, React Query, Zustand, Tailwind CSS) and ownership boundaries. However, there are known authentication and state-management gaps that require attention before production readiness.

## 1. Code Quality & Modularity

- **Passes Automated Checks**: Both `pnpm typecheck` and `pnpm lint` executed successfully with 0 errors. This reflects a disciplined use of TypeScript and ESLint.
- **Thin App Routes**: The Next.js `app/` directory correctly contains thin routes (e.g., `app/(auth)/login/page.tsx`) that immediately delegate to modular feature components (`features/auth/components/login-page.tsx`).
- **Feature Encapsulation**: Domain logic is well-encapsulated inside the `features/` directory, appropriately splitting `api`, `components`, `hooks`, `schemas`, and `types`.
- **State Management Separation**: Zustand is used strictly for UI/session state (`auth-store.ts`), and TanStack React Query is used for remote server state mutations (`use-login.ts`).

## 2. Architecture & Contract Adherence

- **Nginx API Proxying**: The API client (`lib/api/client.ts`) correctly relies on Nginx for same-origin proxying (`/api/`) and avoids hardcoding `localhost:8000` or exposing `NEXT_PUBLIC_API_URL` to the backend directly.
- **HttpOnly Cookies**: The frontend rightfully avoids storing authentication tokens in Zustand, `localStorage`, or `sessionStorage`. `credentials: "include"` is properly set on `fetch` calls.
- **Role Isolation**: Role-based routing is properly separated, and the UI is treated as presentation-only.

## 3. Performance Review

- **Duplicate Requests**: As noted in `SECURITY.md`, the frontend suffers from duplicate-request issues on authentication. **Finding:** `features/auth/components/auth-guard.tsx` uses a manual `useEffect` to call `getMe()` instead of leveraging a `useQuery` hook. This bypasses React Query's built-in deduplication and caching, resulting in redundant network calls when multiple guarded components mount.
- **Optimized UI**: Client-side boundaries (`"use client"`) are used only where necessary (e.g., inside interactive hooks and forms), minimizing the JavaScript bundle size on the server side.

## 4. Security & Privacy Review

- **Safe Handling of Credentials**: No access tokens are exposed in the client-side state. The `AuthStore` only stores non-sensitive user metadata.
- **Role Verification vs Authorization**: The `AuthGuard` correctly redirects users based on their role but does not assume the UI acts as a security boundary. It safely relies on the backend to reject unauthorized requests.
- **Password Enforcement**: The `AuthGuard` strictly enforces the `force_password_change` rule for `praktikan` users, ensuring they cannot access their dashboard until their initial password is changed.
- **Untrusted Input**: No `dangerouslySetInnerHTML` was detected. Inputs are piped through Zod validation schemas before submission.

## 5. Actionable Recommendations

1. **Refactor AuthGuard with React Query**: Replace the manual `useEffect` fetch inside `auth-guard.tsx` with a `useQuery` wrapper for `getMe()`. This will resolve the duplicate network request issue and improve page load performance by utilizing the shared cache.
2. **Implement File Upload Size Validation**: Ensure the frontend explicitly displays the 25 MiB module limit (and 5 MiB import limit) before upload, as Nginx will enforce a 30 MiB ceiling.
3. **Draft States and Privacy (Future Gap)**: Ensure upcoming UI work for module visibility strictly respects the `hidden` status for Praktikan and does not fetch draft grades, adhering to the privacy constraints.
4. **Implement Frontend Testing**: The codebase currently lacks a testing runner for the frontend. Implementing `vitest` or `jest` for unit testing the React components and hooks is recommended before the pilot launch.
