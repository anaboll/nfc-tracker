"use client";

import React, { useState, useEffect, useRef } from "react";
import type { ChipItem, FilterChipsBarProps } from "@/types/dashboard";

export default function FilterChipsBar({ chips, onReset, showOverflow, setShowOverflow, overflowRef }: FilterChipsBarProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cutAtRef = useRef<number>(chips.length);
  const [cutAt, setCutAtState] = useState<number>(chips.length);

  // Stable setter that avoids re-render when value hasn't changed
  const setCutAt = (n: number) => {
    if (cutAtRef.current !== n) {
      cutAtRef.current = n;
      setCutAtState(n);
    }
  };

  // Stable chip identity key — changes only when the set of chip keys changes
  const chipsKey = chips.map(c => c.key).join(",");

  // Measure layout: find how many chips fit in row 1
  useEffect(() => {
    function measure() {
      const els = chipRefs.current;
      const total = chips.length;
      if (!els.length || !els[0]) { setCutAt(total); return; }

      const firstTop = els[0].getBoundingClientRect().top;

      let cut = total;
      for (let i = 1; i < total; i++) {
        const el = els[i];
        if (!el) continue;
        if (el.getBoundingClientRect().top > firstTop + 4) { cut = i; break; }
      }
      setCutAt(cut);
    }

    // Measure after first paint
    const raf = requestAnimationFrame(measure);

    // Watch for container width changes (resize) — covers all future layout changes
    const ro = new ResizeObserver(measure);
    if (rowRef.current) ro.observe(rowRef.current);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chipsKey]); // re-run only when chip set changes (stable string key)

  const visibleChips = cutAt < chips.length ? chips.slice(0, cutAt) : chips;
  const overflowChips = cutAt < chips.length ? chips.slice(cutAt) : [];

  if (chips.length === 0) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, padding: "8px 12px", borderRadius: 10, background: "#151D35", border: "1px solid rgba(148,163,184,0.08)", minWidth: 0 }}>
      <span style={{ fontSize: 10, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, flexShrink: 0 }}>Filtry:</span>

      {/* Chip row — flex-wrap:wrap so all chips are rendered; we measure which ones overflow */}
      <div ref={rowRef} style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: 1, minWidth: 0, overflow: "hidden", maxHeight: 32 }}>
        {chips.map((ch, i) => (
          <div
            key={ch.key}
            ref={el => { chipRefs.current[i] = el; }}
            style={{ display: "inline-flex", flexShrink: 0 }}
          >
            {ch.node}
          </div>
        ))}
      </div>

      {/* +N overflow button — only rendered when cutAt < chips.length */}
      {overflowChips.length > 0 && (
        <div ref={overflowRef} style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
          <button
            onClick={() => setShowOverflow(v => !v)}
            style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 20, background: "rgba(139,149,168,0.12)", border: "1px solid #363b48", fontSize: 11, color: "#94A3B8", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
          >+{overflowChips.length}</button>
          {showOverflow && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 400,
              background: "#161a22", border: "1px solid #363b48", borderRadius: 10,
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)", padding: "10px",
              display: "flex", flexDirection: "column", gap: 6, minWidth: 200, maxWidth: 280,
            }}>
              <div style={{ fontSize: 10, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>
                Pozostałe filtry ({overflowChips.length})
              </div>
              {overflowChips.map(ch => (
                <React.Fragment key={`ov:${ch.key}`}>{ch.node}</React.Fragment>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Wyczyść — always last */}
      <button
        onClick={onReset}
        style={{ marginLeft: overflowChips.length === 0 ? "auto" : 0, flexShrink: 0, background: "transparent", border: "none", fontSize: 10, color: "#3d4250", cursor: "pointer", padding: "2px 6px", borderRadius: 4 }}
        onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
        onMouseLeave={e => (e.currentTarget.style.color = "#3d4250")}
      >Wyczyść ×</button>
    </div>
  );
}
