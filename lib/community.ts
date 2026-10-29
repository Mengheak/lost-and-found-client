import type { Item } from "./items";
import type { AuthUser } from "./auth";

export interface SavedItem {
  id: string;
  item: Item;
  savedAt: string;
}
export interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
export interface PublicProfile {
  id: string;
  name: string;
  profilePhotoUrl: string | null;
  ratingAvg: number;
  memberSince: string;
}
export interface Rating {
  id: string;
  fromUser: { id: string; name: string };
  toUserId: string;
  itemId: string;
  score: number;
  comment: string | null;
  createdAt: string;
}
export interface AdminUser extends AuthUser {
  ratingAvg: number;
  banned: boolean;
  banExpiresAt: string | null;
}
export interface UserBan {
  id: string;
  userId: string;
  reason: string;
  createdAt: string;
  expiresAt: string | null;
  active: boolean;
  revokedAt: string | null;
  revocationReason: string | null;
}

export function requestError(error: unknown) {
  if (error && typeof error === "object" && "data" in error) {
    const data = error.data;
    if (data && typeof data === "object" && "message" in data && typeof data.message === "string")
      return data.message;
  }
  return "Could not confirm the request. Refresh before retrying.";
}
