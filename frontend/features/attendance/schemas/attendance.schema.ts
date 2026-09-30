import { z } from "zod";

export const attendanceStatusSchema = z.enum([
  "hadir",
  "sakit",
  "izin",
  "alfa"
]);

const attendanceRowSchema = z.object({
  student_id: z.string().uuid("Invalid student identifier"),
  status: z.union([attendanceStatusSchema, z.literal("")])
});

export const attendanceRegisterSchema = z
  .object({
    records: z.array(attendanceRowSchema)
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

      if (record.status === "") {
        context.addIssue({
          code: "custom",
          path: ["records", index, "status"],
          message: "Choose an attendance status"
        });
      }
    });
  });

export type AttendanceRegisterValues = z.infer<typeof attendanceRegisterSchema>;
