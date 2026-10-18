"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";
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
      <Link className="nav-link" href="/messages">
        Messages
      </Link>
      <Link className="nav-link" href="/my-reports">
        My reports
      </Link>
      <Link className="nav-link" href="/account">
        <Avatar src={data.user.profilePhotoUrl} name={data.user.name} decorative />
        My account
      </Link>
    </>
  ) : (
    <Link className="ui-button ui-button--primary no-underline" href="/login">
      <LogIn size={18} aria-hidden="true" />
      Sign in
    </Link>
  );
}
