/** Attendance lock state shown on session rows for admin and asprak. */
export function SessionStatusBadge({ status }: { status: string }) {
  if (status === "OPEN") {
    return (
      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
        Open
      </span>
    );
  }

  if (status === "CLOSED") {
    return (
      <span className="text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
        Locked
      </span>
    );
  }

  return (
    <span className="text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
      Scheduled
    </span>
  );
}
