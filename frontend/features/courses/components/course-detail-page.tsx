"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { CourseWorkspaceTab } from "@/constants/routes";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth-store";
import { AsprakCourseDetailPage } from "./asprak-course-detail-page";
import { PraktikanCourseDetailPage } from "./praktikan-course-detail-page";

type CourseDetailPageProps = {
  courseId: string;
  initialTab: CourseWorkspaceTab;
};

export function CourseDetailPage(props: CourseDetailPageProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user?.role === "superadmin") {
      const targetWorkspaceTab =
        props.initialTab === "modules" || props.initialTab === "assignments"
          ? "classwork"
          : props.initialTab;
      router.replace(
        `/dashboard?tab=courses&courseId=${props.courseId}&workspaceTab=${targetWorkspaceTab}`
      );
    }
  }, [user, props.courseId, props.initialTab, router]);

  if (!user) return null;
  if (user.role === "asprak") return <AsprakCourseDetailPage {...props} />;
  if (user.role === "praktikan") return <PraktikanCourseDetailPage {...props} />;

  if (user.role === "superadmin") {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-slate-900" />
          <span className="text-sm font-medium">
            Redirecting to course workspace...
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div
        role="alert"
        className="mx-auto max-w-3xl rounded-3xl border border-amber-200 bg-amber-50 p-6"
      >
        <h1 className="text-lg font-semibold text-amber-950">
          Course workspace unavailable
        </h1>
        <p className="mt-2 text-sm text-amber-800">
          This role uses course management from its own dashboard.
        </p>
        <Link
          href={ROUTES.dashboard}
          className="mt-4 inline-flex min-h-11 items-center font-semibold text-amber-900 underline underline-offset-4"
        >
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}
