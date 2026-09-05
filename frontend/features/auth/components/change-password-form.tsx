"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { ApiError } from "@/lib/api/client";
import { ProductLogo } from "@/components/branding/product-logo";

import {
  changePasswordSchema,
  type ChangePasswordFormValues
} from "../schemas/auth.schema";
import { useChangePassword } from "../hooks/use-change-password";

type ChangePasswordFormProps = { isForced: boolean };

function getChangePasswordError(error: Error) {
  if (!(error instanceof ApiError)) return "Couldn't update your password right now. Check your connection and try again.";
  if (error.status === 400) return "Current password didn't match. Double-check and try again.";
  if (error.status === 401) return "You've been signed out. Sign in again to continue.";
  if (error.status === 422) return "Password must be at least 8 characters long.";
  if (error.status === 429) return "Too many attempts. Take a quick breather and try again in a minute.";
  return "Couldn't update your password. Let's try that again.";
}

export function ChangePasswordForm({ isForced }: ChangePasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const changePasswordMutation = useChangePassword();

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: ""
    }
  });

  function onSubmit(values: ChangePasswordFormValues) {
    changePasswordMutation.mutate(
      {
        old_password: values.current_password,
        new_password: values.new_password
      },
      { onSuccess: () => form.reset() }
    );
  }

  return (
    <div className="w-full rounded-3xl border border-white/10 bg-white/95 p-7 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="mb-7">
        <ProductLogo
          size={48}
          alt="Praktis"
          priority
          className="mb-5 rounded-full shadow-xs"
        />

        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          {isForced ? "Let's secure your account" : "Update your password"}
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {isForced
            ? "Set a personal password before jumping into your dashboard."
            : "Choose a strong password you haven't used before."}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {changePasswordMutation.isError ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {getChangePasswordError(changePasswordMutation.error)}
          </div>
        ) : null}

        <div className="space-y-2">
          <label
            htmlFor="current_password"
            className="text-sm font-medium text-slate-800"
          >
            Current password
          </label>

          <input
            id="current_password"
            type="password"
            placeholder="Enter your current password"
            autoComplete="current-password"
            disabled={changePasswordMutation.isPending}
            aria-invalid={Boolean(form.formState.errors.current_password)}
            aria-describedby={
              form.formState.errors.current_password
                ? "current-password-error"
                : undefined
            }
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            {...form.register("current_password")}
          />

          {form.formState.errors.current_password ? (
            <p id="current-password-error" className="text-sm text-red-600">
              {form.formState.errors.current_password.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="new_password"
            className="text-sm font-medium text-slate-800"
          >
            New password
          </label>

          <div className="relative">
            <input
              id="new_password"
              type={showPassword ? "text" : "password"}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              disabled={changePasswordMutation.isPending}
              aria-invalid={Boolean(form.formState.errors.new_password)}
              aria-describedby={form.formState.errors.new_password ? "new-password-error" : undefined}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-10 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              {...form.register("new_password")}
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              disabled={changePasswordMutation.isPending}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-60"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {form.formState.errors.new_password ? (
            <p id="new-password-error" className="text-sm text-red-600">
              {form.formState.errors.new_password.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confirm_password"
            className="text-sm font-medium text-slate-800"
          >
            Confirm new password
          </label>

          <input
            id="confirm_password"
            type={showPassword ? "text" : "password"}
            placeholder="Repeat your new password"
            autoComplete="new-password"
            disabled={changePasswordMutation.isPending}
            aria-invalid={Boolean(form.formState.errors.confirm_password)}
            aria-describedby={form.formState.errors.confirm_password ? "confirm-password-error" : undefined}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            {...form.register("confirm_password")}
          />

          {form.formState.errors.confirm_password ? (
            <p id="confirm-password-error" className="text-sm text-red-600">
              {form.formState.errors.confirm_password.message}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={changePasswordMutation.isPending}
          className="flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {changePasswordMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating password...
            </>
          ) : (
            "Update password"
          )}
        </button>

        {!isForced ? (
          <Link href={ROUTES.dashboard} className="flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800">
            Never mind, take me back
          </Link>
        ) : null}

        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-center text-xs leading-5 text-slate-500">
            You&apos;ll head straight to your dashboard once your password is saved.
          </p>
        </div>
      </form>
    </div>
  );
}
