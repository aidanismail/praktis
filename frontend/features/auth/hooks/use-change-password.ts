"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { changePassword } from "../api/auth.api";
import type { ChangePasswordRequest } from "../types/auth.type";
import { useAuthStore } from "@/stores/auth-store";

export function useChangePassword() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: async (payload: ChangePasswordRequest) => {
      if (!accessToken) {
        throw new Error("Session expired. Please log in again.");
      }

      return changePassword(accessToken, payload);
    },

    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      router.replace("/dashboard");
    },

    onError: (error) => {
      if (error instanceof Error && error.message.includes("401")) {
        clearAuth();
        router.replace("/login");
      }
    }
  });
}
