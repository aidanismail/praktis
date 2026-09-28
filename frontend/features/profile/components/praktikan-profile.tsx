import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import type { User } from "@/types/user.type";
import {
  At,
  Key,
  ShieldCheck,
  User as UserIcon
} from "@phosphor-icons/react";

type Props = { user: User };

export function PraktikanProfile({ user }: Props) {
<<<<<<< HEAD
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
=======
  return <section aria-labelledby="profile-heading">
    <div>
      <h1 id="profile-heading" className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
        My Profile
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Manage your account credentials and personal details.
      </p>
    </div>
    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
            <UserIcon className="h-7 w-7" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Student account</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">
              {user.username}
            </h2>
          </div>
        </div>
        <dl className="mt-6 space-y-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <At className="h-4 w-4" aria-hidden="true" />
              Email
            </dt>
            <dd className="mt-2 wrap-break-word text-sm font-medium text-slate-950">{user.email}</dd>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Account status
            </dt>
            <dd className="mt-2 text-sm font-semibold text-slate-950">
              {user.is_active ? "Active" : "Inactive"}
            </dd>
          </div>
        </dl>
        <p className="mt-5 text-sm leading-6 text-slate-600">
          Student identity details are managed by your department administrators and can&apos;t be edited directly.
        </p>
      </article>
      <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Key className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-semibold text-slate-950">Password &amp; security</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Need to refresh your password? Keep your account safe with a strong, unique passphrase.</p>
        <Link
          href={ROUTES.changePassword}
          className="apple-press mt-5 inline-flex min-h-10 items-center justify-center rounded-full bg-slate-900 px-5 text-xs font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          Update password
        </Link>
      </aside>
    </div>
                                          </section>;
>>>>>>> 2aeaa1505e827562a47f8f2ffea40134cd06c5fe
}
