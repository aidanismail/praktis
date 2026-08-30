import { AsprakSessionDetailPage } from "@/features/sessions/components/asprak-session-detail-page";

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

  return (
    <AsprakSessionDetailPage courseId={courseId} sessionId={sessionId} />
  );
}
