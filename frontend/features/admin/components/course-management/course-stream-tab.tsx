"use client";

import { useState } from "react";
import {
  Clock,
  ChevronRight,
  CalendarCheck,
  Send,
  Pin,
  PinOff,
  Trash2,
  MessageSquare,
  X,
} from "lucide-react";
import type {
  AnnouncementItem,
  AssignmentItem,
  ClassSessionItem,
} from "../../api/admin.api";
import type { Course } from "@/features/courses/types/course.type";

type CourseStreamTabProps = {
  course: Course;
  announcements: AnnouncementItem[];
  assignments: AssignmentItem[];
  sessions: ClassSessionItem[];
  onOpenSubmissions: (assignment: AssignmentItem) => void;
  onNavigateToClasswork: () => void;
  onNavigateToSessions: (session?: ClassSessionItem) => void;
  onCreateAnnouncement: (data: {
    title: string;
    content: string;
    is_pinned?: boolean;
  }) => Promise<void>;
  onTogglePin: (announcement: AnnouncementItem) => Promise<void>;
  onDeleteAnnouncement: (announcementId: string) => Promise<void>;
  onAddComment: (announcementId: string, content: string) => Promise<void>;
  onDeleteComment: (announcementId: string, commentId: string) => Promise<void>;
};

export function CourseStreamTab({
  course,
  announcements,
  assignments,
  sessions,
  onOpenSubmissions,
  onNavigateToClasswork,
  onNavigateToSessions,
  onCreateAnnouncement,
  onTogglePin,
  onDeleteAnnouncement,
  onAddComment,
  onDeleteComment,
}: CourseStreamTabProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newPinned, setNewPinned] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    setIsPosting(true);
    try {
      await onCreateAnnouncement({
        title: newTitle.trim() || `Announcement for ${course.code}`,
        content: newContent.trim(),
        is_pinned: newPinned,
      });
      setNewTitle("");
      setNewContent("");
      setNewPinned(false);
    } finally {
      setIsPosting(false);
    }
  };

  const handleCommentSubmit = async (announcementId: string) => {
    const text = commentInputs[announcementId]?.trim();
    if (!text) return;
    await onAddComment(announcementId, text);
    setCommentInputs((prev) => ({ ...prev, [announcementId]: "" }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Side: Upcoming Deadlines & Next Session Interactive Cards */}
      <div className="space-y-4 lg:col-span-1">
        {/* Upcoming Deadlines Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-700" />
              <span>Upcoming</span>
            </h4>
            {assignments.length > 0 && (
              <button
                type="button"
                onClick={onNavigateToClasswork}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 hover:underline"
              >
                View all
              </button>
            )}
          </div>

          {assignments.filter((a) => a.due_date).length === 0 ? (
            <p className="text-xs text-slate-400">Woohoo, no work due soon!</p>
          ) : (
            <div className="space-y-1">
              {assignments
                .filter((a) => a.due_date)
                .slice(0, 3)
                .map((a) => (
                  <div
                    key={a.id}
                    onClick={() => onOpenSubmissions(a)}
                    className="group p-2 -mx-2 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-100"
                    title={`Open ${a.title} submissions`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-800 block truncate group-hover:text-slate-900 group-hover:underline">
                        {a.title}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
                      Due: {new Date(a.due_date!).toLocaleDateString()}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Next Session Card */}
        <div
          onClick={() => {
            if (sessions.length > 0) {
              onNavigateToSessions(sessions[0]);
            } else {
              onNavigateToSessions();
            }
          }}
          className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-2 hover:border-slate-300 hover:shadow-xs cursor-pointer group"
          title="Go to session attendance management"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-slate-700" />
              <span>Next Session</span>
            </h4>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {sessions.length === 0 ? (
            <p className="text-xs text-slate-400">No sessions scheduled.</p>
          ) : (
            <div className="text-xs space-y-0.5">
              <span className="font-semibold text-slate-800 block group-hover:text-slate-900 group-hover:underline truncate">
                {sessions[0].title}
              </span>
              <span className="text-[11px] text-slate-400 block font-medium">
                Date: {sessions[0].date}
              </span>
              <span className="text-[10px] font-semibold text-slate-600 inline-flex items-center gap-1 pt-1">
                <span>Manage Attendance</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Announcement Composer & Feed */}
      <div className="space-y-5 lg:col-span-3">
        {/* Announcement Composer */}
        <form
          onSubmit={handlePost}
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3.5"
        >
          <input
            type="text"
            placeholder="Announcement title / headline..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full text-xs font-semibold px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400"
          />
          <textarea
            placeholder="Announce something to your class..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            required
            rows={3}
            className="w-full text-xs p-4 border border-slate-200 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400 resize-none"
          />
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newPinned}
                onChange={(e) => setNewPinned(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <Pin className="w-3.5 h-3.5" />
              <span>Pin to top of stream</span>
            </label>
            <button
              type="submit"
              disabled={isPosting || !newContent.trim()}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Post Broadcast</span>
            </button>
          </div>
        </form>

        {/* Announcement Feed */}
        {announcements.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-xs text-slate-400">
            No announcements published in this stream yet.
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className={`bg-white rounded-3xl border p-5 shadow-xs space-y-3 transition-all ${
                  ann.is_pinned
                    ? "border-slate-400 bg-slate-50/40"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                      {ann.author_username
                        ? ann.author_username.slice(0, 2).toUpperCase()
                        : "AD"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-slate-900">
                          {ann.title}
                        </h4>
                        {ann.is_pinned && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900 text-white flex items-center gap-1">
                            <Pin className="w-3 h-3" />
                            <span>Pinned</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {ann.author_username} ({ann.author_role}) •{" "}
                        {new Date(ann.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onTogglePin(ann)}
                      className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                        ann.is_pinned
                          ? "text-slate-900 bg-slate-200 hover:bg-slate-300 font-semibold"
                          : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      }`}
                      title={ann.is_pinned ? "Unpin notice" : "Pin notice"}
                    >
                      {ann.is_pinned ? (
                        <PinOff className="w-3.5 h-3.5" />
                      ) : (
                        <Pin className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[10px]">
                        {ann.is_pinned ? "Unpin" : "Pin"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteAnnouncement(ann.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs transition-colors"
                      title="Delete notice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-700 whitespace-pre-wrap pl-12 leading-relaxed">
                  {ann.content}
                </div>

                {/* Discussion Comments */}
                <div className="pl-12 pt-2 border-t border-slate-100 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>
                      Discussion Comments ({ann.comments?.length || 0})
                    </span>
                  </div>

                  {ann.comments && ann.comments.length > 0 && (
                    <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl">
                      {ann.comments.map((c) => (
                        <div
                          key={c.id}
                          className="text-xs flex items-start justify-between gap-2 group"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">
                              {c.author_username}:{" "}
                            </span>
                            <span className="text-slate-600">{c.content}</span>
                            <span className="text-[10px] text-slate-400 ml-2">
                              {new Date(c.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onDeleteComment(ann.id, c.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Write a comment / question (max 1000 characters)..."
                      maxLength={1000}
                      value={commentInputs[ann.id] || ""}
                      onChange={(e) =>
                        setCommentInputs({
                          ...commentInputs,
                          [ann.id]: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCommentSubmit(ann.id);
                        }
                      }}
                      className="flex-1 text-xs px-4 py-2 border border-slate-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => handleCommentSubmit(ann.id)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full flex items-center gap-1 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

