"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLoginMutation, useRegisterMutation } from "@/store/api/auth-api";
import { authError, PASSWORD_HINT, validPassword } from "@/lib/auth";
import { GoogleSignIn } from "./google-sign-in";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const register = mode === "register";
  const router = useRouter();
  const [login, loginState] = useLoginMutation();
  const [signUp, registerState] = useRegisterMutation();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [googleBusy, setGoogleBusy] = useState(false);
  const busy = loginState.isLoading || registerState.isLoading || googleBusy;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    setMessage("");
    setPasswordError("");
    if (register && !validPassword(password)) {
      setPasswordError(PASSWORD_HINT);
      return;
    }
    if (register && password !== data.get("confirmPassword")) {
      setPasswordError("The passwords do not match.");
      return;
    }
    try {
      if (register)
        await signUp({
          email,
          password,
          name: String(data.get("name") || "").trim(),
          phone: String(data.get("phone") || "").trim(),
        }).unwrap();
      else await login({ email, password }).unwrap();
      form.reset();
      router.replace("/account");
      router.refresh();
    } catch (error) {
      setMessage(authError(error));
    }
  }
  return (
    <div className="container auth-page">
      <section className="auth-panel">
        <p className="eyebrow">Lost & Found</p>
        <h1>{register ? "Join the community." : "Welcome back."}</h1>
        <p className="muted">
          {register
            ? "A small act of kindness starts with you."
            : "Sign in to your Lost & Found account."}
        </p>
        <GoogleSignIn
          disabled={loginState.isLoading || registerState.isLoading}
          onBusyChange={setGoogleBusy}
        />
        <div className="auth-divider">or continue with email</div>
        <form className="section-stack" onSubmit={submit}>
          {register && (
            <Input label="Full name" name="name" autoComplete="name" required maxLength={255} />
          )}
          <Input
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={255}
          />
          {register && (
            <Input
              label="Phone number (optional)"
              name="phone"
              type="tel"
              autoComplete="tel"
              maxLength={50}
            />
          )}
          <div className="section-stack">
            <Input
              label="Password"
              name="password"
              type={visible ? "text" : "password"}
              autoComplete={register ? "new-password" : "current-password"}
              required
              hint={register ? PASSWORD_HINT : undefined}
              error={passwordError}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVisible(!visible)}
              aria-pressed={visible}
            >
              {visible ? (
                <EyeOff size={18} aria-hidden="true" />
              ) : (
                <Eye size={18} aria-hidden="true" />
              )}
              {visible ? "Hide password" : "Show password"}
            </Button>
          </div>
          {register && (
            <Input
              label="Confirm password"
              name="confirmPassword"
              type={visible ? "text" : "password"}
              autoComplete="new-password"
              required
            />
          )}
          {message && (
            <p role="alert" className="field-error">
              {message}
            </p>
          )}
          <Button
            type="submit"
            disabled={googleBusy}
            loading={loginState.isLoading || registerState.isLoading}
          >
            {register ? (
              <UserPlus size={18} aria-hidden="true" />
            ) : (
              <LogIn size={18} aria-hidden="true" />
            )}
            {register ? "Create account" : "Sign in"}
          </Button>
        </form>
        <p className="muted">
          {register ? "Already have an account? " : "New here? "}
          <Link href={register ? "/login" : "/register"}>
            {register ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </section>
    </div>
  );
}
