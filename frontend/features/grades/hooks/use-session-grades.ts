"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { sessionQueryKeys } from "@/features/sessions/constants/session-query-keys";
import type { CourseSession } from "@/features/sessions/types/session.type";
import {
  listSessionGrades,
  publishSessionGrades,
  saveSessionGrades,
  unpublishSessionGrades
} from "../api/grades.api";
import { gradeQueryKeys } from "../constants/grade-query-keys";
import type { BulkGradePayload } from "../types/grade.type";

type GradeScope = {
  userId: string;
  courseId: string;
  sessionId: string;
};

type UseSessionGradesOptions = GradeScope & {
  enabled: boolean;
};

function shouldRetryGradeRead(failureCount: number, error: Error) {
  if (
    error instanceof ApiError &&
    [401, 403, 404, 422].includes(error.status)
  ) {
    return false;
  }

  return failureCount < 1;
}

export function useSessionGrades({
  userId,
  courseId,
  sessionId,
  enabled
}: UseSessionGradesOptions) {
  return useQuery({
    queryKey: gradeQueryKeys.session(userId, courseId, sessionId),
    queryFn: () => listSessionGrades(sessionId),
    enabled:
      enabled &&
      userId.length > 0 &&
      courseId.length > 0 &&
      sessionId.length > 0,
    staleTime: 30_000,
    retry: shouldRetryGradeRead
  });
}

export function useSaveSessionGrades(scope: GradeScope) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkGradePayload) =>
      saveSessionGrades(scope.sessionId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: gradeQueryKeys.session(
          scope.userId,
          scope.courseId,
          scope.sessionId
        ),
        exact: true
      }),
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        return queryClient.invalidateQueries({
          queryKey: sessionQueryKeys.course(scope.userId, scope.courseId),
          exact: true
        });
      }
    },
    retry: false
  });
}

export function useSetSessionGradePublication(scope: GradeScope) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publish: boolean) =>
      publish
        ? publishSessionGrades(scope.sessionId)
        : unpublishSessionGrades(scope.sessionId),
    onSuccess: (_, publish) => {
      queryClient.setQueryData<CourseSession[]>(
        sessionQueryKeys.course(scope.userId, scope.courseId),
        (current) =>
          current?.map((session) =>
            session.id === scope.sessionId
              ? {
                  ...session,
                  grades_published: publish,
                  grades_published_at: publish
                    ? session.grades_published_at
                    : null,
                  grades_published_by: publish
                    ? session.grades_published_by
                    : null
                }
              : session
          )
      );

      return queryClient.invalidateQueries({
        queryKey: sessionQueryKeys.course(scope.userId, scope.courseId),
        exact: true
      });
    },
    retry: false
  });
}
