"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { listMyGrades } from "../api/grades.api";
import { gradeQueryKeys } from "../constants/grade-query-keys";

export function usePersonalGrades(userId: string, enabled = true) {
  return useQuery({
    queryKey: gradeQueryKeys.personal(userId),
    queryFn: listMyGrades,
    enabled: enabled && userId.length > 0,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && [401, 403].includes(error.status)) return false;
      return failureCount < 1;
    }
  });
}
