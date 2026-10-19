import Link from "next/link";
import { MapPin, ArrowUpRight, Images } from "lucide-react";
import { itemLocation, type Item } from "@/lib/items";
import { ItemPhoto } from "./item-photo";
import { PostHeader } from "./post-header";

export function ItemCard({ item }: { item: Item }) {
  return (
    <article className="community-post">
      <PostHeader item={item} />
      <Link href={`/items/${item.id}`} className="post-link" aria-label={`Read post: ${item.name}`}>
        <div className="post-copy">
          <h2>{item.name}</h2>
          {item.description && <p className="post-excerpt">{item.description}</p>}
        </div>
        {!!item.photoUrls?.length && (
          <div className="post-media">
            <ItemPhoto src={item.photoUrls[0]} alt={item.name} />
            {item.photoUrls.length > 1 && (
              <span className="post-photo-count">
                <Images size={16} aria-hidden="true" />
                {item.photoUrls.length} photos
              </span>
            )}
          </div>
        )}
      </Link>
      <footer className="post-footer">
        <div className="post-context">
          <p className="item-meta">
            <MapPin size={16} aria-hidden="true" />
            {itemLocation(item)}
          </p>
          {item.category && <p className="muted">{item.category.name}</p>}
        </div>
        <Link
          href={`/items/${item.id}`}
          className="ui-button ui-button--ghost icon-action"
          aria-label={`Read post: ${item.name}`}
          title="Read post"
        >
          <ArrowUpRight size={20} aria-hidden="true" />
        </Link>
      </footer>
    </article>
  );
}
