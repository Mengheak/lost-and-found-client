export type ItemStatus = "OPEN" | "RETURNED" | "CLOSED";
export interface Category {
  id: string;
  name: string;
  iconUrl: string | null;
}
export interface Item {
  id: string;
  type: "LOST" | "FOUND";
  name: string;
  description: string | null;
  brand: string | null;
  color: string | null;
  photoUrls: string[];
  locationLat: number | null;
  locationLng: number | null;
  dateTime: string | null;
  status: ItemStatus;
  rewardAmount: number | null;
  storageLocation: string | null;
  owner: { id: string; name: string; ratingAvg: number; profilePhotoUrl: string } | null;
  category: Category | null;
  createdAt: string;
  returnedAt: string | null;
}
export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
export interface ItemFilters {
  query: string;
  type: "all" | "lost" | "found";
  categoryId: string;
  status: "" | ItemStatus;
  page: number;
}
export const PAGE_SIZE = 12;
export const STATUS_LABELS: Record<ItemStatus, string> = {
  OPEN: "Open",
  RETURNED: "Returned",
  CLOSED: "Closed",
};
export function itemSearchParams(filters: ItemFilters) {
  const params = new URLSearchParams({
    page: String(filters.page),
    size: String(PAGE_SIZE),
    sort: "createdAt,desc",
  });
  if (filters.query.trim()) params.set("q", filters.query.trim());
  if (filters.type !== "all") params.set("type", filters.type.toUpperCase());
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.status) params.set("status", filters.status);
  return params.toString();
}
export function formatItemDate(value: string | null) {
  if (!value || Number.isNaN(Date.parse(value))) return "Date not provided";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Phnom_Penh",
  }).format(new Date(value));
}
export function itemLocation(item: Item) {
  if (item.storageLocation) return item.storageLocation;
  if (item.locationLat != null && item.locationLng != null)
    return `${item.locationLat.toFixed(4)}, ${item.locationLng.toFixed(4)}`;
  return "Location not provided";
}
