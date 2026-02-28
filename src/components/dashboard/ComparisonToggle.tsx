"use client";

import React, { useState, useRef, useEffect } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ComparisonMode = "off" | "day" | "week" | "month" | "custom";

interface Props {
  enabled: boolean;
  mode: ComparisonMode;
  onChange: (enabled: boolean, mode: ComparisonMode) => void;
  disabled?: boolean;
}

const MODES: { key: ComparisonMode; label: string; shortLabel: string; desc: string; icon: string }[] = [
  { key: "day",   label: "Dzień vs dzień",       shortLabel: "Dzień",    desc: "Dziś vs wczoraj",               icon: "📅" },
  { key: "week",  label: "Tydzień vs tydzień",   shortLabel: "Tydzień",  desc: "Bieżący vs poprzedni tydzień",  icon: "📊" },
  { key: "month", label: "Miesiąc vs miesiąc",   shortLabel: "Miesiąc",  desc: "Bieżący vs poprzedni miesiąc",  icon: "📈" },
  { key: "custom", label: "Wybrany zakres",      shortLabel: "Zakres",   desc: "Porównaj z poprzednim okresem o tej samej długości", icon: "⚙️" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ComparisonToggle({ enabled, mode, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const activeMode = MODES.find((m) => m.key === mode);
  const activeShort = enabled && activeMode ? activeMode.shortLabel : null;

  const handleSelect = (m: ComparisonMode) => {
    onChange(true, m);
    setOpen(false);
  };

  const handleToggleOff = () => {
    onChange(false, "off");
    setOpen(false);
  };

  return (
    <div ref={ref} className="comparison-dropdown-wrap">
      <button
        type="button"
        className={`comparison-toggle ${enabled ? "comparison-toggle--active" : ""}`}
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        title={disabled ? "Wybierz zakres dat aby porównać" : enabled ? activeMode?.label ?? "" : "Porównaj okresy"}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
        <span>{enabled ? activeShort : "Porównaj"}</span>
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
          style={{ marginLeft: 1, opacity: 0.5, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="comparison-dropdown">
          <div className="comparison-dropdown-header">Porównaj okresy</div>
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              className={`comparison-dropdown-item ${enabled && mode === m.key ? "comparison-dropdown-item--active" : ""}`}
              onClick={() => handleSelect(m.key)}
            >
              <div className="comparison-dropdown-item-row">
                <span className="comparison-dropdown-item-icon">{m.icon}</span>
                <div className="comparison-dropdown-item-text">
                  <span className="comparison-dropdown-item-label">{m.label}</span>
                  <span className="comparison-dropdown-item-desc">{m.desc}</span>
                </div>
                {enabled && mode === m.key && (
                  <svg className="comparison-dropdown-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </button>
          ))}
          {enabled && (
            <>
              <div className="comparison-dropdown-divider" />
              <button
                type="button"
                className="comparison-dropdown-item comparison-dropdown-item--off"
                onClick={handleToggleOff}
              >
                <div className="comparison-dropdown-item-row">
                  <span className="comparison-dropdown-item-icon">✕</span>
                  <span className="comparison-dropdown-item-label">Wyłącz porównanie</span>
                </div>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
