"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ProductLogo } from "@/components/branding/product-logo";
import { AsteriskLoader } from "@/components/ui/asterisk-loader";

import { loginSchema, type LoginFormValues } from "../schemas/auth.schema";
import { useLogin } from "../hooks/use-login";
import { NotificationBanner } from "@/components/ui/notification-banner";
import {
  Eye,
  EyeSlash,
  LockKey,
  User
} from "@phosphor-icons/react";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  function onSubmit(values: LoginFormValues) {
    loginMutation.mutate(values);
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white p-7 shadow-2xl shadow-black/20">
      <div className="mb-7">
        <ProductLogo
          size={48}
          alt="Praktis"
          priority
          className="mb-5 rounded-full shadow-sm"
        />
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Sign in to Praktis
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Welcome back! Enter your details to jump into your labs.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {loginMutation.isError ? (
          <NotificationBanner
            variant="error"
            message={
              loginMutation.error instanceof Error
                ? loginMutation.error.message
                : "Couldn't sign you in. Double-check your username and password."
            }
          />
        ) : null}

        <div className="space-y-2">
          <label
            htmlFor="username"
            className="text-sm font-medium text-slate-800"
          >
            Username
          </label>

          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              id="username"
              type="text"
              placeholder="e.g. 140810230075"
              autoComplete="username"
              aria-invalid={Boolean(form.formState.errors.username)}
              aria-describedby={
                form.formState.errors.username ? "username-error" : undefined
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pl-10 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              {...form.register("username")}
            />
          </div>

          {form.formState.errors.username ? (
            <p id="username-error" className="text-sm text-red-600">
              {form.formState.errors.username.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-slate-800"
          >
            Password
          </label>

          <div className="relative">
            <LockKey className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              aria-invalid={Boolean(form.formState.errors.password)}
              aria-describedby={
                form.formState.errors.password ? "password-error" : undefined
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pl-10 pr-11 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              {...form.register("password")}
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-1 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeSlash className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {form.formState.errors.password ? (
            <p id="password-error" className="text-sm text-red-600">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="flex h-11 w-full cursor-pointer items-center justify-center rounded-full bg-slate-900 px-4 text-sm font-semibold text-white apple-press transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loginMutation.isPending ? (
            <>
              <AsteriskLoader className="mr-2 h-4 w-4" aria-hidden="true" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>
    </div>
  );
}
