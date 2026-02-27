"use client";

import React from "react";
import type { HourlyData } from "@/types/dashboard";

interface Props {
  hourly: HourlyData[];
  hourlyMode: "bars" | "heatmap";
  setHourlyMode: (m: "bars" | "heatmap") => void;
  hourlyDataMode: "both" | "all" | "unique";
  setHourlyDataMode: (m: "both" | "all" | "unique") => void;
  heatmapData: number[][];
  heatmapMax: number;
  heatmapUniqueData: number[][];
  heatmapUniqueMax: number;
}

export default function HourlyChart({
  hourly,
  hourlyMode,
  setHourlyMode,
  hourlyDataMode,
  setHourlyDataMode,
  heatmapData,
  heatmapMax,
  heatmapUniqueData,
  heatmapUniqueMax,
}: Props) {
  if (hourly.length === 0 || !hourly.some(h => h.count > 0)) return null;

  return (
    <section className="card">
      {/* Header with peak insight + mode toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Rozklad godzinowy
          </h3>
          {/* Peak insight */}
          {(() => {
            const peak = hourly.reduce((a, b) => b.count > a.count ? b : a, hourly[0]);
            const totalH = hourly.reduce((s, h) => s + h.count, 0);
            const peakPct = totalH > 0 ? Math.round((peak.count / totalH) * 100) : 0;
            return peak.count > 0 ? (
              <p style={{ fontSize: 12, color: "#94A3B8", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ color: "#10b981", fontWeight: 700 }}>Szczyt:</span>
                {peak.hour}:00–{peak.hour + 1}:00
                <span style={{ color: "#7dd3fc", fontWeight: 600 }}>({peak.count} skanow, {peak.uniqueUsers} unik.)</span>
                <span style={{ color: "#64748B" }}>· {peakPct}% calego ruchu</span>
              </p>
            ) : null;
          })()}
        </div>
        {/* Toggles */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {/* Data mode toggle */}
          <div style={{ display: "flex", background: "#1C2541", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(148,163,184,0.08)" }}>
            <button
              className="hourly-toggle-btn"
              onClick={() => setHourlyDataMode("both")}
              style={{
                background: hourlyDataMode === "both" ? "rgba(56,189,248,0.12)" : "transparent",
                color: hourlyDataMode === "both" ? "#7dd3fc" : "#64748B",
              }}
            >
              Razem
            </button>
            <button
              className="hourly-toggle-btn"
              onClick={() => setHourlyDataMode("all")}
              style={{
                background: hourlyDataMode === "all" ? "rgba(56,189,248,0.12)" : "transparent",
                color: hourlyDataMode === "all" ? "#7dd3fc" : "#64748B",
              }}
            >
              Wszystkie
            </button>
            <button
              className="hourly-toggle-btn"
              onClick={() => setHourlyDataMode("unique")}
              style={{
                background: hourlyDataMode === "unique" ? "rgba(16,185,129,0.15)" : "transparent",
                color: hourlyDataMode === "unique" ? "#10b981" : "#64748B",
              }}
            >
              Unikalne
            </button>
          </div>
          {/* View mode toggle */}
          <div style={{ display: "flex", background: "#1C2541", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(148,163,184,0.08)" }}>
            <button
              className="hourly-toggle-btn"
              onClick={() => setHourlyMode("bars")}
              style={{
                background: hourlyMode === "bars" ? "rgba(56,189,248,0.12)" : "transparent",
                color: hourlyMode === "bars" ? "#7dd3fc" : "#64748B",
              }}
            >
              Histogram
            </button>
            <button
              className="hourly-toggle-btn"
              onClick={() => setHourlyMode("heatmap")}
              style={{
                background: hourlyMode === "heatmap" ? "rgba(56,189,248,0.12)" : "transparent",
                color: hourlyMode === "heatmap" ? "#7dd3fc" : "#64748B",
              }}
            >
              Heatmapa
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        {hourlyDataMode !== "unique" && (
          <span style={{ fontSize: 10, color: "#7dd3fc", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#7dd3fc", opacity: 0.6, display: "inline-block" }} /> Wszystkie skany
          </span>
        )}
        {hourlyDataMode !== "all" && (
          <span style={{ fontSize: 10, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#10b981", display: "inline-block" }} /> Unikalni
          </span>
        )}
      </div>

      {/* HISTOGRAM MODE */}
      {hourlyMode === "bars" && (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 200, paddingTop: 8 }}>
          {hourly.map((h) => {
            const showAll = hourlyDataMode !== "unique";
            const showUnique = hourlyDataMode !== "all";
            const primaryVal = hourlyDataMode === "unique" ? h.uniqueUsers : h.count;
            const maxH = Math.max(...hourly.map(x => hourlyDataMode === "unique" ? x.uniqueUsers : x.count), 1);
            const barH = (h.count / maxH) * 160;
            const uBarH = (h.uniqueUsers / maxH) * 160;
            const isActive = primaryVal > 0;
            return (
              <div key={h.hour} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }} title={`${h.hour}:00 - ${h.count} skanow, ${h.uniqueUsers} unikalnych`}>
                {isActive && showAll && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#7dd3fc" }}>{h.count}</span>
                )}
                {isActive && showUnique && (h.uniqueUsers < h.count || !showAll) && (
                  <span style={{ fontSize: 8, fontWeight: 600, color: "#10b981" }}>{h.uniqueUsers}</span>
                )}
                <div style={{ position: "relative", width: "100%", height: Math.max(showAll ? barH : uBarH, isActive ? 4 : 2) }}>
                  {/* Total bar (blue) */}
                  {showAll && (
                    <div style={{
                      position: "absolute", bottom: 0, left: "10%", right: "10%",
                      height: Math.max(barH, h.count > 0 ? 4 : 2),
                      borderRadius: "3px 3px 0 0",
                      background: h.count > 0 ? "rgba(56,189,248,0.5)" : "#1C2541",
                      transition: "height 0.3s ease",
                    }} />
                  )}
                  {/* Unique overlay (green) */}
                  {showUnique && h.uniqueUsers > 0 && (
                    <div style={{
                      position: "absolute", bottom: 0,
                      left: showAll ? "25%" : "10%",
                      right: showAll ? "25%" : "10%",
                      height: Math.max(uBarH, 3),
                      borderRadius: "2px 2px 0 0",
                      background: "rgba(16,185,129,0.8)",
                      transition: "height 0.3s ease",
                    }} />
                  )}
                </div>
                <span style={{ fontSize: 8, color: isActive ? "#94A3B8" : "#363b48", fontWeight: 500 }}>
                  {h.hour}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* HEATMAP MODE */}
      {hourlyMode === "heatmap" && (
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "50px repeat(24, 1fr)", gap: 1, minWidth: 600 }}>
            {/* Header row: hours */}
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={`hdr-${h}`} style={{ textAlign: "center", fontSize: 8, color: "#64748B", padding: "4px 0", fontWeight: 500 }}>
                {h}
              </div>
            ))}
            {/* Data rows: each day */}
            {["Pon", "Wt", "Sr", "Czw", "Pt", "Sob", "Nd"].map((dayName, dayIdx) => (
              <React.Fragment key={`row-${dayIdx}`}>
                <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, display: "flex", alignItems: "center", paddingRight: 8 }}>
                  {dayName}
                </div>
                {Array.from({ length: 24 }, (_, h) => {
                  const isUnique = hourlyDataMode === "unique";
                  const val = isUnique ? (heatmapUniqueData[dayIdx]?.[h] || 0) : (heatmapData[dayIdx]?.[h] || 0);
                  const maxVal = isUnique ? heatmapUniqueMax : heatmapMax;
                  const intensity = maxVal > 0 ? val / maxVal : 0;
                  // Color interpolation: 0 = dark, unique = green, all/both = blue
                  const bg = val === 0
                    ? "#151D35"
                    : isUnique
                      ? `rgba(16, 185, 129, ${0.15 + intensity * 0.85})`
                      : `rgba(56, 189, 248, ${0.15 + intensity * 0.85})`;
                  return (
                    <div
                      key={`cell-${dayIdx}-${h}`}
                      title={`${dayName} ${h}:00 — ${val} ${isUnique ? "unikalnych" : "skanow"}`}
                      style={{
                        height: 22,
                        borderRadius: 2,
                        background: bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 8,
                        fontWeight: 700,
                        color: val > 0 ? (intensity > 0.5 ? "#151D35" : "#F1F5F9") : "transparent",
                        cursor: "default",
                        transition: "background 0.2s",
                      }}
                    >
                      {val > 0 ? val : ""}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          {/* Heatmap scale */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
            <span style={{ fontSize: 9, color: "#64748B" }}>Mniej</span>
            <div style={{ display: "flex", gap: 2 }}>
              {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
                <div key={i} style={{ width: 16, height: 10, borderRadius: 2, background: f === 0 ? "#151D35" : hourlyDataMode === "unique" ? `rgba(16, 185, 129, ${0.15 + f * 0.85})` : `rgba(56, 189, 248, ${0.15 + f * 0.85})` }} />
              ))}
            </div>
            <span style={{ fontSize: 9, color: "#64748B" }}>Wiecej</span>
          </div>
        </div>
      )}

      {/* Timezone note */}
      <p style={{ fontSize: 10, color: "#3d4250", marginTop: 10, textAlign: "right" }}>
        Strefa czasowa: przegladarka ({Intl.DateTimeFormat().resolvedOptions().timeZone})
      </p>
    </section>
  );
}
