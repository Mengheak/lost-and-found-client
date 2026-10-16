import { Suspense } from "react";
import { ItemDetail } from "@/components/items/item-detail";

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ItemDetail key={id} id={id} />;
}

export default function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<div className="container page-stack" role="status">Loading item…</div>}><Detail params={params} /></Suspense>;
}
