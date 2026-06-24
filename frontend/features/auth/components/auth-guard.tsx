"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMe } from "../api/auth.api";
import { useAuthStore } from "@/stores/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkSession() {
      if (!accessToken) {
        clearAuth();
        router.replace("/login");
        return;
      }

      try {
        const freshUser = await getMe(accessToken);
        setUser(freshUser);

        if (
          freshUser.force_password_change &&
          pathname !== "/change-password"
        ) {
          router.replace("/change-password");
          return;
        }

        setIsChecking(false);
      } catch {
        clearAuth();
        router.replace("/login");
      }
    }

    checkSession();
  }, [accessToken, clearAuth, pathname, router, setUser]);

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
