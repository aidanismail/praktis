import { ChangePasswordForm } from "./change-password-form";

export function ChangePasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
      <div className="relative w-full max-w-md">
        <ChangePasswordForm />
      </div>
    </main>
  );
}
