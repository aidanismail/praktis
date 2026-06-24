"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { changePassword, getMe } from "../api/auth.api";
import type { ChangePasswordRequest } from "../types/auth.type";
import { useAuthStore } from "@/stores/auth-store";

export function useChangePassword() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: async (payload: ChangePasswordRequest) => {
      await changePassword(payload);
      const user = await getMe();
      return user;
    },

    onSuccess: (user) => {
      setUser(user);
      router.replace("/dashboard");
    },

    onError: () => {
      clearAuth();
    },
  });
}