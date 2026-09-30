"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth-store";
import { logout } from "../api/auth.api";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: logout,
    retry: false,
    onSuccess: async () => {
      await queryClient.cancelQueries();
      queryClient.removeQueries();

      clearAuth();
      router.replace(ROUTES.login);
      router.refresh();
    }
  });
}
