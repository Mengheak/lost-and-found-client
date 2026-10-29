import { Suspense } from "react";
import { PasswordRecovery } from "@/components/auth/password-recovery";
export const metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Loading recovery…</p>}>
      <PasswordRecovery reset />
    </Suspense>
  );
}
