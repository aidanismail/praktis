import { SessionDetailRouteClient } from "@/features/sessions/components/session-detail-route-client";

type SessionDetailRouteProps = {
  params: Promise<{
    courseId: string;
    sessionId: string;
  }>;
};

export default async function SessionDetailRoute({
  params
}: SessionDetailRouteProps) {
  const { courseId, sessionId } = await params;

  return <SessionDetailRouteClient courseId={courseId} sessionId={sessionId} />;
}

