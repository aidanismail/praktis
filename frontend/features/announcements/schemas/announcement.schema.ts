import { z } from "zod";

export const announcementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title must be 255 characters or fewer"),
  content: z.string().trim().min(1, "Announcement content is required"),
  is_pinned: z.boolean()
});

export type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export const announcementCommentSchema = z.object({
  content: z.string().trim().min(1, "Comment cannot be empty")
});

export type AnnouncementCommentFormValues = z.infer<
  typeof announcementCommentSchema
>;
