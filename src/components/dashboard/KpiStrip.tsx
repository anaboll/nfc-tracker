"use client";

import React from "react";
import type { KPI } from "@/types/dashboard";
import { computeDelta } from "@/lib/periodComparison";

interface Props {
  kpi: KPI | null | undefined;
  formatDate: (d: string | null) => string;
  previousKpi?: KPI | null;
  showComparison?: boolean;
}

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  const delta = computeDelta(current, previous);
  const arrow = delta.direction === "up" ? "\u2191" : delta.direction === "down" ? "\u2193" : "\u2192";
  return (
    <span className={`kpi-delta kpi-delta--${delta.direction}`}>
      {arrow} {Math.abs(delta.changePercent)}%
      <span className="kpi-delta-prev">vs {previous.toLocaleString("pl-PL")}</span>
    </span>
  );
}

export default function KpiStrip({ kpi, formatDate, previousKpi, showComparison }: Props) {
  const showDelta = showComparison && previousKpi;

  return (
    <section className="kpi-grid">
      {/* Total Scans */}
      <div className="kpi-cell">
        <p className="kpi-label">Wszystkie skany</p>
        <p className="kpi-value">
          {kpi?.totalScans.toLocaleString("pl-PL") ?? "0"}
        </p>
        {showDelta ? (
          <DeltaBadge current={kpi?.totalScans ?? 0} previous={previousKpi.totalScans} />
        ) : (
          <p className="kpi-sub">Łącznie zarejestrowanych</p>
        )}
      </div>

      {/* Unique Users */}
      <div className="kpi-cell kpi-cell--bordered">
        <p className="kpi-label">Unikalni</p>
        <p className="kpi-value" style={{ color: "var(--accent)" }}>
          {kpi?.uniqueUsers.toLocaleString("pl-PL") ?? "0"}
        </p>
        {showDelta ? (
          <DeltaBadge current={kpi?.uniqueUsers ?? 0} previous={previousKpi.uniqueUsers} />
        ) : (
          <p className="kpi-sub">Różne urządzenia</p>
        )}
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
        <p className="kpi-value" style={{ color: "var(--success)" }}>
          {kpi?.avgScansPerUser ?? 0}x
        </p>
        {showDelta ? (
          <DeltaBadge current={kpi?.avgScansPerUser ?? 0} previous={previousKpi.avgScansPerUser} />
        ) : (
          <p className="kpi-sub">
            {(kpi?.avgScansPerUser ?? 0) <= 1.2 ? "Większość skanuje raz" : "Użytkownicy wracają"}
          </p>
        )}
      </div>
    </section>
  );
}
