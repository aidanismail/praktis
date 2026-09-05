"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getCourseDetailRoute } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth-store";
import { AsprakSessionDetailPage } from "./asprak-session-detail-page";

type SessionDetailRouteClientProps = {
  courseId: string;
  sessionId: string;
};

export function SessionDetailRouteClient({
  courseId,
  sessionId,
}: SessionDetailRouteClientProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) return;

    if (user.role === "praktikan") {
      router.replace(getCourseDetailRoute(courseId, "sessions"));
    } else if (user.role === "superadmin") {
      router.replace(
        `/dashboard?tab=courses&courseId=${courseId}&workspaceTab=sessions`
      );
    }
  }, [user, courseId, router]);

  if (!user || user.role !== "asprak") {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-3 text-slate-600"
        >
          <Loader2 className="h-5 w-5 animate-spin text-slate-900" />
          <span className="text-sm font-medium">
            {user?.role === "praktikan" || user?.role === "superadmin"
              ? "Redirecting to session workspace..."
              : "Verifying session access..."}
          </span>
        </div>
      </main>
    );
  }

  return <AsprakSessionDetailPage courseId={courseId} sessionId={sessionId} />;
}

