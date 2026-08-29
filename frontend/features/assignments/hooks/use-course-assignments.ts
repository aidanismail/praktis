"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import {
  createCourseAssignment,
  getCourseAssignment,
  gradeAssignmentSubmission,
  listAssignmentSubmissions,
  listCourseAssignments,
  updateCourseAssignment
} from "../api/assignments.api";
import { assignmentQueryKeys } from "../constants/assignment-query-keys";
import type {
  Assignment,
  AssignmentSubmission,
  CreateAssignmentPayload,
  GradeSubmissionPayload,
  UpdateAssignmentPayload
} from "../types/assignment.type";

type CourseAssignmentScope = {
  userId: string;
  courseId: string;
};

type AssignmentScope = CourseAssignmentScope & {
  assignmentId: string;
};

type EnabledCourseScope = CourseAssignmentScope & {
  enabled: boolean;
};

type EnabledAssignmentScope = AssignmentScope & {
  enabled: boolean;
};

type GradeSubmissionVariables = {
  submissionId: string;
  payload: GradeSubmissionPayload;
};

function shouldRetryAssignmentRead(failureCount: number, error: Error) {
  if (
    error instanceof ApiError &&
    [401, 403, 404, 422].includes(error.status)
  ) {
    return false;
  }

  return failureCount < 1;
}

export function useCourseAssignments({
  userId,
  courseId,
  enabled
}: EnabledCourseScope) {
  return useQuery({
    queryKey: assignmentQueryKeys.course(userId, courseId),
    queryFn: () => listCourseAssignments(courseId),
    enabled: enabled && userId.length > 0 && courseId.length > 0,
    staleTime: 30_000,
    retry: shouldRetryAssignmentRead
  });
}

export function useAssignmentDetail({
  userId,
  courseId,
  assignmentId,
  enabled
}: EnabledAssignmentScope) {
  return useQuery({
    queryKey: assignmentQueryKeys.detail(userId, courseId, assignmentId),
    queryFn: () => getCourseAssignment(courseId, assignmentId),
    enabled:
      enabled &&
      userId.length > 0 &&
      courseId.length > 0 &&
      assignmentId.length > 0,
    staleTime: 30_000,
    retry: shouldRetryAssignmentRead
  });
}

export function useAssignmentSubmissions({
  userId,
  courseId,
  assignmentId,
  enabled
}: EnabledAssignmentScope) {
  return useQuery({
    queryKey: assignmentQueryKeys.submissions(userId, courseId, assignmentId),
    queryFn: () => listAssignmentSubmissions(courseId, assignmentId),
    enabled:
      enabled &&
      userId.length > 0 &&
      courseId.length > 0 &&
      assignmentId.length > 0,
    staleTime: 30_000,
    retry: shouldRetryAssignmentRead
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
        queryKey: assignmentQueryKeys.course(userId, courseId),
        exact: true
      }),
    retry: false
  });
}

export function useUpdateCourseAssignment({
  userId,
  courseId,
  assignmentId
}: AssignmentScope) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAssignmentPayload) =>
      updateCourseAssignment(courseId, assignmentId, payload),
    onSuccess: async (updatedAssignment) => {
      queryClient.setQueryData<Assignment>(
        assignmentQueryKeys.detail(userId, courseId, assignmentId),
        updatedAssignment
      );

      await queryClient.invalidateQueries({
        queryKey: assignmentQueryKeys.course(userId, courseId),
        exact: true
      });
    },
    retry: false
  });
}

export function useGradeAssignmentSubmission({
  userId,
  courseId,
  assignmentId
}: AssignmentScope) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, payload }: GradeSubmissionVariables) =>
      gradeAssignmentSubmission(courseId, assignmentId, submissionId, payload),
    onSuccess: (updatedSubmission) => {
      queryClient.setQueryData<AssignmentSubmission[]>(
        assignmentQueryKeys.submissions(userId, courseId, assignmentId),
        (currentSubmissions) =>
          currentSubmissions?.map((submission) =>
            submission.id === updatedSubmission.id
              ? updatedSubmission
              : submission
          )
      );
    },
    retry: false
  });
}
