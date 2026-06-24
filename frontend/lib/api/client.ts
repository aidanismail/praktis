const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

type ApiErrorResponse = {
  detail?: string;
  message?: string;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const errorData = data as ApiErrorResponse | null;

    throw new ApiError(
      errorData?.detail || errorData?.message || "Request failed",
      response.status,
      data
    );
  }

  return data as T;
}