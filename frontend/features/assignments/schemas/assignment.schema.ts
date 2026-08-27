import { z } from "zod";
import { ASSIGNMENT_FILE_TYPES } from "../types/assignment.type";

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
