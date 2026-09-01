"use client";

import { useAuthStore } from "@/stores/auth-store";
import { ChangePasswordForm } from "./change-password-form";

export function ChangePasswordPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
      <div className="relative w-full max-w-md">
        <ChangePasswordForm isForced={Boolean(user?.force_password_change)} />
      </div>
    </main>
  );
}
