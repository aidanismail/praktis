export const MODULE_FILE_EXTENSIONS = [".pdf", ".docx"] as const;

export type ModuleFileExtension = (typeof MODULE_FILE_EXTENSIONS)[number];

export type CourseModule = {
  id: string;
  title: string;
  description: string | null;
  download_url: string;
  is_published: boolean;
  created_at: string;
  course_id: string | null;
  file_key: string | null;
};

export type ModuleUploadIntentInput = {
  title: string;
  description: string;
  file_extension: ModuleFileExtension;
};

export type ModuleUploadIntentPayload = ModuleUploadIntentInput & {
  course_id: string;
};

export type ModuleUploadIntentResponse = {
  upload_url: string;
  file_key: string;
};

export type ConfirmModuleUploadInput = {
  title: string;
  description: string;
  file_key: string;
};

export type ConfirmModuleUploadPayload = ConfirmModuleUploadInput & {
  course_id: string;
};

export type ConfirmModuleUploadResponse = {
  message: string;
  id: string;
};

export type UpdateModulePayload = {
  title: string;
  description: string;
};

export type ModuleMessageResponse = {
  message: string;
};
