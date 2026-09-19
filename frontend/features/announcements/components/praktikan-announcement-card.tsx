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
    <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {announcement.is_pinned ? (
          <>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
              <Pin className="h-3.5 w-3.5" aria-hidden="true" />
              Pinned
            </span>
            <span className="text-slate-300" aria-hidden="true">·</span>
          </>
        ) : null}
        <span className="text-xs sm:text-sm font-semibold text-slate-950">{announcement.author_username}</span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{announcement.author_role}</span>
        <span className="text-slate-300" aria-hidden="true">·</span>
        <time dateTime={announcement.created_at} className="text-[11px] text-slate-400">{formatDate(announcement.created_at)}</time>
      </div>
      <h3 className="mt-3 wrap-break-word text-base font-bold text-slate-950 tracking-tight">{announcement.title}</h3>
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
