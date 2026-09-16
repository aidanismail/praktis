"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getCourseDetailRoute } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth-store";

type SessionDetailRouteClientProps = {
  courseId: string;
  sessionId: string;
};

export function SessionDetailRouteClient({
  courseId,
  sessionId,
}: SessionDetailRouteClientProps): React.JSX.Element {
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
    } else if (user.role === "asprak") {
      router.replace(
        `/dashboard?tab=classes&courseId=${courseId}&workspaceTab=sessions&sessionId=${sessionId}`
      );
    }
  }, [user, courseId, sessionId, router]);

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-3 text-slate-600"
      >
        <Loader2 className="h-5 w-5 animate-spin text-slate-900" />
        <span className="text-sm font-medium">
          Redirecting to session workspace...
        </span>
      </div>
    </main>
  );
}

