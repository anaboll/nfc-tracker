"use client";

import React from "react";
import type { TopTag } from "@/types/dashboard";

interface Props {
  topTags: TopTag[];
}

export default function TopTagsCard({ topTags }: Props) {
  return (
    <div className="card">
      <h3 style={{ fontSize: 11, fontWeight: 600, marginBottom: 14, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Najczesciej skanowane
      </h3>
      {topTags.length === 0 && (
        <p style={{ color: "#64748B", fontSize: 13 }}>Brak danych</p>
      )}
      {topTags.map((t, i) => (
        <div
          key={t.tagId}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 0",
            borderBottom: i < topTags.length - 1 ? "1px solid rgba(148,163,184,0.04)" : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#64748B",
                fontFamily: "var(--font-mono)",
                width: 16,
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {i + 1}
            </span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#F1F5F9" }}>
                {t.tagName}
              </p>
              <p style={{ fontSize: 10, color: "#64748B", fontFamily: "var(--font-mono)" }}>{t.tagId}</p>
            </div>
          </div>
          <div style={{ textAlign: "right", display: "flex", gap: 14, alignItems: "baseline" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#F1F5F9", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
              {t.count}
            </span>
            <span style={{ fontSize: 11, color: "#64748B" }}>|</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#38BDF8", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
              {t.uniqueUsers}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
