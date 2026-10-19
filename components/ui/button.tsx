import type { ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
  iconLabel?: string;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  type = "button",
  iconLabel,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      aria-label={iconLabel ?? props["aria-label"]}
      title={iconLabel ?? props.title ?? props["aria-label"]}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "ui-button",
        `ui-button--${variant}`,
        `ui-button--${size}`,
        iconLabel && "icon-action",
        className,
      )}
    >
      {loading && <LoaderCircle className="spin" size={18} aria-hidden="true" />}
      {(!loading || !iconLabel) && children}
    </button>
  );
}
