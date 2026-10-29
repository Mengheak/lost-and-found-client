"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { useSessionQuery } from "@/store/api/auth-api";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/lib/auth";

export function SessionGate({
  children,
  admin = false,
}: {
  children: (user: AuthUser) => ReactNode;
  admin?: boolean;
}) {
  const session = useSessionQuery(undefined, { pollingInterval: 60000 });
  if (session.isLoading) return <p role="status">Checking your session…</p>;
  if (session.isError || !session.data?.user)
    return (
      <div className="section-stack access-panel">
        <h2>
          {session.error && "status" in session.error && session.error.status === 401
            ? "Your community, in one place"
            : "Let’s reconnect"}
        </h2>
        <p role="alert">
          {session.error && "status" in session.error && session.error.status === 401
            ? "Please sign in to continue."
            : "Could not verify your session. Please retry or sign in."}
        </p>
        <div className="row">
          <Link className="ui-button ui-button--primary" href="/login">
            Sign in
          </Link>
          <Button variant="secondary" onClick={() => session.refetch()}>
            Check again
          </Button>
          <Link href="/items">Browse public reports</Link>
        </div>
      </div>
    );
  if (admin && session.data.user.role !== "ADMIN")
    return <p role="alert">Administrator access is required.</p>;
  return children(session.data.user);
}

export function Pagination({
  page,
  last,
  busy,
  onChange,
}: {
  page: number;
  last: boolean;
  busy: boolean;
  onChange: (page: number) => void;
}) {
  return (
    <nav className="row feature-pagination" aria-label="Pages">
      <Button variant="secondary" disabled={page === 0 || busy} onClick={() => onChange(page - 1)}>
        Previous
      </Button>
      <span>Page {page + 1}</span>
      <Button variant="secondary" disabled={last || busy} onClick={() => onChange(page + 1)}>
        Next
      </Button>
    </nav>
  );
}
export function LoadError({ retry }: { retry: () => void }) {
  return (
    <div className="section-stack access-panel" role="alert">
      <p>Unable to load this information. Please retry.</p>
      <Button onClick={retry}>Retry</Button>
    </div>
  );
}
