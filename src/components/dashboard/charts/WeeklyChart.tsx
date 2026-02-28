"use client";

import React from "react";
import type { WeeklyTrend } from "@/types/dashboard";

interface Props {
  weekly: WeeklyTrend | null | undefined;
  maxWeeklyCount: number;
  weekOffset?: number;
  onWeekChange?: (direction: number) => void;
  formatWeekRange: (start: string, end: string) => string;
}

export default function WeeklyChart({ weekly, maxWeeklyCount, weekOffset, onWeekChange, formatWeekRange }: Props) {
  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h3 style={{ fontSize: 11, fontWeight: 600, color: "var(--txt-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
          Trend tygodniowy
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {onWeekChange && (
            <button
              onClick={() => onWeekChange(-1)}
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--txt-sec)",
                borderRadius: 6,
                width: 32,
                height: 32,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-hover)")}
            >
              &#8249;
            </button>
          )}
          <span style={{ fontSize: 12, color: "var(--txt-sec)", minWidth: 100, textAlign: "center" }}>
            {weekly
              ? formatWeekRange(weekly.weekStart, weekly.weekEnd)
              : "---"}
          </span>
          {onWeekChange && (
            <button
              onClick={() => onWeekChange(1)}
              disabled={(weekOffset ?? 0) >= 0}
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                color: (weekOffset ?? 0) >= 0 ? "var(--border-hover)" : "var(--txt-sec)",
                borderRadius: 6,
                width: 32,
                height: 32,
                cursor: (weekOffset ?? 0) >= 0 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                if ((weekOffset ?? 0) < 0) e.currentTarget.style.borderColor = "var(--accent)";
              }}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-hover)")}
            >
              &#8250;
            </button>
          )}
        </div>
      </div>

      {/* Bar chart with unique overlay */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          height: 200,
          paddingTop: 8,
        }}
      >
        {weekly?.data.map((d) => {
          const barH = maxWeeklyCount > 0 ? (d.count / maxWeeklyCount) * 160 : 0;
          const uBarH = maxWeeklyCount > 0 ? (d.uniqueUsers / maxWeeklyCount) * 160 : 0;
          return (
            <div
              key={d.date}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 600, color: d.count > 0 ? "var(--accent-light)" : "var(--border-hover)" }}>
                {d.count}
              </span>
              <span style={{ fontSize: 9, fontWeight: 600, color: d.uniqueUsers > 0 ? "var(--success)" : "var(--border-hover)" }}>
                {d.uniqueUsers} un.
              </span>
              <div style={{ position: "relative", width: "100%", maxWidth: 48, height: Math.max(barH, 4) }}>
                {/* Total bar (orange) */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: Math.max(barH, 4),
                    borderRadius: "6px 6px 2px 2px",
                    background: d.count > 0 ? "var(--accent)" : "var(--surface-3)",
                    transition: "height 0.4s ease",
                    opacity: 0.35,
                  }}
                />
                {/* Unique bar (green, on top) */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: "15%",
                    right: "15%",
                    height: Math.max(uBarH, d.uniqueUsers > 0 ? 4 : 0),
                    borderRadius: "4px 4px 2px 2px",
                    background: d.uniqueUsers > 0 ? "var(--success)" : "transparent",
                    transition: "height 0.4s ease",
                  }}
                />
              </div>
              <span style={{ fontSize: 11, color: "var(--txt-sec)", fontWeight: 500 }}>
                {d.day}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
        <span style={{ fontSize: 10, color: "var(--accent-light)", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--accent-light)", opacity: 0.5, display: "inline-block" }} /> Wszystkie
        </span>
        <span style={{ fontSize: 10, color: "var(--success)", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--success)", display: "inline-block" }} /> Unikalne
        </span>
      </div>
    </div>
  );
}
