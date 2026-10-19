"use client";

import Link from "next/link";
import { LogIn, ClipboardList } from "lucide-react";
import { useSessionQuery } from "@/store/api/auth-api";
import { Avatar } from "@/components/ui/avatar";

export function AuthNavigation() {
  const { data, isLoading, isError } = useSessionQuery(undefined, { pollingInterval: 60000 });
  if (isLoading)
    return (
      <span className="muted" role="status">
        Checking session…
      </span>
    );
  return data?.user && !isError ? (
    <>
      <Link
        className="nav-link icon-action"
        href="/my-reports"
        aria-label="My reports"
        title="My reports"
      >
        <ClipboardList size={18} aria-hidden="true" />
      </Link>
      <Link
        className="nav-link icon-action"
        href="/account"
        aria-label="My account"
        title="My account"
      >
        <Avatar src={data.user.profilePhotoUrl} name={data.user.name} decorative />
      </Link>
    </>
  ) : (
    <Link
      className="ui-button ui-button--primary icon-action no-underline"
      href="/login"
      aria-label="Sign in"
      title="Sign in"
    >
      <LogIn size={18} aria-hidden="true" />
    </Link>
  );
}
