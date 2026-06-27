"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/types/user.type";
import { useAuthStore } from "@/stores/auth-store";
import { ROUTES } from "@/constants/routes";
import { logout } from "@/features/auth/api/auth.api";
import { DASHBOARD_NAVIGATION } from "../constants/dashboard-navigation";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";
import { RoleDashboard } from "./role-dashboard";

type DashboardShellProps = {
  user: User;
};

export function DashboardShell({ user }: DashboardShellProps) {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigationItems = DASHBOARD_NAVIGATION[user.role];

  const [activeItemId, setActiveItemId] = useState(navigationItems[0].id);

  const activeItem =
    navigationItems.find((item) => item.id === activeItemId) ??
    navigationItems[0];

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Still clear local auth state even if backend logout fails.
    } finally {
      clearAuth();
      router.replace(ROUTES.login);
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-950">
      <DashboardSidebar
        items={navigationItems}
        activeItemId={activeItemId}
        onSelectItem={setActiveItemId}
        onLogout={handleLogout}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <DashboardHeader user={user} />

        <main className="flex-1 p-8">
          <RoleDashboard user={user} activeItem={activeItem} />
        </main>
      </div>
    </div>
  );
}
