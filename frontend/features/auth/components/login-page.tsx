import { LoginForm } from "./login-form";

export function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_30%)]" />

      <section className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div className="grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
