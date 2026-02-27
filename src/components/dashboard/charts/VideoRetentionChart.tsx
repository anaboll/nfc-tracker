"use client";

import React from "react";
import type { VideoStats } from "@/types/dashboard";

interface Props {
  videoStats: VideoStats | null;
  formatWatchTime: (seconds: number | null) => string;
}

export default function VideoRetentionChart({ videoStats, formatWatchTime }: Props) {
  if (!videoStats) return null;

  const plays = videoStats.plays || 1;
  const points = [
    { label: "Start", pct: 100, count: plays },
    { label: "25%", pct: Math.round((videoStats.progress25 / plays) * 100), count: videoStats.progress25 },
    { label: "50%", pct: Math.round((videoStats.progress50 / plays) * 100), count: videoStats.progress50 },
    { label: "75%", pct: Math.round((videoStats.progress75 / plays) * 100), count: videoStats.progress75 },
    { label: "100%", pct: Math.round((videoStats.progress100 / plays) * 100), count: videoStats.progress100 },
  ];
  const chartW = 500;
  const chartH = 200;
  const padL = 40;
  const padR = 20;
  const padT = 10;
  const padB = 30;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const xCoords = points.map((_, i) => padL + (i / (points.length - 1)) * innerW);
  const yCoords = points.map(p => padT + innerH - (p.pct / 100) * innerH);

  const linePath = points.map((_, i) => `${i === 0 ? "M" : "L"}${xCoords[i]},${yCoords[i]}`).join(" ");
  const areaPath = `${linePath} L${xCoords[xCoords.length - 1]},${padT + innerH} L${xCoords[0]},${padT + innerH} Z`;

  return (
    <section className="card" style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
            Retencja video
          </h3>
          <p style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
            Ile % widzow dotarlo do kazdego momentu
          </p>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#10b981" }}>{videoStats.plays}</p>
            <p style={{ fontSize: 10, color: "#94A3B8" }}>Odtworzen</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#60a5fa" }}>{videoStats.completions}</p>
            <p style={{ fontSize: 10, color: "#94A3B8" }}>Do konca</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#7dd3fc" }}>{formatWatchTime(videoStats.avgWatchTime)}</p>
            <p style={{ fontSize: 10, color: "#94A3B8" }}>Sred. czas</p>
          </div>
        </div>
      </div>

      {/* SVG Area Chart - YouTube-style retention */}
      <div style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: "100%", height: "auto", maxHeight: 220 }}>
          <defs>
            <linearGradient id="retentionGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {[0, 25, 50, 75, 100].map(v => {
            const y = padT + innerH - (v / 100) * innerH;
            return (
              <g key={v}>
                <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="rgba(148,163,184,0.15)" strokeWidth="1" />
                <text x={padL - 6} y={y + 4} fill="#6060a0" fontSize="10" textAnchor="end">{v}%</text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#retentionGrad)" />

          {/* Line */}
          <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data points + labels */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={xCoords[i]} cy={yCoords[i]} r="5" fill="#0f0f1a" stroke="#10b981" strokeWidth="2.5" />
              <text x={xCoords[i]} y={yCoords[i] - 12} fill="#f0f0ff" fontSize="11" fontWeight="700" textAnchor="middle">
                {p.pct}%
              </text>
              <text x={xCoords[i]} y={yCoords[i] - 24} fill="#6060a0" fontSize="9" textAnchor="middle">
                ({p.count})
              </text>
              {/* X-axis label */}
              <text x={xCoords[i]} y={chartH - 6} fill="#a0a0c0" fontSize="11" fontWeight="500" textAnchor="middle">
                {p.label}
              </text>
            </g>
          ))}
        </svg>

        {/* Completion rate highlight */}
        <div style={{
          marginTop: 12,
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
        }}>
          {points.slice(1).map((p, i) => (
            <div key={i} style={{
              background: p.pct >= 75 ? "rgba(16,185,129,0.12)" : p.pct >= 50 ? "rgba(96,165,250,0.12)" : p.pct >= 25 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
              border: `1px solid ${p.pct >= 75 ? "rgba(16,185,129,0.25)" : p.pct >= 50 ? "rgba(96,165,250,0.25)" : p.pct >= 25 ? "rgba(245,158,11,0.25)" : "rgba(239,68,68,0.25)"}`,
              borderRadius: 8,
              padding: "8px 16px",
              textAlign: "center",
            }}>
              <p style={{
                fontSize: 18,
                fontWeight: 700,
                color: p.pct >= 75 ? "#10b981" : p.pct >= 50 ? "#60a5fa" : p.pct >= 25 ? "#f59e0b" : "#f87171",
              }}>{p.pct}%</p>
              <p style={{ fontSize: 10, color: "#94A3B8" }}>dotarli do {p.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
