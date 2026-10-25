import type { ItemStatus } from "@/lib/items";

export interface Conversation {
  id: string;
  item: { id: string; name: string; type: "LOST" | "FOUND"; status: ItemStatus };
  userA: { id: string; name: string; profilePhotoUrl: string | null; ratingAvg: number };
  userB: { id: string; name: string; profilePhotoUrl: string | null; ratingAvg: number };
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderProfilePhotoUrl: string | null;
  text: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export function chatError(error: unknown) {
  const status = error && typeof error === "object" && "status" in error ? error.status : null;
  if (status === 400)
    return "Check your message and photo. Use JPG or PNG, up to 5 MB and 20 million pixels.";
  if (status === 413) return "The photo is too large. Choose a photo no larger than 5 MB.";
  if (status === 401) return "Your session expired. Please sign in again.";
  if (status === 403) return "You do not have access to this conversation.";
  if (status === 404) return "This item or conversation is no longer available.";
  return "Could not complete the request. Please try again.";
}

export function validateChatImage(file: File): string | null {
  if (!["image/jpeg", "image/png"].includes(file.type)) return "Choose a JPG or PNG photo.";
  if (file.size === 0 || file.size > 5 * 1024 * 1024)
    return "Choose a nonempty photo no larger than 5 MB.";
  return null;
}
