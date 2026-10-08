"use client";

import { useState } from "react";
import { CheckIcon, PencilSimpleIcon, XIcon } from "@phosphor-icons/react";

type SessionTitleEditorProps = {
  title: string;
  onSave: (title: string) => Promise<void>;
};

export function SessionTitleEditor({ title, onSave }: SessionTitleEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEditing = () => {
    setDraft(title);
    setError(null);
    setIsEditing(true);
  };

  const cancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const save = async () => {
    const next = draft.trim();
    if (!next) {
      setError("Session name can't be empty.");
      return;
    }
    if (next === title) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(next);
      setIsEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't rename session.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="font-bold text-xs text-slate-900 truncate">{title}</span>
        <button
          type="button"
          onClick={startEditing}
          aria-label={`Rename ${title}`}
          title="Rename session"
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
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") cancel();
          }}
          maxLength={255}
          autoFocus
          disabled={isSaving}
          aria-label="Session name"
          aria-invalid={error ? true : undefined}
          className="h-8 w-56 max-w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isSaving}
          aria-label="Save session name"
          className="apple-press rounded-full p-1.5 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
        >
          <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={isSaving}
          aria-label="Cancel rename"
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
