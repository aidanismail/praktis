import { AssignmentDetailPage } from "@/features/assignments/components/assignment-detail-page";

type AssignmentDetailRouteProps = {
  params: Promise<{
    courseId: string;
    assignmentId: string;
  }>;
};

export default async function AssignmentDetailRoute({
  params
}: AssignmentDetailRouteProps) {
  const { courseId, assignmentId } = await params;

  return (
    <AssignmentDetailPage
      courseId={courseId}
      assignmentId={assignmentId}
    />
  );
}
