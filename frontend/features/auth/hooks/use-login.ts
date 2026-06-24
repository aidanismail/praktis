"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getMe, login } from "../api/auth.api";
import type { LoginRequest } from "../types/auth.type";
import { useAuthStore } from "@/stores/auth-store";

export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (payload: LoginRequest) => {
      const tokenResponse = await login(payload);
      const user = await getMe(tokenResponse.access_token);

      return {
        accessToken: tokenResponse.access_token,
        user
      };
    },

    onSuccess: ({ accessToken, user }) => {
      setAuth({ accessToken, user });

      if (user.force_password_change) {
        router.replace("/change-password");
        return;
      }

      router.replace("/dashboard");
    }
  });
}
