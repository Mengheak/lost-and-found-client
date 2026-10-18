import Link from "next/link";
import { CalendarDays, MapPin, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatItemDate, itemLocation, STATUS_LABELS, type Item } from "@/lib/items";
import { ItemPhoto } from "./item-photo";

export function ItemCard({ item }: { item: Item }) {
  return (
    <article className="item-card">
      <Link href={`/items/${item.id}`} className="item-card-link">
        <ItemPhoto src={item.photoUrls?.[0]} alt={item.name} />
        <div className="item-card-content">
          <div className="row">
            <Badge tone={item.type === "LOST" ? "lost" : "found"}>
              {item.type === "LOST" ? "Lost" : "Found"}
            </Badge>
            <Badge>{STATUS_LABELS[item.status]}</Badge>
          </div>
          <p className="eyebrow muted">{item.category?.name || "Uncategorized"}</p>
          <h2>{item.name}</h2>
          <p className="item-meta">
            <MapPin size={16} aria-hidden="true" />
            {itemLocation(item)}
          </p>
          <p className="item-meta">
            <CalendarDays size={16} aria-hidden="true" />
            {formatItemDate(item.dateTime || item.createdAt)}
          </p>
          <span className="item-card-action">
            View details <ArrowUpRight size={18} aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  );
}
