import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import type { User } from "@/types/user.type";

type Props = { user: User };

export function PraktikanProfile({ user }: Props) {
  return (
    <section aria-labelledby="profile-heading">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Account</p>
        <h1 id="profile-heading" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
          My Profile
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage your account credentials and personal details.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-semibold text-slate-950">{user.username}</h2>
            <p className="mt-0.5 text-sm capitalize text-slate-500">{user.role} account</p>
          </div>

          <dl className="mt-6 divide-y divide-slate-100">
            <div className="flex flex-col py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <dt className="text-sm text-slate-500">Email address</dt>
              <dd className="text-sm font-medium text-slate-950">{user.email}</dd>
            </div>
            <div className="flex flex-col py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <dt className="text-sm text-slate-500">Account status</dt>
              <dd className="text-sm font-medium text-slate-950">
                {user.is_active ? "Active" : "Inactive"}
              </dd>
            </div>
          </dl>

          <p className="mt-6 text-xs text-slate-500">
            Identity details are managed by your department administrators and can&apos;t be edited directly.
          </p>
        </article>

        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
          <h2 className="text-lg font-semibold text-slate-950">Password &amp; Security</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Need to refresh your password? Keep your account safe with a strong, unique passphrase.
          </p>
          <Link
            href={ROUTES.changePassword}
            className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 cursor-pointer"
          >
            Update password
          </Link>
        </aside>
      </div>
    </section>
  );
}
