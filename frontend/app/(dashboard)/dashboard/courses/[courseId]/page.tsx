import { parseCourseWorkspaceTab } from "@/constants/routes";
import { AsprakCourseDetailPage } from "@/features/courses/components/asprak-course-detail-page";

type CourseDetailRouteProps = {
  params: Promise<{
    courseId: string;
  }>;
  searchParams: Promise<{
    tab?: string | string[];
  }>;
};

export default async function CourseDetailRoute({
  params,
  searchParams
}: CourseDetailRouteProps) {
  const [{ courseId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams
  ]);

  const rawTab = Array.isArray(resolvedSearchParams.tab)
    ? resolvedSearchParams.tab[0]
    : resolvedSearchParams.tab;

  return (
    <AsprakCourseDetailPage
      courseId={courseId}
      initialTab={parseCourseWorkspaceTab(rawTab)}
    />
  );
}
