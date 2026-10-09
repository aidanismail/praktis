import { z } from "zod";
import {
  MODULE_FILE_EXTENSIONS,
  type ModuleFileExtension
} from "../types/module.type";

import {
  MODULE_DESCRIPTION_MAX_LENGTH,
  MODULE_MAX_UPLOAD_BYTES,
  MODULE_TITLE_MAX_LENGTH
} from "@/lib/generated/upload-rules";

export { MODULE_MAX_UPLOAD_BYTES };

export const MODULE_MAX_UPLOAD_LABEL = `${MODULE_MAX_UPLOAD_BYTES / (1024 * 1024)} MiB`;

export function getModuleFileExtension(
  fileName: string
): ModuleFileExtension | null {
  const normalizedName = fileName.trim().toLowerCase();

  return (
    MODULE_FILE_EXTENSIONS.find((extension) =>
      normalizedName.endsWith(extension)
    ) ?? null
  );
}

const moduleFileSchema = z
  .custom<File>(
    (value) => typeof File !== "undefined" && value instanceof File,
    "Select a PDF or DOCX file"
  )
  .superRefine((file, context) => {
    if (typeof File === "undefined" || !(file instanceof File)) {
      return;
    }

    if (file.size === 0) {
      context.addIssue({
        code: "custom",
        message: "The selected file is empty"
      });
    }

    if (file.size > MODULE_MAX_UPLOAD_BYTES) {
      context.addIssue({
        code: "custom",
        message: `The file must be ${MODULE_MAX_UPLOAD_LABEL} or smaller`
      });
    }

    if (!getModuleFileExtension(file.name)) {
      context.addIssue({
        code: "custom",
        message: "Only PDF and DOCX files are allowed"
      });
    }
  });

export const moduleMetadataSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(
      MODULE_TITLE_MAX_LENGTH,
      `Title must be ${MODULE_TITLE_MAX_LENGTH} characters or fewer`
    ),
  description: z
    .string()
    .trim()
    .max(
      MODULE_DESCRIPTION_MAX_LENGTH,
      `Description must be ${MODULE_DESCRIPTION_MAX_LENGTH} characters or fewer`
    )
});

export const moduleUploadSchema = moduleMetadataSchema.extend({
  file: moduleFileSchema
});

export type ModuleMetadataFormValues = z.infer<typeof moduleMetadataSchema>;

export type ModuleUploadFormValues = z.infer<typeof moduleUploadSchema>;
