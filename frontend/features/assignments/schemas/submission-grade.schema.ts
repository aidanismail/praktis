import { z } from "zod";

export function createSubmissionGradeSchema(maxPoints: number) {
  return z.object({
    score: z
      .string()
      .trim()
      .min(1, "Score is required")
      .refine(
        (value) => Number.isFinite(Number(value)),
        "Enter a valid numeric score"
      )
      .refine((value) => Number(value) >= 0, "Score cannot be negative")
      .refine(
        (value) => Number(value) <= maxPoints,
        `Score cannot exceed ${maxPoints}`
      ),
    feedback: z.string().trim()
  });
}

export type SubmissionGradeFormValues = z.infer<
  ReturnType<typeof createSubmissionGradeSchema>
>;
