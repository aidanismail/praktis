import type { User } from "@/types/user.type";

type PraktikanCourseMembershipProps = { user: User };

export function PraktikanCourseMembership({ user }: PraktikanCourseMembershipProps) {
  return (
    <section aria-labelledby="membership-heading" className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="border-b border-slate-200 pb-4">
        <h2 id="membership-heading" className="text-xl font-semibold text-slate-950">
          Your Enrollment
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Enrolled as <span className="font-mono font-medium text-slate-900">{user.username}</span> ({user.email})
        </p>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-500">
        Class membership is private. Only your own enrollment details are displayed here.
      </p>
    </section>
  );
}
