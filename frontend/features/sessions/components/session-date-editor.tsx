"use client";

import { useState } from "react";
import { CheckIcon, PencilSimpleIcon, XIcon } from "@phosphor-icons/react";
import { formatCalendarDate } from "@/lib/format/date";

type SessionDateEditorProps = {
  date: string;
  onSave: (date: string) => Promise<void>;
};

export function SessionDateEditor({ date, onSave }: SessionDateEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(date.slice(0, 10));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEditing = () => {
    setDraft(date.slice(0, 10));
    setError(null);
    setIsEditing(true);
  };

  const cancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const save = async () => {
    if (!draft) {
      setError("Pick a date.");
      return;
    }
    if (draft === date.slice(0, 10)) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(draft);
      setIsEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't change session date.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-xs text-slate-500 truncate">{formatCalendarDate(date)}</span>
        <button
          type="button"
          onClick={startEditing}
          aria-label={`Change date (currently ${formatCalendarDate(date)})`}
          title="Change date"
          className="apple-press shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700"
        >
          <PencilSimpleIcon className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="flex flex-col gap-1"
    >
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") cancel();
          }}
          autoFocus
          disabled={isSaving}
          aria-label="Session date"
          aria-invalid={error ? true : undefined}
          className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isSaving}
          aria-label="Save session date"
          className="apple-press rounded-full p-1.5 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
        >
          <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={isSaving}
          aria-label="Cancel date change"
          className="apple-press rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-60"
        >
          <XIcon className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-[11px] text-rose-700">
          {error}
        </p>
      ) : null}
    </form>
  );
}
