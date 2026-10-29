import { SavedItems } from "@/components/community/saved-items";
export const metadata = { title: "Saved items", robots: { index: false, follow: false } };
export default function Page() {
  return <SavedItems />;
}
