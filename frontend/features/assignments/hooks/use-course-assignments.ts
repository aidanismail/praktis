"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import {
  createCourseAssignment,
  listCourseAssignments
} from "../api/assignments.api";
import { assignmentQueryKeys } from "../constants/assignment-query-keys";
import type { CreateAssignmentPayload } from "../types/assignment.type";

type CourseAssignmentScope = {
  userId: string;
  courseId: string;
};

type UseCourseAssignmentsOptions = CourseAssignmentScope & {
  enabled: boolean;
};

function shouldRetryAssignmentList(failureCount: number, error: Error) {
  if (
    error instanceof ApiError &&
    (error.status === 401 || error.status === 403 || error.status === 404)
  ) {
    return false;
  }
  return failureCount < 1;
}

export function useCourseAssignments({
  userId,
  courseId,
  enabled
}: UseCourseAssignmentsOptions) {
  return useQuery({
    queryKey: assignmentQueryKeys.course(userId, courseId),
    queryFn: () => listCourseAssignments(courseId),
    enabled: enabled && userId.length > 0 && courseId.length > 0,
    staleTime: 30_000,
    retry: shouldRetryAssignmentList
  });
}

export function useCreateCourseAssignment({
  userId,
  courseId
}: CourseAssignmentScope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAssignmentPayload) =>
      createCourseAssignment(courseId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: assignmentQueryKeys.course(userId, courseId)
      }),
    retry: false
  });
}
