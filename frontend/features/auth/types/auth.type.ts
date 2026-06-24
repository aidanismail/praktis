import type { User } from "@/types/user.type";

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export type AuthMeResponse = User;

export type ChangePasswordRequest = {
  current_password: string;
  new_password: string;
};

export type AuthState = {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
};
