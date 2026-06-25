"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const router = useRouter();
  function handleLogout() {
    clearAuth();
    router.replace("/login");
  }

  if (!user) {
    return null;
  }

  if (user.role === "superadmin") {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-emerald-600">
            Superadmin Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Welcome, {user.username}
          </h1>
          <p className="mt-3 text-slate-500">
            Manage users, courses, and practicum system settings.
          </p>
          <button onClick={handleLogout}>logout</button>
        </section>
      </main>
    );
  }

  if (user.role === "asprak") {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-emerald-600">
            Asprak Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Welcome, {user.username}
          </h1>
          <p className="mt-3 text-slate-500">
            Manage attendance, modules, and grading for your practicum class.
          </p>
          <button onClick={handleLogout}>logout</button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-emerald-600">
          Praktikan Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">
          Welcome, {user.username}
        </h1>
        <p className="mt-3 text-slate-500">
          Access your practicum modules, attendance, and course information.
        </p>
        <button className="text-black" onClick={handleLogout}>logout</button>
      </section>
    </main>
  );
}
