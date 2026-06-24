import { create } from "zustand";
import type { User } from "@/types/user.type";

type AuthStore = {
  user: User | null;

  setUser: (user: User) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,

  setUser: (user) => {
    set({ user });
  },

  clearAuth: () => {
    set({ user: null });
  },
}));