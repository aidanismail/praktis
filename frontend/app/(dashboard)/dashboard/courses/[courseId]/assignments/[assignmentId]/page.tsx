import { AsprakAssignmentDetailPage } from "@/features/assignments/components/asprak-assignment-detail-page";

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
    <AsprakAssignmentDetailPage
      courseId={courseId}
      assignmentId={assignmentId}
    />
  );
}
