// src/features/auth/hooks/use-login.ts

"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getMe, login } from "../api/auth.api";
import type { LoginRequest } from "../types/auth.type";
import { useAuthStore } from "@/stores/auth-store";

export function useLogin() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (payload: LoginRequest) => {
      await login(payload);

      const user = await getMe();

      return user;
    },

    onSuccess: (user) => {
      setUser(user);

      if (user.force_password_change) {
        router.replace("/change-password");
        return;
      }

      router.replace("/dashboard");
    }
  });
}
