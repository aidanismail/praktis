"use client";

import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth-store";
import { AsprakAssignmentDetailPage } from "./asprak-assignment-detail-page";
import { PraktikanAssignmentDetailPage } from "./praktikan-assignment-detail-page";

type Props = { courseId: string; assignmentId: string };

export function AssignmentDetailPage(props: Props) {
  const user = useAuthStore((state) => state.user);
  if (!user) return null;
  if (user.role === "asprak") return <AsprakAssignmentDetailPage {...props} />;
  if (user.role === "praktikan") return <PraktikanAssignmentDetailPage {...props} />;
  return <main className="min-h-screen bg-slate-50 px-4 py-8"><div role="alert" className="mx-auto max-w-3xl rounded-3xl border border-amber-200 bg-amber-50 p-6"><h1 className="font-semibold text-amber-950">Assignment workspace unavailable</h1><Link href={ROUTES.dashboard} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-amber-900 underline">Return to dashboard</Link></div></main>;
}
