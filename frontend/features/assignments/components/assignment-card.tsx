import { CalendarClock, FileText, Gauge, MoveRight, Users } from "lucide-react";
import Link from "next/link";
import { getAssignmentDetailRoute } from "@/constants/routes";
import type { Assignment } from "../types/assignment.type";

type AssignmentCardProps = {
  assignment: Assignment;
  viewerRole: "asprak" | "praktikan";
};

const assignmentDateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short"
});

function formatAssignmentDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : assignmentDateFormatter.format(date);
}

function getAllowedFileTypes(value: string) {
  return value
    .split(",")
    .map((fileType) => fileType.trim())
    .filter((fileType) => fileType.length > 0);
}

export function AssignmentCard({ assignment, viewerRole }: AssignmentCardProps) {
  const allowedFileTypes = getAllowedFileTypes(assignment.allowed_file_types);

  return (
    <article
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                assignment.is_published
                  ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                  : "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800"
              }
            >
              {assignment.is_published ? "Published" : "Draft"}
            </span>

            <span className="text-xs text-slate-500">
              Created{" "}
              <time dateTime={assignment.created_at}>
                {formatAssignmentDate(assignment.created_at)}
              </time>
            </span>
          </div>

          <h3 className="mt-3 wrap-break-word text-lg font-semibold text-slate-950">
            {assignment.title}
          </h3>
        </div>

        {viewerRole === "asprak" ? (
          <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
            <Users className="h-4 w-4" aria-hidden="true" />
            {assignment.submissions_count}{" "}
            {assignment.submissions_count === 1 ? "submission" : "submissions"}
          </div>
        ) : (
          <span className={assignment.my_submission ? "rounded-full bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800" : "rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"}>
            {assignment.my_submission
              ? assignment.my_submission.score === null
                ? "Submitted · Awaiting grade"
                : "Submitted · Graded"
              : "No recorded submission"}
          </span>
        )}
      </div>

      {assignment.description ? (
        <p
          className="mt-4 whitespace-pre-wrap wrap-break-word text-sm leading-7
          text-slate-700"
        >
          {assignment.description}
        </p>
      ) : (
        <p className="mt-4 text-sm italic text-slate-500">
          No additional instructions.
        </p>
      )}

      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <dt
            className="flex items-center gap-2 text-xs font-semibold uppercase
            tracking-wide text-slate-500"
          >
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            Due
          </dt>
          <dd className="mt-2 text-sm font-medium text-slate-900">
            {assignment.due_date ? (
              <time dateTime={assignment.due_date}>
                {formatAssignmentDate(assignment.due_date)}
              </time>
            ) : (
              "No deadline"
            )}
          </dd>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <dt
            className="flex items-center gap-2 text-xs font-semibold uppercase
            tracking-wide text-slate-500"
          >
            <Gauge className="h-4 w-4" aria-hidden="true" />
            Points
          </dt>
          <dd className="mt-2 text-sm font-medium text-slate-900">
            {assignment.max_points} maximum
          </dd>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <dt
            className="flex items-center gap-2 text-xs font-semibold uppercase
            tracking-wide text-slate-500"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            Formats
          </dt>
          <dd className="mt-2 flex flex-wrap gap-1.5">
            {allowedFileTypes.length > 0 ? (
              allowedFileTypes.map((fileType) => (
                <span
                  key={fileType}
                  className="rounded-lg bg-white px-2 py-1 text-xs font-semibold
                    uppercase text-slate-700"
                >
                  {fileType}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-600">None listed</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <Link
          href={getAssignmentDetailRoute(
            assignment.course_id,
            assignment.id
          )}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl text-sm font-semibold text-emerald-700 underline-offset-4 transition hover:text-emerald-800 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          Open assignment
          <MoveRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
