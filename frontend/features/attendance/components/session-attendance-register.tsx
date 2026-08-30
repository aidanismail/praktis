"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Search,
  Users
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { useCourseRoster } from "@/features/courses/hooks/use-course-roster";
import type { EnrolledStudent } from "@/features/courses/types/enrolled-student.type";
import type { CourseSession } from "@/features/sessions/types/session.type";
import { ApiError } from "@/lib/api/client";
import {
  attendanceStatusSchema,
  attendanceRegisterSchema,
  type AttendanceRegisterValues
} from "../schemas/attendance.schema";
import {
  useSaveSessionAttendance,
  useSessionAttendance
} from "../hooks/use-session-attendance";
import type {
  AttendanceRecord,
  AttendanceStatus
} from "../types/attendance.type";

type SessionAttendanceRegisterProps = {
  userId: string;
  courseId: string;
  session: CourseSession;
  onDirtyChange?: (dirty: boolean) => void;
};

const statusOptions: Array<{ value: AttendanceStatus; label: string }> = [
  { value: "hadir", label: "Hadir" },
  { value: "sakit", label: "Sakit" },
  { value: "izin", label: "Izin" },
  { value: "alfa", label: "Alfa" }
];

function buildRegisterValues(
  students: EnrolledStudent[],
  records: AttendanceRecord[]
): AttendanceRegisterValues {
  const statusByStudent = new Map(
    records.map((record) => [record.student_id, record.status])
  );

  return {
    records: [...students]
      .sort((left, right) => {
        const byUsername = left.username.localeCompare(right.username);
        return byUsername !== 0 ? byUsername : left.id.localeCompare(right.id);
      })
      .map((student) => ({
        student_id: student.id,
        status: statusByStudent.get(student.id) ?? ""
      }))
  };
}

function getRequestError(error: Error | null, kind: "roster" | "attendance") {
  if (!error) {
    return null;
  }

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
    if (error.status === 400)
      return "Attendance was not saved because this session window is not open.";
    if (error.status === 401)
      return "Your session expired. Sign in again before saving.";
    if (error.status === 403)
      return "You are not allowed to record attendance for this course.";
    if (error.status === 404)
      return "The session no longer exists. Refresh before retrying.";
    if (error.status === 422)
      return "The roster changed or contains an invalid student. Your edits were kept; review the refreshed data before saving again.";
    if (error.status === 429)
      return "Too many attendance saves were requested. Wait a moment before retrying manually.";
  }

  return "Attendance was not saved because of a network or server problem. Your edits are still available.";
}

