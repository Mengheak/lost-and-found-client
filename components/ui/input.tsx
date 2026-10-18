"use client";

import { useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function Input({
  label,
  hint,
  error,
  id,
  className,
  "aria-describedby": describedBy,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const message = error || hint;
  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <input
        {...props}
        id={inputId}
        className={cn("ui-input", className)}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={cn(describedBy, message && `${inputId}-message`) || undefined}
      />
      {message && (
        <p id={`${inputId}-message`} className={cn("field-message", !!error && "field-error")}>
          {message}
        </p>
      )}
    </div>
  );
}
