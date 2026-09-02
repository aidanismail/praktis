"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MessageCircle, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  useAddAnnouncementComment,
  useDeleteAnnouncementComment
} from "../hooks/use-course-announcements";
import {
  announcementCommentSchema,
  type AnnouncementCommentFormValues
} from "../schemas/announcement.schema";
import type { AnnouncementComment } from "../types/announcement.type";

type AnnouncementCommentsProps = {
  userId: string;
  courseId: string;
  announcementId: string;
  comments: AnnouncementComment[];
};

const commentDateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short"
});

function formatCommentDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : commentDateFormatter.format(date);
}

export function AnnouncementComments({
  userId,
  courseId,
  announcementId,
  comments
}: AnnouncementCommentsProps) {
  const [confirmingCommentId, setConfirmingCommentId] = useState<string | null>(null);
  const addMutation = useAddAnnouncementComment({ userId, courseId });
  const deleteMutation = useDeleteAnnouncementComment({ userId, courseId });
  const formId = `comment-${announcementId}`;
  const form = useForm<AnnouncementCommentFormValues>({
    resolver: zodResolver(announcementCommentSchema),
    defaultValues: { content: "" }
  });

  function onSubmit(values: AnnouncementCommentFormValues) {
    addMutation.reset();
    addMutation.mutate(
      { announcementId, payload: values },
      { onSuccess: () => form.reset() }
    );
  }

  function deleteComment(commentId: string) {
    deleteMutation.reset();
    deleteMutation.mutate(
      { announcementId, commentId },
      { onSuccess: () => setConfirmingCommentId(null) }
    );
  }

  return (
    <div className="mt-5 border-t border-slate-200 pt-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        Discussion ({comments.length})
      </div>

      {comments.length > 0 ? (
        <ul className="mt-4 space-y-3" aria-label="Announcement comments">
          {comments.map((comment) => {
            const canDelete = comment.author_id === userId;
            const isConfirming = confirmingCommentId === comment.id;
            const isDeleting =
              deleteMutation.isPending &&
              deleteMutation.variables?.commentId === comment.id;

            return (
              <li key={comment.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {comment.author_username}
                      <span className="ml-2 text-xs font-normal uppercase tracking-wide text-slate-500">
                        {comment.author_role}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatCommentDate(comment.created_at)}
                    </p>
                  </div>

                  {canDelete ? (
                    isConfirming ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmingCommentId(null)}
                          disabled={isDeleting}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 disabled:opacity-60"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteComment(comment.id)}
                          disabled={isDeleting}
                          className="inline-flex items-center rounded-lg bg-red-700 px-2 py-1 text-xs font-medium text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:opacity-60"
                        >
                          {isDeleting ? "Deleting..." : "Confirm delete"}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          deleteMutation.reset();
                          setConfirmingCommentId(comment.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Delete
                      </button>
                    )
                  ) : null}
                </div>
                <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-700">
                  {comment.content}
                </p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500">No comments yet.</p>
      )}

      {deleteMutation.isError ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {deleteMutation.error.message}
        </p>
      ) : null}

      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4">
        <div className="flex items-center justify-between text-sm font-medium text-slate-800">
          <label htmlFor={formId}>Add a comment</label>
          <span className="text-[11px] font-normal text-slate-400">
            {(form.watch("content") || "").length} / 1000
          </span>
        </div>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <textarea
              id={formId}
              rows={2}
              maxLength={1000}
              disabled={addMutation.isPending}
              aria-invalid={Boolean(form.formState.errors.content)}
              aria-describedby={form.formState.errors.content ? `${formId}-error` : undefined}
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 disabled:bg-slate-100"
              placeholder="Ask a question or add context (max 1000 characters)..."
              {...form.register("content")}
            />
            {form.formState.errors.content ? (
              <p id={`${formId}-error`} className="mt-1 text-sm text-red-600">
                {form.formState.errors.content.message}
              </p>
            ) : null}
          </div>
          <button
            type="submit"
            disabled={addMutation.isPending}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {addMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            {addMutation.isPending ? "Sending..." : "Comment"}
          </button>
        </div>
        {addMutation.isError ? (
          <p role="alert" className="mt-2 text-sm text-red-700">
            {addMutation.error.message}
          </p>
        ) : null}
        {addMutation.isSuccess ? (
          <p role="status" className="mt-2 text-sm text-emerald-700">
            Comment added successfully.
          </p>
        ) : null}
      </form>
    </div>
  );
}