function AttendanceRequestError({
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
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={isRetrying ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

function AttendanceRegisterForm({
  userId,
  courseId,
  session,
  students,
  records,
  onRosterRefresh,
  onAttendanceRefresh,
  onDirtyChange
}: SessionAttendanceRegisterProps & {
  students: EnrolledStudent[];
  records: AttendanceRecord[];
  onRosterRefresh: () => Promise<{ data?: EnrolledStudent[] }>;
  onAttendanceRefresh: () => Promise<{ data?: AttendanceRecord[] }>;
}) {
  const [search, setSearch] = useState("");
  const serverValues = useMemo(
    () => buildRegisterValues(students, records),
    [students, records]
  );
  const serverSignature = useMemo(
    () => JSON.stringify(serverValues.records),
    [serverValues]
  );
  const appliedServerSignature = useRef(serverSignature);
  const saveMutation = useSaveSessionAttendance({
    userId,
    courseId,
    sessionId: session.id
  });
  const form = useForm<AttendanceRegisterValues>({
    resolver: zodResolver(attendanceRegisterSchema),
    defaultValues: serverValues
  });
  const { fields } = useFieldArray({
    control: form.control,
    name: "records"
  });
  const watchedRecords = useWatch({ control: form.control, name: "records" });
  const isEditable = session.attendance_status === "OPEN";
  const studentById = useMemo(
    () => new Map(students.map((student) => [student.id, student])),
    [students]
  );
  const unmatchedRecords = records.filter(
    (record) => !studentById.has(record.student_id)
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
  const counts = watchedRecords.reduce(
    (current, record) => {
      const key = record.status || "unrecorded";
      current[key] += 1;
      return current;
    },
    { hadir: 0, sakit: 0, izin: 0, alfa: 0, unrecorded: 0 }
  );
  const saveError = getSaveError(saveMutation.error);

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

  async function submitAttendance(values: AttendanceRegisterValues) {
    saveMutation.reset();

    try {
      await saveMutation.mutateAsync({
        records: values.records.map((record) => ({
          student_id: record.student_id,
          status: attendanceStatusSchema.parse(record.status)
        }))
      });
      form.reset(values);
      onDirtyChange?.(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        const dirtyStatuses = new Map(
          form
            .getValues()
            .records.filter((_, index) =>
              form.getFieldState(`records.${index}.status`).isDirty
            )
            .map((record) => [record.student_id, record.status])
        );
        const [rosterResult, attendanceResult] = await Promise.all([
          onRosterRefresh(),
          onAttendanceRefresh()
        ]);
        const refreshedStudents = rosterResult.data ?? students;
        const refreshedRecords = attendanceResult.data ?? records;
        const refreshedValues = buildRegisterValues(
          refreshedStudents,
          refreshedRecords
        );

        form.reset(refreshedValues);
        refreshedValues.records.forEach((record, index) => {
          const dirtyStatus = dirtyStatuses.get(record.student_id);

          if (dirtyStatus !== undefined && dirtyStatus !== record.status) {
            form.setValue(`records.${index}.status`, dirtyStatus, {
              shouldDirty: true,
              shouldValidate: true
            });
          }
        });
        onDirtyChange?.(dirtyStatuses.size > 0);
      }
    }
  }

  function setAllPresent() {
    if (!window.confirm("Set every Praktikan to Hadir locally? Nothing is saved until you choose Save attendance.")) {
      return;
    }

    fields.forEach((_, index) => {
      form.setValue(`records.${index}.status`, "hadir", {
        shouldDirty: true,
        shouldValidate: true
      });
    });
    onDirtyChange?.(true);
  }

  function resetChanges() {
    if (form.formState.isDirty && !window.confirm("Discard all unsaved attendance changes?")) {
      return;
    }

    form.reset(serverValues);
    appliedServerSignature.current = serverSignature;
    saveMutation.reset();
    onDirtyChange?.(false);
  }

  return (
    <form onSubmit={form.handleSubmit(submitAttendance)} noValidate>
      <div className="grid gap-3 sm:grid-cols-5">
        {[
          ["Recorded", students.length - counts.unrecorded],
          ["Hadir", counts.hadir],
          ["Sakit", counts.sakit],
          ["Izin", counts.izin],
          ["Alfa", counts.alfa]
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-slate-50 p-3 text-center">
            <span className="block text-lg font-bold text-slate-950">{value}</span>
            <span className="text-xs font-medium text-slate-600">{label}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-sm text-slate-600" aria-live="polite">
        {counts.unrecorded} of {students.length} Praktikan currently show Not recorded.
      </p>

      {!isEditable ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Saved attendance remains readable, but editing is available only while this session&apos;s attendance window is Open.
        </div>
      ) : null}

      {unmatchedRecords.length > 0 ? (
        <div role="alert" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {unmatchedRecords.length} saved attendance {unmatchedRecords.length === 1 ? "record does" : "records do"} not match the current course roster. The unmatched data was not silently assigned to another student.
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <label className="min-w-0 flex-1 sm:max-w-sm">
          <span className="text-sm font-semibold text-slate-800">Search by NPM or email</span>
          <span className="relative mt-1.5 block">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              placeholder="Search roster"
            />
          </span>
        </label>

        {isEditable ? (
          <button type="button" onClick={setAllPresent} disabled={saveMutation.isPending || students.length === 0} className="inline-flex min-h-11 items-center rounded-xl border border-emerald-300 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60">
            Set all to Hadir
          </button>
        ) : null}
      </div>

      {visibleIndexes.length === 0 ? (
        <div role="status" className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">
          No Praktikan match this search.
        </div>
      ) : (
        <ul className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
          {visibleIndexes.map(({ field, index, student }) => {
            if (!student) return null;
            const registration = form.register(`records.${index}.status`);
            const rowError = form.formState.errors.records?.[index]?.status;

            return (
              <li key={field.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-center">
                <div className="min-w-0">
                  <p className="wrap-break-word font-mono text-sm font-semibold text-slate-950">{student.username}</p>
                  <p className="mt-1 break-all text-sm text-slate-600">{student.email}</p>
                </div>
                <div>
                  <label htmlFor={`attendance-${field.id}`} className="sr-only">
                    Attendance status for {student.username}
                  </label>
                  <select
                    id={`attendance-${field.id}`}
                    disabled={!isEditable || saveMutation.isPending}
                    aria-invalid={Boolean(rowError)}
                    {...registration}
                    onChange={(event) => {
                      registration.onChange(event);
                      saveMutation.reset();
                      onDirtyChange?.(true);
                    }}
                    className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    <option value="">Not recorded</option>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {rowError ? <p role="alert" className="mt-1 text-xs text-red-700">{rowError.message}</p> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {saveError ? <p role="alert" className="mt-4 text-sm text-red-700">{saveError}</p> : null}
      {saveMutation.isSuccess ? (
        <p role="status" aria-live="polite" className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {saveMutation.data.message}
        </p>
      ) : null}

      {isEditable ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saveMutation.isPending || !form.formState.isDirty || counts.unrecorded > 0 || students.length === 0}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {saveMutation.isPending ? "Saving..." : "Save attendance"}
          </button>
          <button type="button" onClick={resetChanges} disabled={saveMutation.isPending || !form.formState.isDirty} className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
            Reset changes
          </button>
        </div>
      ) : null}
    </form>
  );
}

export function SessionAttendanceRegister({
  userId,
  courseId,
  session,
  onDirtyChange
}: SessionAttendanceRegisterProps) {
  const rosterQuery = useCourseRoster({ userId, courseId, enabled: true });
  const attendanceQuery = useSessionAttendance({
    userId,
    courseId,
    sessionId: session.id,
    enabled: true
  });
  const rosterError = getRequestError(rosterQuery.error, "roster");
  const attendanceError = getRequestError(attendanceQuery.error, "attendance");

  return (
    <section aria-labelledby="session-attendance-heading" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Users className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="session-attendance-heading" className="text-xl font-semibold text-slate-950">Attendance register</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Every enrolled Praktikan must receive an explicit status before a full-roster save.</p>
        </div>
      </div>

      {rosterQuery.isPending || attendanceQuery.isPending ? (
        <div role="status" aria-live="polite" className="mt-5 flex min-h-40 items-center justify-center rounded-2xl bg-slate-50">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="ml-3 text-sm text-slate-600">Loading roster and saved attendance...</span>
        </div>
      ) : null}

      {!rosterQuery.isPending && rosterError ? (
        <div className="mt-5">
          <AttendanceRequestError message={rosterError} onRetry={() => void rosterQuery.refetch()} isRetrying={rosterQuery.isFetching} />
        </div>
      ) : null}

      {!attendanceQuery.isPending && attendanceError ? (
        <div className="mt-5">
          <AttendanceRequestError message={attendanceError} onRetry={() => void attendanceQuery.refetch()} isRetrying={attendanceQuery.isFetching} />
        </div>
      ) : null}

      {!rosterQuery.isPending && !attendanceQuery.isPending && !rosterError && !attendanceError ? (
        rosterQuery.data && rosterQuery.data.length > 0 ? (
          <div className="mt-5">
            <AttendanceRegisterForm
              userId={userId}
              courseId={courseId}
              session={session}
              students={rosterQuery.data}
              records={attendanceQuery.data ?? []}
              onRosterRefresh={() => rosterQuery.refetch()}
              onAttendanceRefresh={() => attendanceQuery.refetch()}
              onDirtyChange={onDirtyChange}
            />
          </div>
        ) : (
          <div role="status" className="mt-5 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <Users className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
            <h3 className="mt-3 font-semibold text-slate-950">No Praktikan enrolled</h3>
            <p className="mt-1 text-sm text-slate-600">Attendance cannot be recorded until this course has an enrolled roster.</p>
          </div>
        )
      ) : null}
    </section>
  );
}
