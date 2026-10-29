import { Suspense } from "react";
import { PasswordRecovery } from "@/components/auth/password-recovery";
export const metadata = { title: "Password recovery", robots: { index: false, follow: false } };
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Loading recovery…</p>}>
      <PasswordRecovery />
    </Suspense>
  );
}
