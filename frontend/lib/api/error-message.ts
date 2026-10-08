import { ApiError } from "./client";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === "string" && error) {
    return error;
  }

  return fallback;
}
