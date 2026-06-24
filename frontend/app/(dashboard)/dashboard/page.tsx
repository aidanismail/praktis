"use client";

//import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  function handleLogout() {
    clearAuth();
    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <section className="mx-auto max-w-4xl rounded-3xl border bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-emerald-600">
              Authentication success
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Welcome back, {user?.username}
            </h1>
            <p className="mt-3 text-slate-500">
              You are logged in as{" "}
              <span className="font-medium text-slate-800">{user?.role}</span>.
            </p>
          </div>

          <button onClick={handleLogout}></button>
        </div>

        <div className="mt-8 rounded-2xl bg-slate-50 p-5">
          <pre className="overflow-auto text-sm text-slate-700">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </section>
    </main>
  );
}
