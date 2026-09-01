"use client";

import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getDefaultDashboardByRole, ROUTES } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import type { UserRole } from "@/types/user.type";
import { useCurrentUser } from "../hooks/use-current-user";

type AuthGuardProps = {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
};

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const currentUserQuery = useCurrentUser();
  const user = currentUserQuery.data;

  useEffect(() => {
    if (currentUserQuery.isError) {
      if (
        currentUserQuery.error instanceof ApiError &&
        currentUserQuery.error.status === 401
      ) {
        void (async () => {
          await queryClient.cancelQueries();
          queryClient.removeQueries();
          clearAuth();
          router.replace(ROUTES.login);
        })();
      }

      return;
    }

    if (!user) {
      return;
    }

    setUser(user);

    if (
      user.force_password_change &&
      user.role === "praktikan" &&
      pathname !== ROUTES.changePassword
    ) {
      router.replace(ROUTES.changePassword);
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(getDefaultDashboardByRole(user.role));
    }
  }, [
    allowedRoles,
    clearAuth,
    currentUserQuery.error,
    currentUserQuery.isError,
    pathname,
    queryClient,
    router,
    setUser,
    user
  ]);

  if (currentUserQuery.isPending || (!user && !currentUserQuery.isError)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm text-slate-200">Checking session...</span>
        </div>
      </div>
    );
  }

  if (currentUserQuery.isError) {
    const isUnauthorized =
      currentUserQuery.error instanceof ApiError &&
      currentUserQuery.error.status === 401;

    if (isUnauthorized) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            <span className="text-sm text-slate-200">
              Returning to sign in...
            </span>
          </div>
        </div>
      );
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div
          role="alert"
          className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <AlertCircle className="h-7 w-7 text-red-600" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-semibold text-slate-950">
            We could not verify your session
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            A network or server problem interrupted the check. Your session
            has not been cleared; try again when the connection is available.
          </p>
          <button
            type="button"
            onClick={() => void currentUserQuery.refetch()}
            disabled={currentUserQuery.isFetching}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={
                currentUserQuery.isFetching
                  ? "h-4 w-4 animate-spin"
                  : "h-4 w-4"
              }
              aria-hidden="true"
            />
            {currentUserQuery.isFetching ? "Checking..." : "Try again"}
          </button>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
