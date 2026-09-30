export type AnnouncementAuthorRole =
  | "superadmin"
  | "asprak"
  | "praktikan"
  | "unknown";

export type AnnouncementComment = {
  id: string;
  announcement_id: string;
  author_id: string;
  author_username: string;
  author_role: AnnouncementAuthorRole;
  content: string;
  created_at: string;
};

export type Announcement = {
  id: string;
  course_id: string;
  author_id: string;
  author_username: string;
  author_role: AnnouncementAuthorRole;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  comments_count: number;
  comments: AnnouncementComment[];
};

export type CreateAnnouncementPayload = {
  title: string;
  content: string;
  is_pinned: boolean;
};

export type UpdateAnnouncementPayload = Partial<CreateAnnouncementPayload>;

export type CreateAnnouncementCommentPayload = {
  content: string;
};
