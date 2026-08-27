import type { User } from "@/types/user.type";

export type LoginRequest = {
  username: string;
  password: string;
};

export type AuthMessageResponse = {
  message: string;
};

export type LoginResponse = AuthMessageResponse;
export type LogoutResponse = AuthMessageResponse;
export type AuthMeResponse = User;
export type ChangePasswordResponse = AuthMessageResponse;

export type ChangePasswordRequest = {
  old_password: string;
  new_password: string;
};
