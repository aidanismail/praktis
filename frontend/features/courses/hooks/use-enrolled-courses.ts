"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { listCourses } from "../api/courses.api";
import { courseQueryKeys } from "../constants/course-query-keys";

export function useEnrolledCourses(userId: string) {
  return useQuery({
    queryKey: courseQueryKeys.enrolled(userId),
    queryFn: listCourses,
    enabled: userId.length > 0,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        return false;
      }

      return failureCount < 1;
    }
  });
}
