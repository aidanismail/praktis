"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getDefaultDashboardByRole, ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth-store";
import type { UserRole } from "@/types/user.type";
import { getMe } from "../api/auth.api";

type AuthGuardProps = {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
};

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const freshUser = await getMe();
        setUser(freshUser);

        if (
          freshUser.force_password_change &&
          freshUser.role === "praktikan" &&
          pathname !== ROUTES.changePassword
        ) {
          router.replace(ROUTES.changePassword);
          return;
        }

        if (
          !freshUser.force_password_change &&
          pathname === ROUTES.changePassword
        ) {
          router.replace(getDefaultDashboardByRole(freshUser.role));
          return;
        }

        if (allowedRoles && !allowedRoles.includes(freshUser.role)) {
          router.replace(getDefaultDashboardByRole(freshUser.role));
          return;
        }

        setIsChecking(false);
      } catch {
        clearAuth();
        router.replace(ROUTES.login);
      }
    }

    checkAuth();
  }, [allowedRoles, clearAuth, pathname, router, setUser]);

  if (isChecking || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm text-slate-200">Checking session...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
