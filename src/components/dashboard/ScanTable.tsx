"use client";

import React from "react";
import { getCountryFlag } from "@/lib/utils";
import type { ScansResponse, ScanRow } from "@/types/dashboard";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scanTableRef: any;
  showScanTable: boolean;
  setShowScanTable: (v: boolean) => void;
  scanData: ScansResponse | null;
  scanLoading: boolean;
  scanSortBy: string;
  scanSortDir: string;
  scanNfcFilter: string | null;
  scanSourceFilter: string;
  onToggle: () => void;
  onSort: (key: string) => void;
  onPageChange: (page: number) => void;
  onNfcFilter: (nfcId: string | null) => void;
  onTagFilter: (tagId: string) => void;
  onGuestClick: (ipHash: string, guestKey: string) => void;
}

export default function ScanTable({
  scanTableRef,
  showScanTable,
  setShowScanTable,
  scanData,
  scanLoading,
  scanSortBy,
  scanSortDir,
  scanNfcFilter,
  scanSourceFilter,
  onToggle,
  onSort,
  onPageChange,
  onNfcFilter,
  onTagFilter,
  onGuestClick,
}: Props) {
  return (
    <section ref={scanTableRef} className="card" style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h3 style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
            Lista skanow
          </h3>
          <button
            onClick={onToggle}
            style={{
              background: showScanTable ? "rgba(0,200,160,0.12)" : "#243052",
              border: `1px solid ${showScanTable ? "rgba(0,200,160,0.3)" : "rgba(148,163,184,0.15)"}`,
              color: showScanTable ? "#7dd3fc" : "#94A3B8",
              borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600,
            }}
          >
            {showScanTable ? "Ukryj" : "Pokaz"} {scanData ? `(${scanData.total})` : ""}
          </button>
          {scanSourceFilter !== "all" && (
            <span style={{
              padding: "3px 10px", fontSize: 11, fontWeight: 600, borderRadius: 6,
              background: scanSourceFilter === "qr" ? "rgba(16,185,129,0.15)" : "rgba(56,189,248,0.12)",
              color: scanSourceFilter === "qr" ? "#10b981" : "#7dd3fc",
              border: `1px solid ${scanSourceFilter === "qr" ? "rgba(16,185,129,0.3)" : "rgba(0,200,160,0.3)"}`,
            }}>
              {scanSourceFilter.toUpperCase()}
            </span>
          )}
        </div>
        {showScanTable && scanNfcFilter && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)" }}>
            <span style={{ fontSize: 11, color: "#a78bfa" }}>NFC: {scanNfcFilter}</span>
            <button onClick={() => onNfcFilter(null)} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: 14 }}>×</button>
          </div>
        )}
      </div>

      {showScanTable && (
        <>
          {scanLoading && <p style={{ fontSize: 12, color: "#64748B", padding: "20px 0", textAlign: "center" }}>Ladowanie...</p>}
          {scanData && !scanLoading && (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid rgba(148,163,184,0.15)" }}>
                      {[
                        { key: "seq", label: "#", w: 40 },
                        { key: "timestamp", label: "Data/Czas", w: 140 },
                        { key: "tagId", label: "Akcja", w: 140 },
                        { key: "nfcId", label: "Źródło / ID", w: 130 },
                        { key: "deviceType", label: "Urzadzenie", w: 80 },
                        { key: "country", label: "Kraj", w: 60 },
                        { key: "city", label: "Miasto", w: 100 },
                      ].map(col => (
                        <th
                          key={col.key}
                          onClick={() => { if (col.key !== "seq") onSort(col.key); }}
                          style={{
                            textAlign: "left",
                            padding: "8px 8px",
                            color: scanSortBy === col.key ? "#7dd3fc" : "#94A3B8",
                            fontWeight: 600,
                            cursor: col.key === "seq" ? "default" : "pointer",
                            minWidth: col.w,
                            whiteSpace: "nowrap",
                            userSelect: "none",
                          }}
                        >
                          {col.label}
                          {scanSortBy === col.key && (
                            <span style={{ marginLeft: 4 }}>{scanSortDir === "desc" ? "↓" : "↑"}</span>
                          )}
                        </th>
                      ))}
                      <th style={{ textAlign: "left", padding: "8px 8px", color: "#94A3B8", fontWeight: 600 }}>Jezyk</th>
                      <th style={{ textAlign: "left", padding: "8px 8px", color: "#94A3B8", fontWeight: 600 }} title="Czy ta osoba skanowala te sama akcje wczesniej">Ponowny</th>
                      <th
                        onClick={() => onSort("ipHash")}
                        style={{ textAlign: "left", padding: "8px 8px", color: scanSortBy === "ipHash" ? "#7dd3fc" : "#94A3B8", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", userSelect: "none" }}
                        title="Sortuj po gosciu — grupuje skany tej samej osoby razem"
                      >
                        Gość {scanSortBy === "ipHash" && <span style={{ marginLeft: 4 }}>{scanSortDir === "desc" ? "↓" : "↑"}</span>}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanData.rows.map((scan) => (
                      <tr key={scan.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "6px 8px", color: "#64748B", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                          {scan.seq}
                        </td>
                        <td style={{ padding: "6px 8px", color: "#F1F5F9", fontFamily: "var(--font-mono)", fontSize: 10 }}>
                          {new Date(scan.timestamp).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </td>
                        <td style={{ padding: "6px 8px" }}>
                          <button
                            onClick={() => onTagFilter(scan.tagId)}
                            style={{ background: "none", border: "none", color: "#7dd3fc", cursor: "pointer", fontSize: 11, fontWeight: 600, padding: 0, textDecoration: "underline" }}
                            title={`Filtruj po: ${scan.tagName}`}
                          >
                            {scan.tagName}
                          </button>
                          <span style={{ fontSize: 9, color: "#64748B", marginLeft: 4 }}>{scan.tagId}</span>
                        </td>
                        <td style={{ padding: "6px 8px" }}>
                          {scan.eventSource === "qr" ? (
                            <span style={{ padding: "1px 5px", borderRadius: 3, fontSize: 9, fontWeight: 700, background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)", letterSpacing: 0.5 }}>QR</span>
                          ) : scan.nfcId ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <span style={{ padding: "1px 5px", borderRadius: 3, fontSize: 9, fontWeight: 700, background: "rgba(0,200,160,0.12)", color: "#7dd3fc", border: "1px solid rgba(0,200,160,0.25)", letterSpacing: 0.5 }}>NFC</span>
                              <button
                                onClick={() => onNfcFilter(scan.nfcId)}
                                style={{ background: "none", border: "none", color: "#a78bfa", cursor: "pointer", fontSize: 10, fontFamily: "var(--font-mono)", padding: 0, textDecoration: "underline" }}
                              >{scan.nfcId}</button>
                            </div>
                          ) : (
                            <span style={{ color: "#3d4250" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "6px 8px", color: "#94A3B8" }}>
                          <span style={{
                            padding: "2px 6px", borderRadius: 3, fontSize: 10, fontWeight: 600,
                            background: scan.deviceType === "iOS" ? "rgba(96,165,250,0.1)" : scan.deviceType === "Android" ? "rgba(16,185,129,0.1)" : "rgba(139,149,168,0.1)",
                            color: scan.deviceType === "iOS" ? "#60a5fa" : scan.deviceType === "Android" ? "#10b981" : "#94A3B8",
                          }}>
                            {scan.deviceType}
                          </span>
                        </td>
                        <td style={{ padding: "6px 8px", color: "#94A3B8" }}>
                          {scan.country ? `${getCountryFlag(scan.country)} ${scan.country}` : "—"}
                        </td>
                        <td style={{ padding: "6px 8px", color: "#94A3B8" }}>{scan.city || "—"}</td>
                        <td style={{ padding: "6px 8px", color: "#64748B", fontSize: 10 }}>{scan.browserLang || "—"}</td>
                        <td style={{ padding: "6px 8px" }}>
                          {scan.isReturning ? (
                            <span style={{ color: "#f59e0b", fontSize: 10, fontWeight: 600 }}>Tak</span>
                          ) : (
                            <span style={{ color: "#3d4250", fontSize: 10 }}>Nie</span>
                          )}
                        </td>
                        <td style={{ padding: "6px 8px" }}>
                          {scan.ipHash ? (
                            <button
                              onClick={() => onGuestClick(scan.ipHash!, scan.guestKey ?? scan.ipHash!.slice(0, 7))}
                              style={{
                                background: "rgba(99,102,241,0.12)",
                                border: "1px solid rgba(99,102,241,0.3)",
                                color: "#818cf8",
                                borderRadius: 4,
                                padding: "2px 7px",
                                fontSize: 10,
                                fontFamily: "var(--font-mono)",
                                fontWeight: 700,
                                cursor: "pointer",
                                letterSpacing: 0.5,
                                transition: "background 0.15s",
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.25)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "rgba(99,102,241,0.12)")}
                              title="Kliknij aby zobaczyc wszystkie skany tej osoby"
                            >
                              #{scan.guestKey ?? scan.ipHash!.slice(0, 7)}
                            </button>
                          ) : (
                            <span style={{ color: "#3d4250" }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(148,163,184,0.08)" }}>
                <span style={{ fontSize: 11, color: "#64748B" }}>
                  {scanData.total} skanów • strona {scanData.page}/{scanData.totalPages}
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    disabled={scanData.page <= 1}
                    onClick={() => onPageChange(scanData.page - 1)}
                    style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: scanData.page <= 1 ? "#3d4250" : "#94A3B8", borderRadius: 6, padding: "5px 12px", fontSize: 11, cursor: scanData.page <= 1 ? "default" : "pointer" }}
                  >
                    ← Poprz.
                  </button>
                  <button
                    disabled={scanData.page >= scanData.totalPages}
                    onClick={() => onPageChange(scanData.page + 1)}
                    style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: scanData.page >= scanData.totalPages ? "#3d4250" : "#94A3B8", borderRadius: 6, padding: "5px 12px", fontSize: 11, cursor: scanData.page >= scanData.totalPages ? "default" : "pointer" }}
                  >
                    Nast. →
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
