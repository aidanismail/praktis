import type { User } from "@/types/user.type";

type DashboardHeaderProps = {
  user: User;
};

const ROLE_LABEL = {
  superadmin: "Superadmin",
  asprak: "Asprak",
  praktikan: "Praktikan",
};

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-8 py-5">
      <div>
        <p className="text-sm font-medium text-emerald-600">
          {ROLE_LABEL[user.role]} Dashboard
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
          Welcome, {user.username}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your practicum workflow from one centralized workspace.
        </p>
      </div>
    </header>
  );
}