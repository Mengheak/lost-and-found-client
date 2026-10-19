import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function IconLink({
  label,
  className,
  ...props
}: ComponentProps<typeof Link> & { label: string }) {
  return (
    <Link
      {...props}
      aria-label={label}
      title={label}
      className={cn("ui-button ui-button--secondary icon-action", className)}
    />
  );
}
