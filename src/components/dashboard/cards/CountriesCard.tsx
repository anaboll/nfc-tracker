"use client";

import React, { useState } from "react";
import type { Country } from "@/types/dashboard";
import { getCountryFlag } from "@/lib/utils";
import EmptyState from "@/components/ui/EmptyState";

interface CountriesCardProps {
  topCountries: Country[];
}

export default function CountriesCard({ topCountries }: CountriesCardProps) {
  const [countriesPage, setCountriesPage] = useState(1);

  return (
    <div className="card">
      <h3 style={{ fontSize: 11, fontWeight: 600, marginBottom: 14, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Kraje
      </h3>
      {topCountries.length === 0 && (
        <EmptyState icon="globe" message="Brak danych o krajach" hint="Skany pojawią się gdy użytkownicy zaczną skanować" />
      )}
      {topCountries.slice((countriesPage - 1) * 5, countriesPage * 5).map((c, i, arr) => (
        <div
          key={c.country}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 0",
            borderBottom: i < arr.length - 1 ? "1px solid rgba(148,163,184,0.08)" : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>{getCountryFlag(c.country)}</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#F1F5F9" }}>
              {c.country}
            </span>
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
      {topCountries.length > 5 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(148,163,184,0.08)" }}>
          <span style={{ fontSize: 10, color: "#64748B" }}>{Math.min(countriesPage * 5, topCountries.length)}/{topCountries.length}</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              disabled={countriesPage <= 1}
              onClick={() => setCountriesPage(p => p - 1)}
              style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: countriesPage <= 1 ? "#3d4250" : "#94A3B8", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: countriesPage <= 1 ? "default" : "pointer" }}
            >← Poprz.</button>
            <button
              disabled={countriesPage * 5 >= topCountries.length}
              onClick={() => setCountriesPage(p => p + 1)}
              style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: countriesPage * 5 >= topCountries.length ? "#3d4250" : "#94A3B8", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: countriesPage * 5 >= topCountries.length ? "default" : "pointer" }}
            >Nast. →</button>
          </div>
        </div>
      )}
    </div>
  );
}
