import { z } from "zod";

const decimalScorePattern = /^(?:\d+(?:\.\d*)?|\.\d+)$/;

export const gradeScoreInputSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || decimalScorePattern.test(value), {
    message: "Enter a number from 0 to 100"
  })
  .refine((value) => {
    if (value === "") return true;
    const score = Number(value);
    return Number.isFinite(score) && score >= 0 && score <= 100;
  }, "Score must be between 0 and 100");

const gradeRowSchema = z.object({
  student_id: z.string().uuid("Invalid student identifier"),
  score: gradeScoreInputSchema
});

export const gradebookSchema = z
  .object({
    records: z.array(gradeRowSchema)
  })
  .superRefine((value, context) => {
    const seen = new Set<string>();

    value.records.forEach((record, index) => {
      if (seen.has(record.student_id)) {
        context.addIssue({
          code: "custom",
          path: ["records", index, "student_id"],
          message: "Duplicate student identifier"
        });
      }
      seen.add(record.student_id);
    });
  });

export type GradebookValues = z.infer<typeof gradebookSchema>;

export function parseGradeScore(value: string) {
  const parsed = gradeScoreInputSchema.parse(value);
  return parsed === "" ? null : Number(parsed);
}
