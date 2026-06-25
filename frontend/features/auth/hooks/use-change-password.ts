"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { getDefaultDashboardByRole, ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth-store";
import { changePassword, getMe } from "../api/auth.api";
import type { ChangePasswordRequest } from "../types/auth.type";

export function useChangePassword() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: async (payload: ChangePasswordRequest) => {
      await changePassword(payload);
      return getMe();
    },

    onSuccess: (user) => {
      setUser(user);
      router.replace(getDefaultDashboardByRole(user.role));
    },

    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        clearAuth();
        router.replace(ROUTES.login);
      }
    },
  });
}