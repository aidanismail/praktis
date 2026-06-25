"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from "../schemas/auth.schema";
import { useChangePassword } from "../hooks/use-change-password";

export function ChangePasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const changePasswordMutation = useChangePassword();

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  function onSubmit(values: ChangePasswordFormValues) {
    changePasswordMutation.mutate({
      old_password: values.current_password,
      new_password: values.new_password,
    });
  }

  return (
    <div className="w-full rounded-3xl border border-white/10 bg-white/95 p-7 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="mb-7">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
          <ShieldCheck className="h-6 w-6" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Change your password
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          For account safety, first-time users must replace their generated
          password before accessing Praktis.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {changePasswordMutation.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {changePasswordMutation.error instanceof Error
              ? changePasswordMutation.error.message
              : "Failed to change password."}
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
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            {...form.register("current_password")}
          />

          {form.formState.errors.current_password ? (
            <p className="text-sm text-red-600">
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
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pr-10 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              {...form.register("new_password")}
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md text-slate-400 transition hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
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
            <p className="text-sm text-red-600">
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
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            {...form.register("confirm_password")}
          />

          {form.formState.errors.confirm_password ? (
            <p className="text-sm text-red-600">
              {form.formState.errors.confirm_password.message}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={changePasswordMutation.isPending}
          className="flex h-11 w-full items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
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

        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-center text-xs leading-5 text-slate-500">
            You will be redirected to the dashboard after your password is
            updated successfully.
          </p>
        </div>
      </form>
    </div>
  );
}