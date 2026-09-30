import { AuthGuard } from "@/features/auth/components/auth-guard";
import { ChangePasswordPage } from "@/features/auth/components/change-password-page";

export default function Page() {
  return (
    <AuthGuard>
      <ChangePasswordPage />
    </AuthGuard>
  );
}