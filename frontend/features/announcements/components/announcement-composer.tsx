"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Megaphone, Pin } from "lucide-react";
import { useForm } from "react-hook-form";
import { useCreateCourseAnnouncement } from "../hooks/use-course-announcements";
import {
  announcementSchema,
  type AnnouncementFormValues
} from "../schemas/announcement.schema";

type AnnouncementComposerProps = {
  userId: string;
  courseId: string;
};

export function AnnouncementComposer({
  userId,
  courseId
}: AnnouncementComposerProps) {
  const mutation = useCreateCourseAnnouncement({ userId, courseId });
  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      content: "",
      is_pinned: false
    }
  });

  function onSubmit(values: AnnouncementFormValues) {
    mutation.reset();
    mutation.mutate(values, {
      onSuccess: () => form.reset()
    });
  }

  return (
    <section
      aria-labelledby="announcement-composer-heading"
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Megaphone className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2
            id="announcement-composer-heading"
            className="font-semibold text-slate-950"
          >
            Post an announcement
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Share an update with everyone enrolled in this practicum course.
          </p>
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-5 space-y-4"
        aria-busy={mutation.isPending}
      >
        {mutation.isError ? (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {mutation.error.message}
          </p>
        ) : null}

        {mutation.isSuccess ? (
          <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Announcement posted successfully.
          </p>
        ) : null}

        <div className="space-y-2">
          <label htmlFor="announcement-title" className="text-sm font-medium text-slate-800">
            Title
          </label>
          <input
            id="announcement-title"
            type="text"
            maxLength={255}
            disabled={mutation.isPending}
            aria-invalid={Boolean(form.formState.errors.title)}
            aria-describedby={form.formState.errors.title ? "announcement-title-error" : undefined}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 disabled:cursor-not-allowed disabled:bg-slate-50"
            placeholder="What should your Praktikan know?"
            {...form.register("title")}
          />
          {form.formState.errors.title ? (
            <p id="announcement-title-error" className="text-sm text-red-600">
              {form.formState.errors.title.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="announcement-content" className="text-sm font-medium text-slate-800">
            Message
          </label>
          <textarea
            id="announcement-content"
            rows={4}
            disabled={mutation.isPending}
            aria-invalid={Boolean(form.formState.errors.content)}
            aria-describedby={form.formState.errors.content ? "announcement-content-error" : undefined}
            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 disabled:cursor-not-allowed disabled:bg-slate-50"
            placeholder="Write the course update here..."
            {...form.register("content")}
          />
          {form.formState.errors.content ? (
            <p id="announcement-content-error" className="text-sm text-red-600">
              {form.formState.errors.content.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              disabled={mutation.isPending}
              className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
              {...form.register("is_pinned")}
            />
            <Pin className="h-4 w-4" aria-hidden="true" />
            Pin to the top
          </label>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Posting...
              </>
            ) : (
              "Post announcement"
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
