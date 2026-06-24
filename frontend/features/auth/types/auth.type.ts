// src/features/auth/types/auth.type.ts

import type { User } from "@/types/user.type";

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  access_token?: string;
  token_type?: string;
  message?: string;
};

export type AuthMeResponse = User;

export type ChangePasswordRequest = {
  current_password: string;
  new_password: string;
};
