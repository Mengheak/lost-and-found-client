import type { ItemStatus } from "@/lib/items";

export interface Conversation {
  id: string;
  item: { id: string; name: string; type: "LOST" | "FOUND"; status: ItemStatus };
  userA: { id: string; name: string };
  userB: { id: string; name: string };
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export function chatError(error: unknown) {
  const status = error && typeof error === "object" && "status" in error ? error.status : null;
  if (status === 401) return "Your session expired. Please sign in again.";
  if (status === 403) return "You do not have access to this conversation.";
  if (status === 404) return "This item or conversation is no longer available.";
  return "Could not complete the request. Please try again.";
}
