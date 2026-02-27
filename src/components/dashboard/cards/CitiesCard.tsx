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
      <h3 style={{ fontSize: 11, fontWeight: 600, marginBottom: 14, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
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
            borderBottom: i < arr.length - 1 ? "1px solid rgba(148,163,184,0.08)" : "none",
          }}
        >
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: "#F1F5F9" }}>
              {c.city}
            </p>
            <p style={{ fontSize: 11, color: "#64748B" }}>{c.country}</p>
          </div>
          <div style={{ textAlign: "right", display: "flex", gap: 12, alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#F1F5F9", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>{c.count}</span>
              <span style={{ fontSize: 10, color: "#94A3B8", marginLeft: 4 }}>sk.</span>
            </div>
            <div style={{ borderLeft: "1px solid rgba(148,163,184,0.08)", paddingLeft: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#38BDF8", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>{c.uniqueUsers}</span>
              <span style={{ fontSize: 10, color: "#94A3B8", marginLeft: 4 }}>unik.</span>
            </div>
          </div>
        </div>
      ))}
      {topCities.length > 5 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(148,163,184,0.08)" }}>
          <span style={{ fontSize: 10, color: "#64748B" }}>{Math.min(citiesPage * 5, topCities.length)}/{topCities.length}</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              disabled={citiesPage <= 1}
              onClick={() => setCitiesPage(p => p - 1)}
              style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: citiesPage <= 1 ? "#3d4250" : "#94A3B8", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: citiesPage <= 1 ? "default" : "pointer" }}
            >← Poprz.</button>
            <button
              disabled={citiesPage * 5 >= topCities.length}
              onClick={() => setCitiesPage(p => p + 1)}
              style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: citiesPage * 5 >= topCities.length ? "#3d4250" : "#94A3B8", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: citiesPage * 5 >= topCities.length ? "default" : "pointer" }}
            >Nast. →</button>
          </div>
        </div>
      )}
    </div>
  );
}
