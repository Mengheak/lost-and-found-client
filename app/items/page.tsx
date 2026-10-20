import type { Metadata } from "next";
import { ItemsBrowser } from "@/components/items/items-browser";

export const metadata: Metadata = { title: "Browse items" };
export default function ItemsPage() {
  return <ItemsBrowser sidebar />;
}
