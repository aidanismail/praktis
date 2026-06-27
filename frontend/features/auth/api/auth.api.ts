import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  AuthMeResponse,
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
} from "../types/auth.type";

export function login(payload: LoginRequest) {
  return apiClient<LoginResponse>(API_ENDPOINTS.auth.login, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMe() {
  return apiClient<AuthMeResponse>(API_ENDPOINTS.auth.me, {
    method: "GET",
  });
}

export function logout() {
  return apiClient<string>(API_ENDPOINTS.auth.logout, {
    method: "POST",
  });
}

export function changePassword(payload: ChangePasswordRequest) {
  return apiClient<AuthMeResponse>(API_ENDPOINTS.auth.changePassword, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}