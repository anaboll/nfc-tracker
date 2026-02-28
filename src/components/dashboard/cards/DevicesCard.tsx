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
    { label: "iOS", value: devices?.iOS ?? 0, percent: iosPercent, color: "var(--accent)" },
    { label: "Android", value: devices?.Android ?? 0, percent: androidPercent, color: "var(--success)" },
    { label: "Desktop", value: devices?.Desktop ?? 0, percent: desktopPercent, color: "var(--txt-sec)" },
  ];

  return (
    <div className="card">
      <h3 style={{ fontSize: 11, fontWeight: 600, marginBottom: 16, color: "var(--txt-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Urzadzenia
      </h3>

      {rows.map((d) => (
        <div key={d.label} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 12 }}>
            <span style={{ color: "var(--txt)", fontWeight: 500 }}>{d.label}</span>
            <span style={{ color: "var(--txt-sec)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
              {d.value} <span style={{ color: "var(--txt-muted)" }}>({d.percent}%)</span>
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${d.percent}%`, background: d.color }} />
          </div>
        </div>
      ))}

      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
        <span style={{ fontSize: 11, color: "var(--txt-muted)", fontFamily: "var(--font-mono)" }}>
          Razem: {devices?.total.toLocaleString("pl-PL") ?? 0}
        </span>
      </div>
    </div>
  );
}
