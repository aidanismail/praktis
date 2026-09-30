"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { getMe } from "../api/auth.api";
import { authQueryKeys } from "../constants/auth-query-keys";

export function useCurrentUser() {
  return useQuery({
    queryKey: authQueryKeys.currentUser(),
    queryFn: getMe,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        return false;
      }

      return failureCount < 1;
    }
  });
}
