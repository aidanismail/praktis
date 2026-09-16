"use client";

import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import type { User } from "@/types/user.type";

type UserProfileProps = {
  user: User;
};

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Administrator",
  asprak: "Teaching Assistant (Asprak)",
  praktikan: "Student (Praktikan)"
};

export function UserProfile({ user }: UserProfileProps) {
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;

  return (
    <section aria-labelledby="profile-heading" className="space-y-6">
      <div>
        <h1
          id="profile-heading"
          className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl"
        >
          Profile &amp; Security
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage your account credentials and security settings.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Account Details Card */}
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Account Details
          </h2>

          <dl className="mt-4 space-y-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Username
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-950">
                {user.username}
              </dd>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Email Address
              </dt>
              <dd className="mt-1 text-sm font-medium text-slate-950 break-all">
                {user.email}
              </dd>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Role
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-950">
                  {roleLabel}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-950">
                  {user.is_active ? "Active" : "Inactive"}
                </dd>
              </div>
            </div>
          </dl>

          <p className="mt-5 text-xs text-slate-500">
            Account identity and enrollment permissions are managed by system administrators.
          </p>
        </article>

        {/* Password & Security Card */}
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-base font-semibold text-slate-950">
            Password &amp; Security
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Keep your account secure by using a strong password. You can change your password anytime.
          </p>

          <div className="mt-5">
            <Link
              href={ROUTES.changePassword}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              Change password
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}

