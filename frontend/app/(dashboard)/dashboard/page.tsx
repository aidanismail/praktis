"use client";

import { Suspense } from "react";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { useAuthStore } from "@/stores/auth-store";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <DashboardShell user={user} />
    </Suspense>
  );
}
