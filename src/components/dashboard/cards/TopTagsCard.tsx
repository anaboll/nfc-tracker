"use client";

import React from "react";
import type { TopTag } from "@/types/dashboard";
import EmptyState from "@/components/ui/EmptyState";

interface Props {
  topTags: TopTag[];
}

export default function TopTagsCard({ topTags }: Props) {
  return (
    <div className="card">
      <h3 style={{ fontSize: 11, fontWeight: 600, marginBottom: 14, color: "var(--txt-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Najczesciej skanowane
      </h3>
      {topTags.length === 0 && (
        <EmptyState icon="tag" message="Brak danych o tagach" hint="Statystyki tagów pojawią się po skanach" />
      )}
      {topTags.map((t, i) => (
        <div
          key={t.tagId}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 0",
            borderBottom: i < topTags.length - 1 ? "1px solid var(--border)" : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "var(--txt-muted)",
                fontFamily: "var(--font-mono)",
                width: 16,
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {i + 1}
            </span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: "var(--txt)" }}>
                {t.tagName}
              </p>
              <p style={{ fontSize: 10, color: "var(--txt-muted)", fontFamily: "var(--font-mono)" }}>{t.tagId}</p>
            </div>
          </div>
          <div style={{ textAlign: "right", display: "flex", gap: 14, alignItems: "baseline" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--txt)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
              {t.count}
            </span>
            <span style={{ fontSize: 11, color: "var(--txt-muted)" }}>|</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
              {t.uniqueUsers}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
