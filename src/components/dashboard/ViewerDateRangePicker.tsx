"use client";

import React, { useState, useCallback } from "react";

interface Props {
  onChange: (from: string | null, to: string | null) => void;
}

type Preset = "today" | "24h" | "7d" | "30d" | "all";

const PRESETS: { key: Preset; label: string }[] = [
  { key: "today", label: "Dziś" },
  { key: "24h", label: "24h" },
  { key: "7d", label: "7 dni" },
  { key: "30d", label: "30 dni" },
  { key: "all", label: "Wszystko" },
];

function computeRange(preset: Preset): { from: string | null; to: string | null } {
  if (preset === "all") return { from: null, to: null };

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const toISO = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

  let from: Date;
  if (preset === "today") {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  } else if (preset === "24h") {
    from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  } else {
    const days = preset === "7d" ? 7 : 30;
    from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  return { from: toISO(from), to: toISO(now) };
}

export default function ViewerDateRangePicker({ onChange }: Props) {
  const [active, setActive] = useState<Preset>("7d");

  const handleClick = useCallback(
    (preset: Preset) => {
      setActive(preset);
      const { from, to } = computeRange(preset);
      onChange(from, to);
    },
    [onChange],
  );

  return (
    <div className="viewer-date-picker">
      <span className="viewer-date-picker-label">Okres:</span>
      <div className="viewer-date-picker-group">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            className={`viewer-date-picker-btn${active === p.key ? " viewer-date-picker-btn--active" : ""}`}
            onClick={() => handleClick(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
