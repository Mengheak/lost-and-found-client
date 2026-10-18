import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "lost" | "found" }) {
  return <span {...props} className={cn("ui-badge", `ui-badge--${tone}`, className)} />;
}
