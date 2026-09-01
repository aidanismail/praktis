import { LockKeyhole, UserRound } from "lucide-react";
import type { User } from "@/types/user.type";

type PraktikanCourseMembershipProps = { user: User };

export function PraktikanCourseMembership({ user }: PraktikanCourseMembershipProps) {
  return (
    <section aria-labelledby="membership-heading" className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><UserRound className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Your membership</p>
          <h2 id="membership-heading" className="mt-1 text-xl font-semibold text-slate-950">Enrolled as {user.username}</h2>
          <p className="mt-1 wrap-break-word text-sm text-slate-600">{user.email}</p>
        </div>
      </div>
      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
        <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
        <div><h3 className="text-sm font-semibold text-slate-900">Class membership is private</h3><p className="mt-1 text-sm leading-6 text-slate-600">Only your own enrollment details are shown here. Class rosters and staff directories are not available in the Praktikan workspace.</p></div>
      </div>
    </section>
  );
}
