"use client";

import React, { useState } from "react";
import type { Language } from "@/types/dashboard";
import EmptyState from "@/components/ui/EmptyState";

interface LanguagesCardProps {
  topLanguages: Language[];
}

export default function LanguagesCard({ topLanguages }: LanguagesCardProps) {
  const [languagesPage, setLanguagesPage] = useState(1);

  return (
    <div className="card">
      <h3 style={{ fontSize: 11, fontWeight: 600, marginBottom: 14, color: "var(--txt-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Jezyki przegladarek
      </h3>
      {topLanguages.length === 0 && (
        <EmptyState icon="language" message="Brak danych o językach" hint="Języki przeglądarek pojawią się po skanach" />
      )}
      {topLanguages.slice((languagesPage - 1) * 5, languagesPage * 5).map((l, i, arr) => (
        <div
          key={l.lang}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 0",
            borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: 4,
                background: "transparent",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--accent-light)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {l.lang}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="progress-bar" style={{ width: 80 }}>
              <div className="progress-fill" style={{ width: `${l.percent}%` }} />
            </div>
            <span style={{ fontSize: 12, color: "var(--txt-sec)", minWidth: 50, textAlign: "right", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
              {l.count}
            </span>
            <span style={{ fontSize: 11, color: "var(--accent)", minWidth: 40, textAlign: "right", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
              {l.uniqueUsers} un.
            </span>
          </div>
        </div>
      ))}
      {topLanguages.length > 5 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
          <span style={{ fontSize: 10, color: "var(--txt-muted)" }}>{Math.min(languagesPage * 5, topLanguages.length)}/{topLanguages.length}</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              disabled={languagesPage <= 1}
              onClick={() => setLanguagesPage(p => p - 1)}
              style={{ background: "transparent", border: "1px solid var(--border)", color: languagesPage <= 1 ? "var(--border-hover)" : "var(--txt-sec)", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: languagesPage <= 1 ? "default" : "pointer" }}
            >← Poprz.</button>
            <button
              disabled={languagesPage * 5 >= topLanguages.length}
              onClick={() => setLanguagesPage(p => p + 1)}
              style={{ background: "transparent", border: "1px solid var(--border)", color: languagesPage * 5 >= topLanguages.length ? "var(--border-hover)" : "var(--txt-sec)", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: languagesPage * 5 >= topLanguages.length ? "default" : "pointer" }}
            >Nast. →</button>
          </div>
        </div>
      )}
    </div>
  );
}
