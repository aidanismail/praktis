"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import {
  listSessionAttendance,
  saveSessionAttendance
} from "../api/attendance.api";
import { attendanceQueryKeys } from "../constants/attendance-query-keys";
import type { BulkAttendancePayload } from "../types/attendance.type";

type AttendanceScope = {
  userId: string;
  courseId: string;
  sessionId: string;
};

type UseSessionAttendanceOptions = AttendanceScope & {
  enabled: boolean;
};

function shouldRetryAttendanceRead(failureCount: number, error: Error) {
  if (
    error instanceof ApiError &&
    [401, 403, 404, 422].includes(error.status)
  ) {
    return false;
  }

  return failureCount < 1;
}

export function useSessionAttendance({
  userId,
  courseId,
  sessionId,
  enabled
}: UseSessionAttendanceOptions) {
  return useQuery({
    queryKey: attendanceQueryKeys.session(userId, courseId, sessionId),
    queryFn: () => listSessionAttendance(sessionId),
    enabled:
      enabled &&
      userId.length > 0 &&
      courseId.length > 0 &&
      sessionId.length > 0,
    staleTime: 30_000,
    retry: shouldRetryAttendanceRead
  });
}

export function useSaveSessionAttendance(scope: AttendanceScope) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkAttendancePayload) =>
      saveSessionAttendance(scope.sessionId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: attendanceQueryKeys.session(
          scope.userId,
          scope.courseId,
          scope.sessionId
        ),
        exact: true
      }),
    retry: false
  });
}
