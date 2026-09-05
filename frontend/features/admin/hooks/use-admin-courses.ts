"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../api/admin.api";
import { adminQueryKeys } from "../constants/admin-query-keys";

export type CreateCoursePayload = {
  code: string;
  name: string;
  academic_year: string;
  semester: string;
};

export type UpdateCoursePayload = Partial<{
  code: string;
  name: string;
  academic_year: string;
  semester: string;
  is_active: boolean;
}>;

export function useAdminCourses() {
  const queryClient = useQueryClient();

  const coursesQuery = useQuery({
    queryKey: adminQueryKeys.courses(),
    queryFn: fetchAdminCourses,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateCoursePayload) => createCourse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.courses() });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCoursePayload }) =>
      updateCourse(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.courses() });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (courseId: string) => deleteCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.courses() });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
    },
  });

  return {
    courses: coursesQuery.data ?? [],
    isLoading: coursesQuery.isLoading,
    isFetching: coursesQuery.isFetching,
    error: coursesQuery.error
      ? coursesQuery.error instanceof Error
        ? coursesQuery.error.message
        : "Failed to load courses"
      : null,
    refetch: coursesQuery.refetch,
    createCourse: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    updateCourse: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
    deleteCourse: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  };
}
