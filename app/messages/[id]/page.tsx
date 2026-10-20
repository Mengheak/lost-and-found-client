import { Suspense } from "react";
import type { Metadata } from "next";
import { Messages } from "@/components/messages/messages";

export const metadata: Metadata = {
  title: "Conversation",
  robots: { index: false, follow: false },
};

async function Conversation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Messages id={id} />;
}

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <p className="container page-stack" role="status">
          Loading conversation…
        </p>
      }
    >
      <Conversation params={params} />
    </Suspense>
  );
}
