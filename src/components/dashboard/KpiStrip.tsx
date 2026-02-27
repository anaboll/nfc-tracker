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
      className="kpi-grid"
    >
      {/* Total Scans */}
      <div className="kpi-cell">
        <p className="kpi-label">Wszystkie skany</p>
        <p className="kpi-value">
          {kpi?.totalScans.toLocaleString("pl-PL") ?? "0"}
        </p>
        <p className="kpi-sub">Łącznie zarejestrowanych</p>
      </div>

      {/* Unique Users */}
      <div className="kpi-cell kpi-cell--bordered">
        <p className="kpi-label">Unikalni</p>
        <p className="kpi-value" style={{ color: "#38BDF8" }}>
          {kpi?.uniqueUsers.toLocaleString("pl-PL") ?? "0"}
        </p>
        <p className="kpi-sub">Różne urządzenia</p>
      </div>

      {/* Last Scan */}
      <div className="kpi-cell kpi-cell--bordered">
        <p className="kpi-label">Ostatni skan</p>
        <p className="kpi-value kpi-value--sm">
          {formatDate(kpi?.lastScan ?? null)}
        </p>
      </div>

      {/* Avg Scans Per User */}
      <div className="kpi-cell kpi-cell--bordered">
        <p className="kpi-label">Śr. skanów / osoba</p>
        <p className="kpi-value" style={{ color: "#22c55e" }}>
          {kpi?.avgScansPerUser ?? 0}x
        </p>
        <p className="kpi-sub">
          {(kpi?.avgScansPerUser ?? 0) <= 1.2 ? "Większość skanuje raz" : "Użytkownicy wracają"}
        </p>
      </div>
    </section>
  );
}
