import type { ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
};

export function Button({ className, variant = "primary", size = "md", loading = false, disabled, children, type = "button", ...props }: ButtonProps) {
  return (
    <button {...props} type={type} disabled={disabled || loading} aria-busy={loading || undefined}
      className={cn("ui-button", `ui-button--${variant}`, `ui-button--${size}`, className)}>
      {loading && <LoaderCircle className="spin" size={18} aria-hidden="true" />}
      {children}
    </button>
  );
}
