type ApiErrorDetail =
  | string
  | {
      message?: string;
      detail?: string;
      msg?: string;
    }
  | Array<{
      msg?: string;
      message?: string;
      loc?: Array<string | number>;
    }>;

type ApiErrorResponse = {
  detail?: ApiErrorDetail;
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

function getErrorMessage(data: unknown): string {
  if (!data) {
    return "Request failed";
  }

  if (typeof data === "string") {
    return data;
  }

  const errorData = data as ApiErrorResponse;

  if (typeof errorData.message === "string") {
    return errorData.message;
  }

  if (typeof errorData.detail === "string") {
    return errorData.detail;
  }

  if (Array.isArray(errorData.detail)) {
    return errorData.detail
      .map((item) => {
        if (item.msg) return item.msg;
        if (item.message) return item.message;
        return "Validation error";
      })
      .join(", ");
  }

  if (
    errorData.detail &&
    typeof errorData.detail === "object" &&
    !Array.isArray(errorData.detail)
  ) {
    if (typeof errorData.detail.message === "string") {
      return errorData.detail.message;
    }

    if (typeof errorData.detail.detail === "string") {
      return errorData.detail.detail;
    }

    if (typeof errorData.detail.msg === "string") {
      return errorData.detail.msg;
    }
  }

  return "Request failed";
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const isFormData = options.body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...options,
      credentials: "include",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
    const message = isOffline
      ? "You appear to be offline. Please check your internet connection."
      : "Unable to connect to the server. Please verify your network connection or try again.";
    throw new ApiError(message, 0, { originalError: err });
  }

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new ApiError(getErrorMessage(data), response.status, data);
  }

  return data as T;
}
