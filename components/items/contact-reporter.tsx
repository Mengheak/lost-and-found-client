"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSessionQuery } from "@/store/api/auth-api";
import { useStartConversationMutation } from "@/store/api/chat-api";
import { Button } from "@/components/ui/button";
import { chatError } from "@/lib/chat";
import type { Item } from "@/lib/items";

export function ContactReporter({ item }: { item: Item }) {
  const session = useSessionQuery();
  const [start, { isLoading }] = useStartConversationMutation();
  const [error, setError] = useState("");
  const router = useRouter();
  if (!item.owner || item.status !== "OPEN") return null;
  if (session.isLoading) return <p role="status">Checking messaging availability…</p>;
  if (session.isError && !("status" in session.error && session.error.status === 401))
    return (
      <Button variant="secondary" onClick={() => session.refetch()}>
        Retry session check
      </Button>
    );
  if (!session.data?.user)
    return (
      <Link href="/login" className="ui-button ui-button--primary">
        Sign in to contact reporter
      </Link>
    );
  if (session.data.user.id === item.owner.id)
    return <Link href="/my-reports">Manage your report</Link>;

  async function contact() {
    setError("");
    try {
      const conversation = await start({ itemId: item.id }).unwrap();
      router.push(`/messages/${conversation.id}`);
    } catch (error) {
      setError(chatError(error));
    }
  }

  return (
    <div className="section-stack">
      <Button loading={isLoading} onClick={contact}>
        Contact reporter
      </Button>
      <p className="muted">Send a private message to discuss this item and arrange a return.</p>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
