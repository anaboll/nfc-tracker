"use client";

import React from "react";
import type { ScanRow } from "@/types/dashboard";

interface GuestModalData {
  ipHash: string;
  guestKey: string;
}

interface Props {
  guestModal: GuestModalData;
  onClose: () => void;
  guestScans: ScanRow[];
  guestLoading: boolean;
}

export default function GuestModal({ guestModal, onClose, guestScans, guestLoading }: Props) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100000,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#14171e",
          border: "1px solid rgba(148,163,184,0.08)",
          borderRadius: 8,
          width: "min(760px, 95vw)",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(148,163,184,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.35)",
              color: "#818cf8",
              borderRadius: 6,
              padding: "3px 10px",
              fontSize: 13,
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              letterSpacing: 0.5,
            }}>
              #{guestModal.guestKey}
            </span>
            <span style={{ color: "#94A3B8", fontSize: 12 }}>
              {guestLoading ? "Ladowanie..." : `${guestScans.length} skan${guestScans.length === 1 ? "" : guestScans.length < 5 ? "y" : "ow"}`}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#F1F5F9")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#64748B")}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "12px 20px 20px" }}>
          {guestLoading && (
            <p style={{ color: "#64748B", fontSize: 12, textAlign: "center", padding: "32px 0" }}>Ladowanie skanow...</p>
          )}
          {!guestLoading && guestScans.length === 0 && (
            <p style={{ color: "#64748B", fontSize: 12, textAlign: "center", padding: "32px 0" }}>Brak skanow</p>
          )}
          {!guestLoading && guestScans.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid rgba(148,163,184,0.15)" }}>
                  {["#", "Data/Czas", "Akcja", "Zrodlo", "Urzadzenie", "Miasto", "Ponowny"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "6px 8px", color: "#94A3B8", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {guestScans.map((s, idx) => (
                  <tr
                    key={s.id}
                    style={{ borderBottom: "1px solid #1C2541", transition: "background 0.15s" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#151D35")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                  >
                    <td style={{ padding: "5px 8px", color: "#64748B", fontFamily: "var(--font-mono)" }}>{idx + 1}</td>
                    <td style={{ padding: "5px 8px", color: "#F1F5F9", fontFamily: "var(--font-mono)", fontSize: 10, whiteSpace: "nowrap" }}>
                      {new Date(s.timestamp).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </td>
                    <td style={{ padding: "5px 8px" }}>
                      <span style={{ color: "#7dd3fc", fontWeight: 600 }}>{s.tagName}</span>
                    </td>
                    <td style={{ padding: "5px 8px" }}>
                      {s.eventSource === "qr" ? (
                        <span style={{ padding: "1px 5px", borderRadius: 3, fontSize: 9, fontWeight: 700, background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>QR</span>
                      ) : s.nfcId ? (
                        <span style={{ padding: "1px 5px", borderRadius: 3, fontSize: 9, fontWeight: 700, background: "rgba(0,200,160,0.12)", color: "#7dd3fc", border: "1px solid rgba(0,200,160,0.25)" }}>NFC</span>
                      ) : (
                        <span style={{ color: "#3d4250" }}>&mdash;</span>
                      )}
                    </td>
                    <td style={{ padding: "5px 8px" }}>
                      <span style={{
                        padding: "2px 6px", borderRadius: 3, fontSize: 10, fontWeight: 600,
                        background: s.deviceType === "iOS" ? "rgba(96,165,250,0.1)" : s.deviceType === "Android" ? "rgba(16,185,129,0.1)" : "rgba(139,149,168,0.1)",
                        color: s.deviceType === "iOS" ? "#60a5fa" : s.deviceType === "Android" ? "#10b981" : "#94A3B8",
                      }}>
                        {s.deviceType}
                      </span>
                    </td>
                    <td style={{ padding: "5px 8px", color: "#94A3B8" }}>{s.city || "\u2014"}</td>
                    <td style={{ padding: "5px 8px" }}>
                      {s.isReturning
                        ? <span style={{ color: "#f59e0b", fontSize: 10, fontWeight: 600 }}>Tak</span>
                        : <span style={{ color: "#3d4250", fontSize: 10 }}>Nie</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
