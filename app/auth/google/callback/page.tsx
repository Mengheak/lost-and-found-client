import { Suspense } from "react";
import type { Metadata } from "next";
import { GoogleCallback } from "@/components/auth/google-callback";

export const metadata: Metadata = { title: "Google sign-in", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function GoogleCallbackPage() {
  return <Suspense fallback={<div className="container page-stack" role="status">Completing Google sign-in…</div>}><GoogleCallback /></Suspense>;
}
