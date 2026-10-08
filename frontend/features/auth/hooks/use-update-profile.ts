"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { updateProfile } from "../api/auth.api";
import { authQueryKeys } from "../constants/auth-query-keys";

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: (payload: { name: string }) => updateProfile(payload),
    retry: false,
    onSuccess: (user) => {
      // AuthGuard syncs the store from this query, so update both.
      queryClient.setQueryData(authQueryKeys.currentUser(), user);
      setUser(user);
    }
  });
}
