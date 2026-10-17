import type { Metadata } from "next";
import { Account } from "@/components/auth/account";
export const metadata: Metadata = { title: "My account", robots: { index: false, follow: false } };
// Only the shell is public. Account data is validated by the server session endpoint.
export default function AccountPage() { return <Account />; }
