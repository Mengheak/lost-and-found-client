"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogIn,
  ClipboardList,
  MessageCircle,
  Bookmark,
  Shield,
  UserRound,
  ChevronDown,
} from "lucide-react";
import { NotificationLink } from "@/components/community/notifications";
import { useSessionQuery } from "@/store/api/auth-api";
import { Avatar } from "@/components/ui/avatar";

export function AuthNavigation() {
  const pathname = usePathname();
  const { data, isLoading, isError } = useSessionQuery(undefined, { pollingInterval: 60000 });
  if (isLoading)
    return (
      <span className="session-placeholder muted" role="status">
        Checking session…
      </span>
    );
  if (!data?.user || isError)
    return (
      <Link className="ui-button ui-button--primary no-underline" href="/login">
        <LogIn size={18} aria-hidden="true" />
        Sign in
      </Link>
    );
  const links = [
    { href: "/account", label: "My account", icon: UserRound },
    { href: "/my-reports", label: "My reports", icon: ClipboardList },
    { href: "/saved-items", label: "Saved items", icon: Bookmark },
    ...(data.user.role === "ADMIN"
      ? [{ href: "/admin", label: "Administration", icon: Shield }]
      : []),
  ];
  return (
    <>
      <Link
        className="nav-link header-action"
        href="/messages"
        aria-current={pathname.startsWith("/messages") ? "page" : undefined}
      >
        <MessageCircle size={18} aria-hidden="true" />
        <span>Messages</span>
      </Link>
      <NotificationLink key={data.user.id} userId={data.user.id} />
      <details
        className="account-menu"
        key={pathname}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.currentTarget.open = false;
            event.currentTarget.querySelector("summary")?.focus();
          }
        }}
      >
        <summary aria-label="Account navigation">
          <Avatar src={data.user.profilePhotoUrl} name={data.user.name} decorative />
          <span>Account</span>
          <ChevronDown size={16} aria-hidden="true" />
        </summary>
        <div className="account-menu-panel">
          <p className="account-menu-name">{data.user.name}</p>
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
              <Icon size={18} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </div>
      </details>
    </>
  );
}
