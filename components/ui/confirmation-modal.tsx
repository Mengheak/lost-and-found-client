"use client";

import { X, Trash2, Check } from "lucide-react";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function ConfirmationModal({
  open,
  title,
  children,
  confirmLabel = "Confirm",
  busy = false,
  destructive = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  busy?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="confirmation-modal"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <div className="section-stack">
        <h2 id={titleId}>{title}</h2>
        <div id={descriptionId}>{children}</div>
        <div className="row">
          <Button
            variant="secondary"
            autoFocus
            disabled={busy}
            onClick={onCancel}
            iconLabel="Cancel"
          >
            <X size={18} aria-hidden="true" />
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            loading={busy}
            onClick={onConfirm}
            iconLabel={confirmLabel}
          >
            {destructive ? (
              <Trash2 size={18} aria-hidden="true" />
            ) : (
              <Check size={18} aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
