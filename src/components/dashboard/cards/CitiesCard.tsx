"use client";

import React, { useState } from "react";
import type { City } from "@/types/dashboard";
import EmptyState from "@/components/ui/EmptyState";

interface CitiesCardProps {
  topCities: City[];
}

export default function CitiesCard({ topCities }: CitiesCardProps) {
  const [citiesPage, setCitiesPage] = useState(1);

  return (
    <div className="card">
      <h3 style={{ fontSize: 11, fontWeight: 600, marginBottom: 14, color: "var(--txt-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Miasta
      </h3>
      {topCities.length === 0 && (
        <EmptyState icon="city" message="Brak danych o miastach" hint="Lokalizacje pojawią się po pierwszych skanach" />
      )}
      {topCities.slice((citiesPage - 1) * 5, citiesPage * 5).map((c, i, arr) => (
        <div
          key={`${c.city}-${c.country}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 0",
            borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
          }}
        >
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: "var(--txt)" }}>
              {c.city}
            </p>
            <p style={{ fontSize: 11, color: "var(--txt-muted)" }}>{c.country}</p>
          </div>
          <div style={{ textAlign: "right", display: "flex", gap: 12, alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--txt)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>{c.count}</span>
              <span style={{ fontSize: 10, color: "var(--txt-sec)", marginLeft: 4 }}>sk.</span>
            </div>
            <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>{c.uniqueUsers}</span>
              <span style={{ fontSize: 10, color: "var(--txt-sec)", marginLeft: 4 }}>unik.</span>
            </div>
          </div>
        </div>
      ))}
      {topCities.length > 5 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
          <span style={{ fontSize: 10, color: "var(--txt-muted)" }}>{Math.min(citiesPage * 5, topCities.length)}/{topCities.length}</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              disabled={citiesPage <= 1}
              onClick={() => setCitiesPage(p => p - 1)}
              style={{ background: "transparent", border: "1px solid var(--border)", color: citiesPage <= 1 ? "var(--border-hover)" : "var(--txt-sec)", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: citiesPage <= 1 ? "default" : "pointer" }}
            >← Poprz.</button>
            <button
              disabled={citiesPage * 5 >= topCities.length}
              onClick={() => setCitiesPage(p => p + 1)}
              style={{ background: "transparent", border: "1px solid var(--border)", color: citiesPage * 5 >= topCities.length ? "var(--border-hover)" : "var(--txt-sec)", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: citiesPage * 5 >= topCities.length ? "default" : "pointer" }}
            >Nast. →</button>
          </div>
        </div>
      )}
    </div>
  );
}
