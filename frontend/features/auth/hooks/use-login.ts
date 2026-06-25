"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getDefaultDashboardByRole, ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth-store";
import { getMe, login } from "../api/auth.api";
import type { LoginRequest } from "../types/auth.type";

export function useLogin() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (payload: LoginRequest) => {
      await login(payload);
      return getMe();
    },

    onSuccess: (user) => {
      setUser(user);

      if (user.force_password_change) {
        router.replace(ROUTES.changePassword);
        return;
      }

      router.replace(getDefaultDashboardByRole(user.role));
    }
  });
}
