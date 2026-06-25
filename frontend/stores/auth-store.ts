import { create } from "zustand";
import type { User } from "@/types/user.type";

type AuthStore = {
  user: User | null;
  isAuthReady: boolean;

  setUser: (user: User) => void;
  clearAuth: () => void;
  setAuthReady: (value: boolean) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthReady: false,

  setUser: (user) => {
    set({ user, isAuthReady: true });
  },

  clearAuth: () => {
    set({ user: null, isAuthReady: true });
  },

  setAuthReady: (value) => {
    set({ isAuthReady: value });
  },
}));