"use client";

import { IconLink } from "@/components/ui/icon-link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, LogIn } from "lucide-react";
import { useCompleteGoogleMutation } from "@/store/api/auth-api";
import { googleAuthError } from "@/lib/google-auth";

export function GoogleCallback() {
  const params = useSearchParams();
  const cancelled = params.has("error");
  const router = useRouter();
  const started = useRef(false);
  const [complete] = useCompleteGoogleMutation();
  const [error, setError] = useState("");
  useEffect(() => {
    // Completion is single-use. React Strict Mode must not submit it twice.
    if (cancelled || started.current) return;
    started.current = true;
    void complete()
      .unwrap()
      .then((result) => {
        if ("linked" in result) {
          router.replace("/account?google=linked");
          router.refresh();
          return;
        }
        router.replace("/account");
        router.refresh();
      })
      .catch((failure) => setError(googleAuthError(failure)));
  }, [cancelled, complete, router]);
  const message = cancelled ? "Google sign-in was cancelled or failed. Please start again." : error;
  return (
    <div className="container auth-page">
      <section className="auth-panel">
        <h1>{message ? "Let’s try again." : "Signing you in…"}</h1>
        {message ? (
          <>
            <p role="alert" className="field-error">
              {message}
            </p>
            <IconLink href="/login" label="Back to sign in">
              <LogIn size={18} aria-hidden="true" />
            </IconLink>
          </>
        ) : (
          <p role="status" className="row">
            <LoaderCircle size={20} className="spin" aria-hidden="true" />
            Completing your Google sign-in.
          </p>
        )}
      </section>
    </div>
  );
}
