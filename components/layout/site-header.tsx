"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Plus,
  Compass,
  ClipboardList,
  Bookmark,
  ScanLine,
  PackageSearch,
  ArrowUpRight,
} from "lucide-react";
import { APP, ROUTES } from "@/lib/constants";
import { AuthNavigation } from "@/components/auth/auth-navigation";

const navigation = [
  { href: "/", label: "Community board", icon: Compass },
  { href: "/items", label: "Browse items", icon: Search },
  { href: "/items/search", label: "Smart search", icon: ScanLine },
  { href: "/my-reports", label: "My reports", icon: ClipboardList },
  { href: "/saved-items", label: "Saved items", icon: Bookmark },
];

export function SiteHeader() {
  const pathname = usePathname();
  const current = navigation.find((item) => item.href === pathname)?.label ?? "Your community";
  return (
    <>
      <aside className="workspace-sidebar">
        <Link className="brand" href={ROUTES.home} aria-label="Lost & Found home">
          <span className="brand-mark">
            <PackageSearch size={23} aria-hidden="true" />
          </span>
          <span className="brand-label">
            Lost & Found<span>COMMUNITY WORKSPACE</span>
          </span>
        </Link>
        <p className="workspace-label">Workspace</p>
        <nav aria-label="Main navigation" className="workspace-navigation">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="workspace-link"
              aria-current={pathname === href ? "page" : undefined}
              title={label}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="eyebrow">A little help goes a long way</span>
          <p>{APP.description}</p>
          <Link href={ROUTES.reportItem}>
            Share a report <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </aside>
      <header className="site-header">
        <div className="container header-inner">
          <p className="workspace-breadcrumb">
            <span>Workspace</span>
            <span aria-hidden="true">/</span>
            {current}
          </p>
          <nav aria-label="Account and actions" className="row">
            <Link className="nav-link header-report" href={ROUTES.reportItem}>
              <Plus size={18} aria-hidden="true" />
              <span>Report item</span>
            </Link>
            <AuthNavigation />
          </nav>
        </div>
      </header>
    </>
  );
}
