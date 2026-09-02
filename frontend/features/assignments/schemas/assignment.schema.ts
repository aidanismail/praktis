import { z } from "zod";
import {
  ASSIGNMENT_FILE_TYPES,
  type AssignmentFileType
} from "../types/assignment.type";

export const ASSIGNMENT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function getAllowedAssignmentFileTypes(
  value: string
): AssignmentFileType[] {
  const configuredTypes = new Set(
    value
      .split(",")
      .map((fileType) => fileType.trim().toLowerCase().replace(/^\./, ""))
      .filter(Boolean)
  );

  return ASSIGNMENT_FILE_TYPES.filter((fileType) =>
    configuredTypes.has(fileType)
  );
}

export function getAssignmentFileType(
  fileName: string
): AssignmentFileType | null {
  const extension = fileName.split(".").pop()?.trim().toLowerCase();

  return ASSIGNMENT_FILE_TYPES.find((fileType) => fileType === extension) ?? null;
}

export function createAssignmentSubmissionSchema(
  allowedFileTypes: readonly AssignmentFileType[]
) {
  const allowedLabel = allowedFileTypes
    .map((fileType) => fileType.toUpperCase())
    .join(", ");

  return z.object({
    file: z
      .custom<File>(
        (value) => typeof File !== "undefined" && value instanceof File,
        "Select a file to upload"
      )
      .refine(
        (file) =>
          typeof File !== "undefined" &&
          file instanceof File &&
          file.size > 0,
        "The selected file is empty"
      )
      .refine(
        (file) =>
          typeof File !== "undefined" &&
          file instanceof File &&
          file.size <= ASSIGNMENT_MAX_UPLOAD_BYTES,
        "The selected file must be 10 MiB or smaller"
      )
      .refine((file) => {
        if (typeof File === "undefined" || !(file instanceof File)) {
          return false;
        }

        const fileType = getAssignmentFileType(file.name);
        return fileType !== null && allowedFileTypes.includes(fileType);
      }, `Choose an allowed file type: ${allowedLabel}`)
  });
}

export type AssignmentSubmissionFormValues = z.infer<
  ReturnType<typeof createAssignmentSubmissionSchema>
>;

export const assignmentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title must be 255 characters or fewer"),
  description: z.string().trim(),
  due_date: z
    .string()
    .refine(
      (value) => value === "" || !Number.isNaN(new Date(value).getTime()),
      "Enter a valid due date"
    ),
  max_points: z
    .number()
    .int("Maximum points must be a whole number")
    .min(1, "Maximum points must be at least 1")
    .max(1000, "Maximum points cannot exceed 1000"),
  allowed_file_types: z
    .array(z.enum(ASSIGNMENT_FILE_TYPES))
    .min(1, "Select at least one allowed file type"),
  is_published: z.boolean()
});

export type AssignmentFormValues = z.infer<typeof assignmentSchema>;
