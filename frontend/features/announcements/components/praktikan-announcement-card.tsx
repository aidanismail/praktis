import { Pin } from "lucide-react";
import type { Announcement } from "../types/announcement.type";
import { AnnouncementComments } from "./announcement-comments";

type PraktikanAnnouncementCardProps = {
  userId: string;
  courseId: string;
  announcement: Announcement;
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short"
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : dateFormatter.format(date);
}

export function PraktikanAnnouncementCard({ userId, courseId, announcement }: PraktikanAnnouncementCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        {announcement.is_pinned ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800"><Pin className="h-3.5 w-3.5" aria-hidden="true" />Pinned</span> : null}
        <span className="text-sm font-semibold text-slate-900">{announcement.author_username}</span>
        <span className="text-xs uppercase tracking-wide text-slate-500">{announcement.author_role}</span>
      </div>
      <p className="mt-2 text-xs text-slate-500"><time dateTime={announcement.created_at}>{formatDate(announcement.created_at)}</time></p>
      <h3 className="mt-5 wrap-break-word text-lg font-semibold text-slate-950">{announcement.title}</h3>
      <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm leading-7 text-slate-700">{announcement.content}</p>
      <AnnouncementComments
        userId={userId}
        courseId={courseId}
        announcementId={announcement.id}
        comments={announcement.comments}
        viewerRole="praktikan"
      />
    </article>
  );
}
