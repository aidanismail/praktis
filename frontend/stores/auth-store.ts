import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/user.type";

type AuthStore = {
  accessToken: string | null;
  user: User | null;

  setAuth: (payload: { accessToken: string; user: User }) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,

      setAuth: ({ accessToken, user }) => {
        set({ accessToken, user });
      },

      setUser: (user) => {
        set({ user });
      },

      clearAuth: () => {
        set({ accessToken: null, user: null });
      },
    }),
    {
      name: "praktis-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    }
  )
);