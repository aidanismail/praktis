"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Pin, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  useDeleteCourseAnnouncement,
  useUpdateCourseAnnouncement
} from "../hooks/use-course-announcements";
import {
  announcementSchema,
  type AnnouncementFormValues
} from "../schemas/announcement.schema";
import type { Announcement } from "../types/announcement.type";
import { AnnouncementComments } from "./announcement-comments";

type AnnouncementCardProps = {
  userId: string;
  courseId: string;
  announcement: Announcement;
};

const announcementDateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short"
});

function formatAnnouncementDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : announcementDateFormatter.format(date);
}

export function AnnouncementCard({
  userId,
  courseId,
  announcement
}: AnnouncementCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const updateMutation = useUpdateCourseAnnouncement({ userId, courseId });
  const deleteMutation = useDeleteCourseAnnouncement({ userId, courseId });
  const canManage = announcement.author_id === userId;
  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: announcement.title,
      content: announcement.content,
      is_pinned: announcement.is_pinned
    }
  });

  function startEditing() {
    updateMutation.reset();
    form.reset({
      title: announcement.title,
      content: announcement.content,
      is_pinned: announcement.is_pinned
    });
    setIsEditing(true);
  }

  function onUpdate(values: AnnouncementFormValues) {
    updateMutation.reset();
    updateMutation.mutate(
      { announcementId: announcement.id, payload: values },
      { onSuccess: () => setIsEditing(false) }
    );
  }

  function onDelete() {
    deleteMutation.reset();
    deleteMutation.mutate(announcement.id, {
      onSuccess: () => setIsConfirmingDelete(false)
    });
  }

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {announcement.is_pinned ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                <Pin className="h-3.5 w-3.5" aria-hidden="true" />
                Pinned
              </span>
            ) : null}
            <span className="text-sm font-semibold text-slate-900">
              {announcement.author_username}
            </span>
            <span className="text-xs uppercase tracking-wide text-slate-500">
              {announcement.author_role}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {formatAnnouncementDate(announcement.created_at)}
          </p>
        </div>

        {canManage && !isEditing ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startEditing}
              disabled={deleteMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800 disabled:opacity-60"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Edit
            </button>
            {!isConfirmingDelete ? (
              <button
                type="button"
                onClick={() => {
                  deleteMutation.reset();
                  setIsConfirmingDelete(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Delete
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {isConfirmingDelete ? (
        <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-950">
            Delete this announcement and all its comments?
          </p>
          <p className="mt-1 text-sm text-red-800">This action cannot be undone.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(false)}
              disabled={deleteMutation.isPending}
              className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleteMutation.isPending}
              className="inline-flex items-center rounded-xl bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:opacity-60"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              {deleteMutation.isPending ? "Deleting..." : "Confirm delete"}
            </button>
          </div>
          {deleteMutation.isError ? (
            <p className="mt-3 text-sm text-red-800">{deleteMutation.error.message}</p>
          ) : null}
        </div>
      ) : null}

      {isEditing ? (
        <form onSubmit={form.handleSubmit(onUpdate)} className="mt-5 space-y-4" aria-busy={updateMutation.isPending}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-950">Edit announcement</h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={updateMutation.isPending}
              aria-label="Cancel editing announcement"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800 disabled:opacity-60"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="space-y-2">
            <label htmlFor={`edit-title-${announcement.id}`} className="text-sm font-medium text-slate-800">
              Title
            </label>
            <input
              id={`edit-title-${announcement.id}`}
              type="text"
              maxLength={255}
              disabled={updateMutation.isPending}
              aria-invalid={Boolean(form.formState.errors.title)}
              aria-describedby={form.formState.errors.title ? `edit-title-${announcement.id}-error` : undefined}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 disabled:bg-slate-50"
              {...form.register("title")}
            />
            {form.formState.errors.title ? (
              <p id={`edit-title-${announcement.id}-error`} className="text-sm text-red-600">{form.formState.errors.title.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label htmlFor={`edit-content-${announcement.id}`} className="text-sm font-medium text-slate-800">
              Message
            </label>
            <textarea
              id={`edit-content-${announcement.id}`}
              rows={4}
              disabled={updateMutation.isPending}
              aria-invalid={Boolean(form.formState.errors.content)}
              aria-describedby={form.formState.errors.content ? `edit-content-${announcement.id}-error` : undefined}
              className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm leading-6 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 disabled:bg-slate-50"
              {...form.register("content")}
            />
            {form.formState.errors.content ? (
              <p id={`edit-content-${announcement.id}-error`} className="text-sm text-red-600">{form.formState.errors.content.message}</p>
            ) : null}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              disabled={updateMutation.isPending}
              className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
              {...form.register("is_pinned")}
            />
            <Pin className="h-4 w-4" aria-hidden="true" />
            Pin to the top
          </label>
          {updateMutation.isError ? (
            <p role="alert" className="text-sm text-red-700">{updateMutation.error.message}</p>
          ) : null}
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex min-h-10 items-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-60"
          >
            {updateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            {updateMutation.isPending ? "Saving..." : "Save changes"}
          </button>
        </form>
      ) : (
        <div className="mt-5">
          <h3 className="text-lg font-semibold text-slate-950">{announcement.title}</h3>
          <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm leading-7 text-slate-700">
            {announcement.content}
          </p>
        </div>
      )}

      {!isEditing && !isConfirmingDelete ? (
        <AnnouncementComments
          userId={userId}
          courseId={courseId}
          announcementId={announcement.id}
          comments={announcement.comments}
          viewerRole="asprak"
        />
      ) : null}
    </article>
  );
}
