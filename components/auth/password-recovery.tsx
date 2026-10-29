"use client";
import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRecoverPasswordMutation } from "@/store/api/community-api";
import { authApi } from "@/store/api/auth-api";
import { useAppDispatch } from "@/store/hooks";
import { PASSWORD_HINT, validPassword } from "@/lib/auth";
import { requestError } from "@/lib/community";

export function PasswordRecovery({ reset = false }: { reset?: boolean }) {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const validToken = /^[A-Za-z0-9_-]{43}$/.test(token);
  const [recover, state] = useRecoverPasswordMutation();
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.isLoading) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password") || "");
    setMessage("");
    if (reset && (!validPassword(password) || password !== data.get("confirmation"))) {
      setMessage("Check that your passwords match. " + PASSWORD_HINT);
      return;
    }
    try {
      const result = await recover(
        reset
          ? { token, newPassword: password }
          : { email: String(data.get("email") || "").trim() },
      ).unwrap();
      form.reset();
      setDone(true);
      setMessage(result.message);
      if (reset) dispatch(authApi.util.resetApiState());
    } catch (error) {
      setMessage(requestError(error));
    }
  }
  return (
    <div className="container auth-page">
      <section className="auth-panel">
        <p className="eyebrow">Account recovery</p>
        <h1>{reset ? "Choose a new password" : "Forgot your password?"}</h1>
        {reset && !validToken ? (
          <p role="alert">
            This reset link is missing or invalid.{" "}
            <Link href="/forgot-password">Request a new link</Link>.
          </p>
        ) : (
          !done && (
            <form className="section-stack" onSubmit={submit}>
              {reset ? (
                <>
                  <Input
                    label="New password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    hint={PASSWORD_HINT}
                  />
                  <Input
                    label="Confirm new password"
                    name="confirmation"
                    type="password"
                    autoComplete="new-password"
                    required
                  />
                </>
              ) : (
                <>
                  <p className="muted">
                    Enter your email and we’ll send you a link to reset your password.
                  </p>
                  <Input
                    label="Email address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={255}
                    required
                  />
                </>
              )}
              <Button type="submit" loading={state.isLoading}>
                {reset ? "Update password" : "Send reset link"}
              </Button>
            </form>
          )
        )}
        {message && <p role={done ? "status" : "alert"}>{message}</p>}
        {reset && <Link href="/forgot-password">Request another reset link</Link>}
        <Link href="/login">Back to sign in</Link>
      </section>
    </div>
  );
}
