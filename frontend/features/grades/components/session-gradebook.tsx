"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Loader2,
  RefreshCw,
  Search
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { useCourseRoster } from "@/features/courses/hooks/use-course-roster";
import type { EnrolledStudent } from "@/features/courses/types/enrolled-student.type";
import type { CourseSession } from "@/features/sessions/types/session.type";
import { ApiError } from "@/lib/api/client";
import {
  gradebookSchema,
  parseGradeScore,
  type GradebookValues
} from "../schemas/grade.schema";
import {
  useSaveSessionGrades,
  useSessionGrades
} from "../hooks/use-session-grades";
import type { SessionGrade } from "../types/grade.type";
import { GradePublicationControls } from "./grade-publication-controls";

type SessionGradebookProps = {
  userId: string;
  courseId: string;
  session: CourseSession;
  onDirtyChange?: (dirty: boolean) => void;
};

function buildGradebookValues(
  students: EnrolledStudent[],
  grades: SessionGrade[]
): GradebookValues {
  const scoreByStudent = new Map(
    grades.map((grade) => [grade.student_id, String(grade.score)])
  );

  return {
    records: [...students]
      .sort((left, right) => {
        const byUsername = left.username.localeCompare(right.username);
        return byUsername !== 0 ? byUsername : left.id.localeCompare(right.id);
      })
      .map((student) => ({
        student_id: student.id,
        score: scoreByStudent.get(student.id) ?? ""
      }))
  };
}

function getRequestError(error: Error | null, kind: "roster" | "grades") {
  if (!error) return null;

  if (error instanceof ApiError) {
    if (error.status === 401) return "Your session expired. Sign in again.";
    if (error.status === 403)
      return `You are not allowed to view this session ${kind}.`;
    if (error.status === 404)
      return "The course or session could not be found.";
    if (error.status === 422) return "The selected session link is invalid.";
  }

  return `The ${kind} could not be loaded because of a network or server problem.`;
}

function getSaveError(error: Error | null) {
  if (!error) return null;

  if (error instanceof ApiError) {
    if (error.status === 401)
      return "Your session expired. Sign in again before saving.";
    if (error.status === 403)
      return "You are not allowed to save grades for this course.";
    if (error.status === 404)
      return "The session no longer exists. Refresh before retrying.";
    if (error.status === 409)
      return "Grades were published elsewhere before this save completed. Your entries were kept; unpublish before retrying.";
    if (error.status === 422)
      return "A score or roster entry was rejected. Your edits were kept; review the refreshed roster before saving again.";
  }

  return "Grades were not saved because of a network or server problem. Your entries are still available.";
}

