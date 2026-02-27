"use client";

import React from "react";
import type { Devices } from "@/types/dashboard";

interface Props {
  devices: Devices | null | undefined;
}

export default function DevicesCard({ devices }: Props) {
  const total = devices ? (devices.iOS + devices.Android + devices.Desktop) || 1 : 1;
  const iosPercent = devices ? Math.round((devices.iOS / total) * 100) : 0;
  const androidPercent = devices ? Math.round((devices.Android / total) * 100) : 0;
  const desktopPercent = devices ? Math.round((devices.Desktop / total) * 100) : 0;

  const rows = [
    { label: "iOS", value: devices?.iOS ?? 0, percent: iosPercent, color: "#38BDF8" },
    { label: "Android", value: devices?.Android ?? 0, percent: androidPercent, color: "#10b981" },
    { label: "Desktop", value: devices?.Desktop ?? 0, percent: desktopPercent, color: "#94A3B8" },
  ];

  return (
    <div className="card">
      <h3 style={{ fontSize: 11, fontWeight: 600, marginBottom: 16, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Urzadzenia
      </h3>

      {rows.map((d) => (
        <div key={d.label} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 12 }}>
            <span style={{ color: "#F1F5F9", fontWeight: 500 }}>{d.label}</span>
            <span style={{ color: "#94A3B8", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
              {d.value} <span style={{ color: "#64748B" }}>({d.percent}%)</span>
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${d.percent}%`, background: d.color }} />
          </div>
        </div>
      ))}

      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(148,163,184,0.06)" }}>
        <span style={{ fontSize: 11, color: "#64748B", fontFamily: "var(--font-mono)" }}>
          Razem: {devices?.total.toLocaleString("pl-PL") ?? 0}
        </span>
      </div>
    </div>
  );
}
