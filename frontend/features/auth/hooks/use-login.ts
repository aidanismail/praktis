"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { LOGIN_MUTATION_KEY } from "@/lib/react-query/query-client";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth-store";
import { getMe, login } from "../api/auth.api";
import { authQueryKeys } from "../constants/auth-query-keys";
import type { LoginRequest } from "../types/auth.type";

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationKey: LOGIN_MUTATION_KEY,
    mutationFn: async (payload: LoginRequest) => {
      await login(payload);

      try {
        return await getMe();
      } catch (error) {
        if (error instanceof ApiError) {
          throw new ApiError(
            "Signed in, but we couldn't load your profile. Please try again.",
            error.status,
            error.data
          );
        }
        throw error;
      }
    },

    onSuccess: (user) => {
      queryClient.removeQueries();
      queryClient.setQueryData(authQueryKeys.currentUser(), user);
      setUser(user);

      if (user.force_password_change && user.role === "praktikan") {
        router.replace(ROUTES.changePassword);
        return;
      }

      router.replace(ROUTES.dashboard);
    },
    retry: false
  });
}
