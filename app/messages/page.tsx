import type { Metadata } from "next";
import { Messages } from "@/components/messages/messages";

export const metadata: Metadata = { title: "Messages", robots: { index: false, follow: false } };

export default function MessagesPage() {
  return <Messages />;
}
