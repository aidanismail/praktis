"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import {
  fetchAdminCourses,
  fetchAdminUsers,
  fetchSystemHealth
} from "../api/admin.api";
import { adminQueryKeys } from "../constants/admin-query-keys";

const OVERVIEW_STALE_TIME = 30_000;

function shouldRetry(failureCount: number, error: unknown) {
  if (
    error instanceof ApiError &&
    (error.status === 401 || error.status === 403)
  ) {
    return false;
  }

  return failureCount < 1;
}

export function useAdminOverview(userId: string) {
  const enabled = userId.length > 0;

  const coursesQuery = useQuery({
    queryKey: adminQueryKeys.overviewCourses(userId),
    queryFn: fetchAdminCourses,
    enabled,
    staleTime: OVERVIEW_STALE_TIME,
    retry: shouldRetry,
    refetchOnWindowFocus: false
  });

  const usersQuery = useQuery({
    queryKey: adminQueryKeys.overviewUsers(userId),
    queryFn: fetchAdminUsers,
    enabled,
    staleTime: OVERVIEW_STALE_TIME,
    retry: shouldRetry,
    refetchOnWindowFocus: false
  });

  const healthQuery = useQuery({
    queryKey: adminQueryKeys.overviewHealth(userId),
    queryFn: fetchSystemHealth,
    enabled,
    staleTime: 15_000,
    retry: false,
    refetchOnWindowFocus: false
  });

  async function refreshAll() {
    await Promise.all([
      coursesQuery.refetch(),
      usersQuery.refetch(),
      healthQuery.refetch()
    ]);
  }

  return {
    coursesQuery,
    usersQuery,
    healthQuery,
    refreshAll,
    isRefreshing:
      coursesQuery.isFetching || usersQuery.isFetching || healthQuery.isFetching
  };
}
