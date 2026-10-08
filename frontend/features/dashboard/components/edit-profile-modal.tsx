"use client";

import { useState, type RefObject } from "react";
import type { User } from "@/types/user.type";
import { useModalFocusTrap } from "@/hooks/use-modal-focus-trap";
import { useUpdateProfile } from "@/features/auth/hooks/use-update-profile";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { XIcon, WarningCircleIcon, UserIcon } from "@phosphor-icons/react";

type EditProfileModalProps = {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
};

export function EditProfileModal({
  user,
  isOpen,
  onClose,
  onSuccess,
  returnFocusRef,
}: EditProfileModalProps) {
  const [name, setName] = useState(user.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const updateProfileMutation = useUpdateProfile();
  const isSubmitting = updateProfileMutation.isPending;

  const modalRef = useModalFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
    returnFocusRef,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name.");
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({ name: trimmed });
      onSuccess?.("Your display name has been updated.");
      onClose();
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(err, "Couldn't update your name. Please try again.")
      );
    }
  };

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-modal-title"
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl border border-slate-200 p-6 w-full max-w-md shadow-xl space-y-4 animate-apple-modal">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4
              id="edit-profile-modal-title"
              className="font-bold text-sm text-slate-900 flex items-center gap-2"
            >
              <UserIcon className="w-4 h-4 text-slate-800" />
              <span>Edit Display Name</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Change the name displayed across courses, rosters, and assignments.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs apple-press transition-colors"
          >
            <XIcon className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2 animate-apple-fade">
            <WarningCircleIcon className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label
              htmlFor="edit-profile-name"
              className="block font-semibold text-slate-700 mb-1"
            >
              Full Name
            </label>
            <input
              id="edit-profile-name"
              type="text"
              required
              autoFocus
              maxLength={100}
              placeholder="e.g. Plastic Trees"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow duration-150"
            />
          </div>

          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1.5 text-[11px] text-slate-500">
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Username / NPM:</span>
              <span className="font-semibold text-slate-700">{user.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Email:</span>
              <span className="font-semibold text-slate-700 truncate max-w-[200px]">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-500">Role:</span>
              <span className="font-semibold text-slate-700 capitalize">{user.role}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