function GradeRequestError({
  message,
  onRetry,
  isRetrying
}: {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
        <div>
          <p className="text-sm text-red-800">{message}</p>
          <button type="button" onClick={onRetry} disabled={isRetrying} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
            <RefreshCw className={isRetrying ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

function GradebookForm({
  userId,
  courseId,
  session,
  students,
  grades,
  onRosterRefresh,
  onGradesRefresh,
  onDirtyChange
}: SessionGradebookProps & {
  students: EnrolledStudent[];
  grades: SessionGrade[];
  onRosterRefresh: () => Promise<{ data?: EnrolledStudent[] }>;
  onGradesRefresh: () => Promise<{ data?: SessionGrade[] }>;
}) {
  const [search, setSearch] = useState("");
  const serverValues = useMemo(
    () => buildGradebookValues(students, grades),
    [students, grades]
  );
  const serverSignature = useMemo(
    () => JSON.stringify(serverValues.records),
    [serverValues]
  );
  const appliedServerSignature = useRef(serverSignature);
  const saveMutation = useSaveSessionGrades({
    userId,
    courseId,
    sessionId: session.id
  });
  const form = useForm<GradebookValues>({
    resolver: zodResolver(gradebookSchema),
    defaultValues: serverValues
  });
  const { fields } = useFieldArray({ control: form.control, name: "records" });
  const watchedRecords = useWatch({ control: form.control, name: "records" });
  const studentById = useMemo(
    () => new Map(students.map((student) => [student.id, student])),
    [students]
  );
  const savedStudentIds = useMemo(
    () => new Set(grades.map((grade) => grade.student_id)),
    [grades]
  );
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const visibleIndexes = fields
    .map((field, index) => ({ field, index, student: studentById.get(field.student_id) }))
    .filter(({ student }) => {
      if (!student || normalizedSearch.length === 0) return Boolean(student);
      return (
        student.username.toLocaleLowerCase().includes(normalizedSearch) ||
        student.email.toLocaleLowerCase().includes(normalizedSearch)
      );
    });
  const enteredCount = watchedRecords.filter(
    (record) => record.score.trim() !== ""
  ).length;
  const hasClearedSavedGrade = watchedRecords.some(
    (record) =>
      savedStudentIds.has(record.student_id) && record.score.trim() === ""
  );
  const unmatchedGrades = grades.filter(
    (grade) => !studentById.has(grade.student_id)
  );
  const saveError = getSaveError(saveMutation.error);
  const isReadOnly = session.grades_published;

  useEffect(() => {
    if (
      !form.formState.isDirty &&
      appliedServerSignature.current !== serverSignature
    ) {
      appliedServerSignature.current = serverSignature;
      form.reset(serverValues);
    }
  }, [form, form.formState.isDirty, serverSignature, serverValues]);

  useEffect(() => {
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (!form.formState.isDirty) return;
      event.preventDefault();
    }

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [form.formState.isDirty]);

  async function submitGrades(values: GradebookValues) {
    saveMutation.reset();
    const payload = values.records.flatMap((record) => {
      const score = parseGradeScore(record.score);
      return score === null ? [] : [{ student_id: record.student_id, score }];
    });

    try {
      await saveMutation.mutateAsync({ records: payload });
      form.reset(values);
      onDirtyChange?.(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        const dirtyScores = new Map(
          form
            .getValues()
            .records.filter((_, index) =>
              form.getFieldState(`records.${index}.score`).isDirty
            )
            .map((record) => [record.student_id, record.score])
        );
        const [rosterResult, gradesResult] = await Promise.all([
          onRosterRefresh(),
          onGradesRefresh()
        ]);
        const refreshedValues = buildGradebookValues(
          rosterResult.data ?? students,
          gradesResult.data ?? grades
        );

        form.reset(refreshedValues);
        refreshedValues.records.forEach((record, index) => {
          const dirtyScore = dirtyScores.get(record.student_id);

          if (dirtyScore !== undefined && dirtyScore !== record.score) {
            form.setValue(`records.${index}.score`, dirtyScore, {
              shouldDirty: true,
              shouldValidate: true
            });
          }
        });
        onDirtyChange?.(dirtyScores.size > 0);
      }
    }
  }

  function resetChanges() {
    if (form.formState.isDirty && !window.confirm("Discard all unsaved grade changes?")) {
      return;
    }

    form.reset(serverValues);
    appliedServerSignature.current = serverSignature;
    saveMutation.reset();
    onDirtyChange?.(false);
  }

  return (
    <form onSubmit={form.handleSubmit(submitGrades)} noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <span className="block text-2xl font-bold text-slate-950">{grades.length}</span>
          <span className="text-sm text-slate-600">saved grade records</span>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <span className="block text-2xl font-bold text-slate-950">{students.length - grades.filter((grade) => studentById.has(grade.student_id)).length}</span>
          <span className="text-sm text-slate-600">currently ungraded Praktikan</span>
        </div>
      </div>

      {isReadOnly ? (
        <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
          Published grades are read-only. Unpublish them deliberately before making corrections.
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Blank rows remain ungraded and are omitted from the save payload. A previously saved grade cannot be deleted by clearing it; enter a replacement score or reset the row.
        </div>
      )}

      {hasClearedSavedGrade ? (
        <p role="alert" className="mt-3 text-sm text-amber-800">
          Restore or replace every cleared saved score before saving. The current API does not delete grade records.
        </p>
      ) : null}

      {unmatchedGrades.length > 0 ? (
        <p role="alert" className="mt-3 text-sm text-amber-800">
          {unmatchedGrades.length} saved grade {unmatchedGrades.length === 1 ? "record does" : "records do"} not match the current roster. No record was reassigned silently.
        </p>
      ) : null}

      <label className="mt-5 block sm:max-w-sm">
        <span className="text-sm font-semibold text-slate-800">Search by NPM or email</span>
        <span className="relative mt-1.5 block">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" placeholder="Search roster" />
        </span>
      </label>

      {visibleIndexes.length === 0 ? (
        <div role="status" className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">No Praktikan match this search.</div>
      ) : (
        <ul className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
          {visibleIndexes.map(({ field, index, student }) => {
            if (!student) return null;
            const registration = form.register(`records.${index}.score`);
            const rowError = form.formState.errors.records?.[index]?.score;

            return (
              <li key={field.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-center">
                <div className="min-w-0">
                  <p className="wrap-break-word font-mono text-sm font-semibold text-slate-950">{student.username}</p>
                  <p className="mt-1 break-all text-sm text-slate-600">{student.email}</p>
                </div>
                <div>
                  <label htmlFor={`grade-${field.id}`} className="sr-only">Score for {student.username}</label>
                  <input
                    id={`grade-${field.id}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="Ungraded"
                    disabled={isReadOnly || saveMutation.isPending}
                    aria-invalid={Boolean(rowError)}
                    {...registration}
                    onChange={(event) => {
                      registration.onChange(event);
                      saveMutation.reset();
                      onDirtyChange?.(true);
                    }}
                    className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                  {rowError ? <p role="alert" className="mt-1 text-xs text-red-700">{rowError.message}</p> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-3 text-sm text-slate-600">{enteredCount} of {students.length} rows currently contain a score.</p>
      {saveError ? <p role="alert" className="mt-3 text-sm text-red-700">{saveError}</p> : null}
      {saveMutation.isSuccess ? (
        <p role="status" aria-live="polite" className="mt-3 inline-flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {saveMutation.data.message}
        </p>
      ) : null}

      {!isReadOnly ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="submit" disabled={saveMutation.isPending || !form.formState.isDirty || enteredCount === 0 || hasClearedSavedGrade} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-700 px-4 text-sm font-semibold text-white transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60">
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {saveMutation.isPending ? "Saving..." : "Save draft grades"}
          </button>
          <button type="button" onClick={resetChanges} disabled={saveMutation.isPending || !form.formState.isDirty} className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60">Reset changes</button>
        </div>
      ) : null}
    </form>
  );
}

export function SessionGradebook({
  userId,
  courseId,
  session,
  onDirtyChange
}: SessionGradebookProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const rosterQuery = useCourseRoster({ userId, courseId, enabled: true });
  const gradesQuery = useSessionGrades({ userId, courseId, sessionId: session.id, enabled: true });
  const rosterError = getRequestError(rosterQuery.error, "roster");
  const gradesError = getRequestError(gradesQuery.error, "grades");

  function reportDirty(dirty: boolean) {
    setHasUnsavedChanges(dirty);
    onDirtyChange?.(dirty);
  }

  return (
    <section aria-labelledby="session-gradebook-heading" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
          <GraduationCap className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="session-gradebook-heading" className="text-xl font-semibold text-slate-950">Session gradebook</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Save private draft scores, then publish them deliberately to Praktikan.</p>
        </div>
      </div>

      {rosterQuery.isPending || gradesQuery.isPending ? (
        <div role="status" aria-live="polite" className="mt-5 flex min-h-40 items-center justify-center rounded-2xl bg-slate-50">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="ml-3 text-sm text-slate-600">Loading roster and saved grades...</span>
        </div>
      ) : null}

      {!rosterQuery.isPending && rosterError ? <div className="mt-5"><GradeRequestError message={rosterError} onRetry={() => void rosterQuery.refetch()} isRetrying={rosterQuery.isFetching} /></div> : null}
      {!gradesQuery.isPending && gradesError ? <div className="mt-5"><GradeRequestError message={gradesError} onRetry={() => void gradesQuery.refetch()} isRetrying={gradesQuery.isFetching} /></div> : null}

      {!rosterQuery.isPending && !gradesQuery.isPending && !rosterError && !gradesError ? (
        rosterQuery.data && rosterQuery.data.length > 0 ? (
          <div className="mt-5">
            <GradebookForm
              userId={userId}
              courseId={courseId}
              session={session}
              students={rosterQuery.data}
              grades={gradesQuery.data ?? []}
              onRosterRefresh={() => rosterQuery.refetch()}
              onGradesRefresh={() => gradesQuery.refetch()}
              onDirtyChange={reportDirty}
            />
            <GradePublicationControls
              userId={userId}
              courseId={courseId}
              session={session}
              savedGradeCount={(gradesQuery.data ?? []).length}
              rosterCount={rosterQuery.data.length}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          </div>
        ) : (
          <div role="status" className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <GraduationCap className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
            <h3 className="mt-3 font-semibold text-slate-950">No Praktikan enrolled</h3>
            <p className="mt-1 text-sm text-slate-600">Session grades cannot be recorded until the course has an enrolled roster.</p>
          </div>
        )
      ) : null}
    </section>
  );
}
