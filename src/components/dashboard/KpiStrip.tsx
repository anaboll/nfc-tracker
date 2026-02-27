"use client";

import React from "react";
import type { KPI } from "@/types/dashboard";

interface Props {
  kpi: KPI | null | undefined;
  formatDate: (d: string | null) => string;
}

export default function KpiStrip({ kpi, formatDate }: Props) {
  return (
    <section
      style={{
        display: "flex",
        alignItems: "baseline",
        padding: "20px 0",
        borderBottom: "1px solid rgba(148,163,184,0.08)",
        marginBottom: 28,
        gap: 0,
      }}
      className="kpi-grid"
    >
      {/* Total Scans */}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748B", marginBottom: 4 }}>
          Wszystkie skany
        </p>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 600, color: "#F1F5F9", letterSpacing: "-0.02em" }}>
          {kpi?.totalScans.toLocaleString("pl-PL") ?? "0"}
        </p>
        <p style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
          Łącznie zarejestrowanych
        </p>
      </div>

      {/* Unique Users */}
      <div style={{ flex: 1, borderLeft: "1px solid rgba(148,163,184,0.08)", paddingLeft: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748B", marginBottom: 4 }}>
          Unikalni
        </p>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 600, color: "#38BDF8", letterSpacing: "-0.02em" }}>
          {kpi?.uniqueUsers.toLocaleString("pl-PL") ?? "0"}
        </p>
        <p style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
          Różne urządzenia
        </p>
      </div>

      {/* Last Scan */}
      <div style={{ flex: 1, borderLeft: "1px solid rgba(148,163,184,0.08)", paddingLeft: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748B", marginBottom: 4 }}>
          Ostatni skan
        </p>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 600, color: "#F1F5F9" }}>
          {formatDate(kpi?.lastScan ?? null)}
        </p>
      </div>

      {/* Avg Scans Per User */}
      <div style={{ flex: 1, borderLeft: "1px solid rgba(148,163,184,0.08)", paddingLeft: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748B", marginBottom: 4 }}>
          Śr. skanów / osoba
        </p>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 600, color: "#22c55e", letterSpacing: "-0.02em" }}>
          {kpi?.avgScansPerUser ?? 0}x
        </p>
        <p style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
          {(kpi?.avgScansPerUser ?? 0) <= 1.2 ? "Większość skanuje raz" : "Użytkownicy wracają"}
        </p>
      </div>
    </section>
  );
}
