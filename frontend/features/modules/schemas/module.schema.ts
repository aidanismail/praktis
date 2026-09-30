import { z } from "zod";
import {
  MODULE_FILE_EXTENSIONS,
  type ModuleFileExtension
} from "../types/module.type";

export const MODULE_MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

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
        message: "The file must be 25 MiB or smaller"
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
    .max(255, "Title must be 255 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or fewer")
});

export const moduleUploadSchema = moduleMetadataSchema.extend({
  file: moduleFileSchema
});

export type ModuleMetadataFormValues = z.infer<typeof moduleMetadataSchema>;

export type ModuleUploadFormValues = z.infer<typeof moduleUploadSchema>;
