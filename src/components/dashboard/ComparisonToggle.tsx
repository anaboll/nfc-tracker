"use client";

import React from "react";

interface Props {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

export default function ComparisonToggle({ enabled, onChange, disabled }: Props) {
  return (
    <button
      type="button"
      className={`comparison-toggle ${enabled ? "comparison-toggle--active" : ""}`}
      onClick={() => onChange(!enabled)}
      disabled={disabled}
      title={disabled ? "Wybierz zakres dat aby porownac" : enabled ? "Wylacz porownanie" : "Porownaj z poprzednim okresem"}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
      <span>vs</span>
    </button>
  );
}
