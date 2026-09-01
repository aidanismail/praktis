import { ApiError, apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  ConfirmModuleUploadInput,
  ConfirmModuleUploadPayload,
  ConfirmModuleUploadResponse,
  CourseModule,
  ModuleMessageResponse,
  ModuleUploadIntentInput,
  ModuleUploadIntentPayload,
  ModuleUploadIntentResponse,
  UpdateModulePayload
} from "../types/module.type";

export function listCourseModules(courseId: string) {
  const searchParams = new URLSearchParams({
    course_id: courseId
  });

  return apiClient<CourseModule[]>(
    `${API_ENDPOINTS.modules.list}?${searchParams.toString()}`,
    {
      method: "GET"
    }
  );
}

export function requestCourseModuleUpload(
  courseId: string,
  input: ModuleUploadIntentInput
) {
  const payload: ModuleUploadIntentPayload = {
    ...input,
    course_id: courseId
  };

  return apiClient<ModuleUploadIntentResponse>(
    API_ENDPOINTS.modules.presignedUrl,
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
}

export async function uploadCourseModuleFile(uploadUrl: string, file: File) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    credentials: "omit",
    cache: "no-store",
    headers: {
      "Content-Type": file.type || "application/octet-stream"
    }
  });
  if (!response.ok) {
    const message =
      response.status === 403
        ? "The storage upload link was rejected or has expired."
        : response.status === 413
          ? "Storage rejected the file because it is too large."
          : `Storage upload failed with status ${response.status}.`;

    throw new ApiError(message, response.status);
  }
}

export function confirmCourseModuleUpload(
  courseId: string,
  input: ConfirmModuleUploadInput
) {
  const payload: ConfirmModuleUploadPayload = {
    ...input,
    course_id: courseId
  };

  return apiClient<ConfirmModuleUploadResponse>(API_ENDPOINTS.modules.confirm, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateCourseModule(
  moduleId: string,
  payload: UpdateModulePayload
) {
  return apiClient<ModuleMessageResponse>(
    API_ENDPOINTS.modules.update(moduleId),
    {
      method: "PUT",
      body: JSON.stringify(payload)
    }
  );
}

export function publishCourseModule(moduleId: string) {
  return apiClient<ModuleMessageResponse>(
    API_ENDPOINTS.modules.publish(moduleId),
    {
      method: "POST"
    }
  );
}

export function unpublishCourseModule(moduleId: string) {
  return apiClient<ModuleMessageResponse>(
    API_ENDPOINTS.modules.unpublish(moduleId),
    {
      method: "POST"
    }
  );
}
