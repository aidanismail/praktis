"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getDefaultDashboardByRole, ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth-store";
import { getMe, login } from "../api/auth.api";
import { authQueryKeys } from "../constants/auth-query-keys";
import type { LoginRequest } from "../types/auth.type";

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (payload: LoginRequest) => {
      await login(payload);
      return getMe();
    },

    onSuccess: (user) => {
      queryClient.removeQueries();
      queryClient.setQueryData(authQueryKeys.currentUser(), user);
      setUser(user);

      if (user.force_password_change && user.role === "praktikan") {
        router.replace(ROUTES.changePassword);
        return;
      } else {
        router.replace(getDefaultDashboardByRole(user.role));
      }
    },
    retry: false
  });
}
