import type { Metadata } from "next";
import { ReportItemForm } from "@/components/items/report-item-form";

export const metadata: Metadata = { title: "Report an item", robots: { index: false, follow: false } };
export default function ReportItemPage() { return <ReportItemForm />; }
