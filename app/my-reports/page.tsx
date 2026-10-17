import type { Metadata } from "next";
import { MyReports } from "@/components/items/my-reports";

export const metadata: Metadata = { title: "My reports", robots: { index: false, follow: false } };
export default function MyReportsPage() {
  return <MyReports />;
}
