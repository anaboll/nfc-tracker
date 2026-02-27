"use client";

import React, { useCallback, useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  ConfirmDialog — modal replacement for browser confirm()            */
/*  Styled to match existing dark-navy dashboard theme                 */
/* ------------------------------------------------------------------ */

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Potwierdź",
  cancelLabel = "Anuluj",
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Focus confirm button on open
  useEffect(() => {
    if (open) confirmRef.current?.focus();
  }, [open]);

  // Escape key closes
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    },
    [onCancel],
  );

  if (!open) return null;

  return (
    <div className="confirm-overlay" onKeyDown={handleKeyDown}>
      <div className="confirm-dialog" role="alertdialog" aria-modal="true">
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn confirm-btn--cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            className={`confirm-btn ${danger ? "confirm-btn--danger" : "confirm-btn--primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
