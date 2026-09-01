"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import {
  confirmCourseModuleUpload,
  listCourseModules,
  publishCourseModule,
  requestCourseModuleUpload,
  unpublishCourseModule,
  updateCourseModule,
  uploadCourseModuleFile
} from "../api/modules.api";
import { moduleQueryKeys } from "../constants/module-query-keys";
import type {
  ConfirmModuleUploadInput,
  ModuleUploadIntentInput,
  UpdateModulePayload
} from "../types/module.type";

type CourseModuleScope = {
  userId: string;
  courseId: string;
};

type UseCourseModulesOptions = CourseModuleScope & {
  enabled: boolean;
};

type UploadModuleFileVariables = {
  uploadUrl: string;
  file: File;
};

type UpdateModuleVariables = {
  moduleId: string;
  payload: UpdateModulePayload;
};

type SetModulePublicationVariables = {
  moduleId: string;
  publish: boolean;
};

function shouldRetryModuleRead(failureCount: number, error: Error) {
  if (
    error instanceof ApiError &&
    [401, 403, 404, 422].includes(error.status)
  ) {
    return false;
  }

  return failureCount < 1;
}

function useInvalidateCourseModules({ userId, courseId }: CourseModuleScope) {
  const queryClient = useQueryClient();

  return () =>
    queryClient.invalidateQueries({
      queryKey: moduleQueryKeys.course(userId, courseId),
      exact: true
    });
}

export function useCourseModules({
  userId,
  courseId,
  enabled
}: UseCourseModulesOptions) {
  return useQuery({
    queryKey: moduleQueryKeys.course(userId, courseId),
    queryFn: () => listCourseModules(courseId),
    enabled: enabled && userId.length > 0 && courseId.length > 0,
    staleTime: 30_000,
    retry: shouldRetryModuleRead
  });
}

export function useRequestCourseModuleUpload(scope: CourseModuleScope) {
  return useMutation({
    mutationFn: (input: ModuleUploadIntentInput) =>
      requestCourseModuleUpload(scope.courseId, input),
    retry: false
  });
}

export function useUploadCourseModuleFile() {
  return useMutation({
    mutationFn: ({ uploadUrl, file }: UploadModuleFileVariables) =>
      uploadCourseModuleFile(uploadUrl, file),
    retry: false
  });
}

export function useConfirmCourseModuleUpload(scope: CourseModuleScope) {
  const invalidate = useInvalidateCourseModules(scope);

  return useMutation({
    mutationFn: (input: ConfirmModuleUploadInput) =>
      confirmCourseModuleUpload(scope.courseId, input),
    onSuccess: invalidate,
    retry: false
  });
}

export function useUpdateCourseModule(scope: CourseModuleScope) {
  const invalidate = useInvalidateCourseModules(scope);

  return useMutation({
    mutationFn: ({ moduleId, payload }: UpdateModuleVariables) =>
      updateCourseModule(moduleId, payload),
    onSuccess: invalidate,
    retry: false
  });
}

export function useSetCourseModulePublication(scope: CourseModuleScope) {
  const invalidate = useInvalidateCourseModules(scope);

  return useMutation({
    mutationFn: ({ moduleId, publish }: SetModulePublicationVariables) =>
      publish ? publishCourseModule(moduleId) : unpublishCourseModule(moduleId),
    onSuccess: invalidate,
    retry: false
  });
}
