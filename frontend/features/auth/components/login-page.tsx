import { Suspense } from "react";
import { LoginForm } from "./login-form";

export function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#080E21] via-[#0D1836] to-[#14234B]">
      <section className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
