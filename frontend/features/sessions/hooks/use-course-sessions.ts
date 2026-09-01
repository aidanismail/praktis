"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import {
  closeSessionAttendance,
  createCourseSession,
  listCourseSessions,
  openSessionAttendance,
  updateCourseSession
} from "../api/sessions.api";
import { sessionQueryKeys } from "../constants/session-query-keys";
import type {
  CourseSession,
  CreateCourseSessionPayload,
  UpdateCourseSessionPayload
} from "../types/session.type";

type SessionScope = {
  userId: string;
  courseId: string;
};

type UseCourseSessionsOptions = SessionScope & {
  enabled: boolean;
};

type UpdateSessionVariables = {
  sessionId: string;
  payload: UpdateCourseSessionPayload;
};

type TransitionSessionVariables = {
  sessionId: string;
  action: "open" | "close";
};

function shouldRetrySessionRead(failureCount: number, error: Error) {
  if (
    error instanceof ApiError &&
    [401, 403, 404, 422].includes(error.status)
  ) {
    return false;
  }

  return failureCount < 1;
}

function replaceSession(
  current: CourseSession[] | undefined,
  nextSession: CourseSession
) {
  if (!current) {
    return current;
  }

  const withoutUpdated = current.filter(
    (session) => session.id !== nextSession.id
  );

  return [...withoutUpdated, nextSession];
}

export function useCourseSessions({
  userId,
  courseId,
  enabled
}: UseCourseSessionsOptions) {
  return useQuery({
    queryKey: sessionQueryKeys.course(userId, courseId),
    queryFn: () => listCourseSessions(courseId),
    enabled: enabled && userId.length > 0 && courseId.length > 0,
    staleTime: 30_000,
    retry: shouldRetrySessionRead
  });
}

export function useCreateCourseSession(scope: SessionScope) {
  const queryClient = useQueryClient();
  const queryKey = sessionQueryKeys.course(scope.userId, scope.courseId);

  return useMutation({
    mutationFn: (payload: CreateCourseSessionPayload) =>
      createCourseSession(scope.courseId, payload),
    onSuccess: (session) => {
      queryClient.setQueryData<CourseSession[]>(queryKey, (current) =>
        current ? [...current, session] : current
      );
    },
    retry: false
  });
}

export function useUpdateCourseSession(scope: SessionScope) {
  const queryClient = useQueryClient();
  const queryKey = sessionQueryKeys.course(scope.userId, scope.courseId);

  return useMutation({
    mutationFn: ({ sessionId, payload }: UpdateSessionVariables) =>
      updateCourseSession(sessionId, payload),
    onSuccess: (session) => {
      queryClient.setQueryData<CourseSession[]>(queryKey, (current) =>
        replaceSession(current, session)
      );
    },
    retry: false
  });
}

export function useTransitionSessionAttendance(scope: SessionScope) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, action }: TransitionSessionVariables) =>
      action === "open"
        ? openSessionAttendance(sessionId)
        : closeSessionAttendance(sessionId),
    onSuccess: (_, variables) => {
      queryClient.setQueryData<CourseSession[]>(
        sessionQueryKeys.course(scope.userId, scope.courseId),
        (current) =>
          current?.map((session) =>
            session.id === variables.sessionId
              ? {
                  ...session,
                  attendance_status:
                    variables.action === "open" ? "OPEN" : "CLOSED"
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
