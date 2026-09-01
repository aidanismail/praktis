"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { getDefaultDashboardByRole, ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth-store";
import { changePassword, getMe } from "../api/auth.api";
import { authQueryKeys } from "../constants/auth-query-keys";
import type { ChangePasswordRequest } from "../types/auth.type";

export function useChangePassword() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: async (payload: ChangePasswordRequest) => {
      await changePassword(payload);
      return getMe();
    },

    onSuccess: (user) => {
      queryClient.setQueryData(authQueryKeys.currentUser(), user);
      setUser(user);
      router.replace(getDefaultDashboardByRole(user.role));
    },

    onError: async (error) => {
      if (error instanceof ApiError && error.status === 401) {
        await queryClient.cancelQueries();
        queryClient.removeQueries();
        clearAuth();
        router.replace(ROUTES.login);
      }
    },
    retry: false
  });
}
