import { z } from "zod";

function isValidCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const sessionFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Session title is required")
    .max(255, "Session title must be 255 characters or fewer"),
  date: z
    .string()
    .trim()
    .min(1, "Session date is required")
    .refine(isValidCalendarDate, "Enter a valid calendar date")
});

export type SessionFormValues = z.infer<typeof sessionFormSchema>;
