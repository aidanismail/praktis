"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { listMyAttendance } from "../api/attendance.api";
import { attendanceQueryKeys } from "../constants/attendance-query-keys";

export function usePersonalAttendance(userId: string, enabled = true) {
  return useQuery({
    queryKey: attendanceQueryKeys.personal(userId),
    queryFn: listMyAttendance,
    enabled: enabled && userId.length > 0,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && [401, 403].includes(error.status)) return false;
      return failureCount < 1;
    }
  });
}
