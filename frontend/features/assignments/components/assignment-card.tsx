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
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className={assignment.is_published ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>
              {assignment.is_published ? "Published" : "Draft"}
            </span>
            <span>·</span>
            <span>
              {assignment.due_date ? (
                <time dateTime={assignment.due_date}>
                  Due {formatAssignmentDate(assignment.due_date)}
                </time>
              ) : (
                "No deadline"
              )}
            </span>
          </div>

          <h3 className="mt-1.5 wrap-break-word text-base font-semibold text-slate-950">
            {assignment.title}
          </h3>
        </div>

        {viewerRole === "asprak" ? (
          <span className="text-xs font-medium text-slate-600">
            {assignment.submissions_count}{" "}
            {assignment.submissions_count === 1 ? "submission" : "submissions"}
          </span>
        ) : (
          <span className={`text-xs font-medium ${assignment.my_submission ? "text-emerald-700" : "text-slate-500"}`}>
            {assignment.my_submission
              ? assignment.my_submission.score === null
                ? "Turned in · Awaiting grade"
                : "Graded"
              : "Not turned in"}
          </span>
        )}
      </div>

      {assignment.description ? (
        <p className="mt-2.5 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-600">
          {assignment.description}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>{assignment.max_points} points</span>
          {allowedFileTypes.length > 0 ? (
            <span>Accepted: {allowedFileTypes.join(", ").toUpperCase()}</span>
          ) : null}
        </div>

        <Link
          href={getAssignmentDetailRoute(
            assignment.course_id,
            assignment.id
          )}
          className="inline-flex items-center font-semibold text-slate-900 hover:text-slate-700 hover:underline"
        >
          Open assignment
        </Link>
      </div>
    </article>
  );
}
