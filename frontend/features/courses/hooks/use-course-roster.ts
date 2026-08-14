"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { listCourseStudents } from "../api/courses.api";
import { courseQueryKeys } from "../constants/course-query-keys";

type UseCourseRosterOptions = {
  userId: string;
  courseId: string;
  enabled: boolean;
};

export function useCourseRoster({
  userId,
  courseId,
  enabled
}: UseCourseRosterOptions) {
  return useQuery({
    queryKey: courseQueryKeys.roster(userId, courseId),
    queryFn: () => listCourseStudents(courseId),
    enabled: enabled && userId.length > 0 && courseId.length > 0,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403 || error.status === 404)
      ) {
        return false;
      }
      return failureCount < 1;
    }
  });
}
