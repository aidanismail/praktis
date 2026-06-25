import { LoginForm } from "./login-form";

export function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <section className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-6xl items-center gap-10 ">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
