import { AsprakCourseDetailPage } from "@/features/courses/components/asprak-course-detail-page";

type CourseDetailRouteProps = {
  params: Promise<{
    courseId: string;
  }>;
};

export default async function CourseDetailRoute({
  params
}: CourseDetailRouteProps) {
  const { courseId } = await params;
  return <AsprakCourseDetailPage courseId={courseId}></AsprakCourseDetailPage>;
}
