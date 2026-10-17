"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, MapPin, CalendarDays, UserRound, RotateCcw } from "lucide-react";
import { useGetItemQuery } from "@/store/api/items-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatItemDate, itemLocation, STATUS_LABELS } from "@/lib/items";
import { ItemPhoto } from "./item-photo";

export function ItemDetail({ id }: { id: string }) {
  const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const { data: item, isLoading, isError, error, refetch } = useGetItemQuery(id, { skip: !validId, pollingInterval: 300000 });
  const [photoIndex, setPhotoIndex] = useState(0);
  const notFound = !validId || (error && "status" in error && error.status === 404);
  return <div className="container page-stack">
    <Link className="back-link" href="/items"><ArrowLeft size={18} aria-hidden="true" />Back to items</Link>
    {isLoading ? <div role="status" className="browse-message">Loading item details…</div>
      : notFound ? <div className="browse-message"><h1>Item not found</h1><p className="muted">This report may have been removed or the link may be incorrect.</p></div>
      : isError ? <div className="browse-message" role="alert"><h1>Unable to load this item</h1><p className="muted">Please check your connection and try again.</p><Button onClick={() => refetch()}><RotateCcw size={18} aria-hidden="true" />Try again</Button></div>
      : item && <article className="detail-grid">
        <section className="section-stack" aria-label="Item photos">
          <div className="detail-photo"><ItemPhoto key={item.id} src={item.photoUrls?.[photoIndex] || item.photoUrls?.[0]} alt={item.name} /></div>
          {item.photoUrls?.length > 1 && <div className="photo-picker" role="group" aria-label="Choose a photo">{item.photoUrls.map((src, index) => <button key={index} className="photo-choice" aria-label={`View photo ${index + 1}`} aria-pressed={photoIndex === index} onClick={() => setPhotoIndex(index)}><ItemPhoto src={src} alt="" /></button>)}</div>}
        </section>
        <section className="section-stack detail-copy">
          <div className="row"><Badge tone={item.type === "LOST" ? "lost" : "found"}>{item.type === "LOST" ? "Lost" : "Found"}</Badge><Badge>{STATUS_LABELS[item.status]}</Badge></div>
          <p className="eyebrow muted">{item.category?.name || "Uncategorized"}</p><h1>{item.name}</h1>
          <p className="item-meta"><MapPin size={20} aria-hidden="true" />{itemLocation(item)}</p>
          <p className="item-meta"><CalendarDays size={20} aria-hidden="true" />{item.type === "LOST" ? "Lost" : "Found"}: {formatItemDate(item.dateTime)}</p>
          <div className="detail-description"><h2>About this item</h2><p>{item.description || "No description provided."}</p></div>
          <dl className="item-facts"><div><dt>Brand</dt><dd>{item.brand || "Not specified"}</dd></div><div><dt>Color</dt><dd>{item.color || "Not specified"}</dd></div><div><dt>Posted</dt><dd>{formatItemDate(item.createdAt)}</dd></div>{item.returnedAt && <div><dt>Returned</dt><dd>{formatItemDate(item.returnedAt)}</dd></div>}</dl>
          {item.locationLat != null && item.locationLng != null && <a className="back-link" href={`https://www.openstreetmap.org/?mlat=${item.locationLat}&mlon=${item.locationLng}#map=16/${item.locationLat}/${item.locationLng}`} target="_blank" rel="noopener noreferrer">View location on map <MapPin size={16} aria-hidden="true" /></a>}
          <div className="reporter"><UserRound size={22} aria-hidden="true" /><div><p className="muted">Reported by</p><strong>{item.owner?.name || "Community member"}</strong></div></div>
        </section>
      </article>}
  </div>;
}
