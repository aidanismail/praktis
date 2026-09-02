"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, LockKeyhole, UserRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ProductLogo } from "@/components/branding/product-logo";

import { loginSchema, type LoginFormValues } from "../schemas/auth.schema";
import { useLogin } from "../hooks/use-login";

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
    <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/95 p-7 shadow-2xl shadow-black/20 backdrop-blur">
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

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Gunakan akun yang telah dibuat untuk melanjutkan.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {loginMutation.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loginMutation.error instanceof Error
              ? loginMutation.error.message
              : "Login failed. Please check your credentials."}
          </div>
        ) : null}

        <div className="space-y-2">
          <label
            htmlFor="username"
            className="text-sm font-medium text-slate-800"
          >
            Username
          </label>

          <div className="relative">
            <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              id="username"
              type="text"
              placeholder="e.g. 140810230075"
              autoComplete="username"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pl-10 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              {...form.register("username")}
            />
          </div>

          {form.formState.errors.username ? (
            <p className="text-sm text-red-600">
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
            <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 pl-10 pr-10 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              {...form.register("password")}
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

          {form.formState.errors.password ? (
            <p className="text-sm text-red-600">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-brand px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loginMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>

        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-center text-xs leading-5 text-slate-500">
            Pengguna baru akan diminta untuk mengubah kata sandi yang telah
            dibuatkan untuk mereka sebelum mengakses dasbor.
          </p>
        </div>
      </form>
    </div>
  );
}
