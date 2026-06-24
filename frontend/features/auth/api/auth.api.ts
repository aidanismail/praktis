import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  AuthMeResponse,
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse
} from "../types/auth.type";

export function login(payload: LoginRequest) {
  return apiClient<LoginResponse>(API_ENDPOINTS.auth.login, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getMe(token: string) {
  return apiClient<AuthMeResponse>(API_ENDPOINTS.auth.me, {
    method: "GET",
    token
  });
}

export function changePassword(token: string, payload: ChangePasswordRequest) {
  return apiClient<AuthMeResponse>(API_ENDPOINTS.auth.changePassword, {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}
