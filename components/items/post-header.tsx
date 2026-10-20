import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatItemDate, STATUS_LABELS, type Item } from "@/lib/items";

export function PostHeader({ item }: { item: Item }) {
  const name = item.owner?.name || "Community member";
  return (
    <header className="post-header">
      <Avatar src={item.owner?.profilePhotoUrl} name={name} decorative />
      <div className="post-author">
        <strong>{name}</strong>
        <p>
          {item.type === "LOST" ? "Looking for a lost item" : "Shared a found item"}
          <span aria-hidden="true"> · </span>
          <time dateTime={item.createdAt}>{formatItemDate(item.createdAt)}</time>
        </p>
      </div>
      <Badge tone={item.status === "OPEN" ? (item.type === "LOST" ? "lost" : "found") : "neutral"}>
        {item.status === "OPEN"
          ? item.type === "LOST"
            ? "Lost"
            : "Found"
          : STATUS_LABELS[item.status]}
      </Badge>
    </header>
  );
}
