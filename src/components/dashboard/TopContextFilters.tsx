"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface ComboClient {
  id: string;
  name: string;
  color: string | null;
}

export interface ComboCampaign {
  id: string;
  name: string;
  clientId: string;
}

export interface TopContextFiltersProps {
  clients: ComboClient[];
  /** Already filtered by selectedClientId in parent */
  campaigns: ComboCampaign[];
  selectedClientId: string | null;
  selectedCampaignId: string | null;
  onClientChange: (id: string | null) => void;
  onCampaignChange: (id: string | null) => void;
}

/* ------------------------------------------------------------------ */
/*  Generic Combobox                                                    */
/* ------------------------------------------------------------------ */

interface ComboboxOption {
  id: string | null;
  label: string;
  accent?: string;
}

interface ComboboxProps {
  label: string;
  placeholder: string;
  options: ComboboxOption[];
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
  disabledHint?: string;
  width?: number;
}

function Combobox({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
  disabledHint,
  width = 180,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.id === value) ?? null;

  /* close on outside click */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /* focus input when opened */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const handleSelect = useCallback(
    (id: string | null) => {
      onChange(id);
      setOpen(false);
      setQuery("");
    },
    [onChange]
  );

  /* keyboard navigation */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  };

  const triggerLabel = selected ? selected.label : placeholder;
  const accent = selected?.accent ?? "#5a6478";

  return (
    <div
      ref={wrapRef}
      style={{ position: "relative", width, flexShrink: 0 }}
    >
      {/* Label above */}
      <div style={{ fontSize: 11, color: "#8b95a8", fontWeight: 500, marginBottom: 4 }}>
        {label}
      </div>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        title={disabled ? disabledHint : undefined}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          background: "var(--surface-2, #0c1220)",
          border: `1px solid ${open ? "#e69500" : "#1e2d45"}`,
          borderRadius: 8,
          padding: "7px 10px",
          color: disabled ? "#3a4a60" : (selected ? accent : "#5a6478"),
          fontSize: 13,
          fontWeight: selected ? 600 : 400,
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "border-color 0.15s, color 0.15s",
          opacity: disabled ? 0.5 : 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        onMouseEnter={(e) => {
          if (!disabled && !open) e.currentTarget.style.borderColor = "#3a4a60";
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.borderColor = "#1e2d45";
        }}
      >
        {/* Dot accent for selected */}
        {selected && selected.id !== null && (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: accent,
              flexShrink: 0,
            }}
          />
        )}
        <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis" }}>
          {triggerLabel}
        </span>
        {/* Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            flexShrink: 0,
            transition: "transform 0.15s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            color: "#5a6478",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            minWidth: "100%",
            width: Math.max(width, 200),
            background: "#0d1526",
            border: "1px solid #1e2d45",
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            zIndex: 9000,
            overflow: "hidden",
          }}
          onKeyDown={handleKeyDown}
        >
          {/* Search input */}
          <div style={{ padding: "8px 8px 4px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#1a253a",
                border: "1px solid #2a3a52",
                borderRadius: 7,
                padding: "5px 8px",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#5a6478"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Szukaj..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#e8ecf1",
                  fontSize: 12,
                  width: "100%",
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  style={{ background: "transparent", border: "none", color: "#5a6478", cursor: "pointer", padding: 0, lineHeight: 1 }}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "10px 14px", color: "#5a6478", fontSize: 12, textAlign: "center" }}>
                Brak wyników
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.id === value;
                return (
                  <button
                    key={opt.id ?? "__all__"}
                    type="button"
                    onClick={() => handleSelect(opt.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      padding: "9px 14px",
                      background: isSelected ? "rgba(245,183,49,0.08)" : "transparent",
                      border: "none",
                      color: isSelected ? (opt.accent ?? "#f5b731") : "#c8d0dc",
                      fontSize: 13,
                      fontWeight: isSelected ? 600 : 400,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "#1a253a";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isSelected ? "rgba(245,183,49,0.08)" : "transparent";
                    }}
                  >
                    {/* Colour dot for real options (non-null id) */}
                    {opt.id !== null ? (
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: opt.accent ?? "#5a6478",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      /* "All" row — small dash */
                      <span
                        style={{
                          width: 8,
                          height: 2,
                          borderRadius: 1,
                          background: "#5a6478",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {opt.label}
                    </span>
                    {/* Checkmark when selected */}
                    {isSelected && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={opt.accent ?? "#f5b731"}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ marginLeft: "auto", flexShrink: 0 }}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TopContextFilters                                                   */
/* ------------------------------------------------------------------ */

export function TopContextFilters({
  clients,
  campaigns,
  selectedClientId,
  selectedCampaignId,
  onClientChange,
  onCampaignChange,
}: TopContextFiltersProps) {
  const clientOptions: ComboboxOption[] = [
    { id: null, label: "Wszyscy klienci" },
    ...clients.map((c) => ({
      id: c.id,
      label: c.name,
      accent: c.color ?? "#e69500",
    })),
  ];

  const campaignOptions: ComboboxOption[] = [
    { id: null, label: "Wszystkie kampanie" },
    ...campaigns.map((c) => ({
      id: c.id,
      label: c.name,
      accent: "#60a5fa",
    })),
  ];

  return (
    <>
      <Combobox
        label="Klient"
        placeholder="Wszyscy klienci"
        options={clientOptions}
        value={selectedClientId}
        onChange={(id) => {
          onClientChange(id);
          onCampaignChange(null);
        }}
        width={180}
      />
      <Combobox
        label="Kampania"
        placeholder={selectedClientId ? "Wszystkie kampanie" : "Wybierz klienta"}
        options={campaignOptions}
        value={selectedCampaignId}
        onChange={onCampaignChange}
        disabled={!selectedClientId}
        disabledHint="Najpierw wybierz klienta"
        width={180}
      />
    </>
  );
}
