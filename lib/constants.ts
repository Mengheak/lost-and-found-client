export const APP = {
  name: "Lost & Found",
  description: "Helping lost belongings find their way home.",
  logo: "/logo.svg",
} as const;

export const ROUTES = { home: "/", designSystem: "/design-system" } as const;

export const ITEM_TYPES = ["all", "lost", "found"] as const;
export type ItemTypeFilter = (typeof ITEM_TYPES)[number];

export const ITEM_TYPE_LABELS: Record<ItemTypeFilter, string> = {
  all: "All items",
  lost: "Lost items",
  found: "Found items",
};
