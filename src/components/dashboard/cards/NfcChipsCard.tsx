"use client";

import React from "react";
import type { NfcChip } from "@/types/dashboard";

interface Props {
  nfcChips: NfcChip[];
  onChipClick?: (nfcId: string) => void;
}

export default function NfcChipsCard({ nfcChips, onChipClick }: Props) {
  if (!nfcChips || nfcChips.length === 0) return null;

  const totalNfc = nfcChips.reduce((s, c) => s + c.count, 0);

  return (
    <section className="card">
      <h3 style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 16 }}>
        Fizyczne breloczki NFC
      </h3>
      <p style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>
        Unikalne chipy NFC ({nfcChips.length} {nfcChips.length === 1 ? "breloczek" : "breloczków"}, {totalNfc} skanów łącznie)
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(148,163,184,0.08)" }}>
              <th style={{ textAlign: "left", padding: "8px 12px", color: "#94A3B8", fontWeight: 600 }}>#</th>
              <th style={{ textAlign: "left", padding: "8px 12px", color: "#94A3B8", fontWeight: 600 }}>NFC Chip ID</th>
              <th style={{ textAlign: "right", padding: "8px 12px", color: "#94A3B8", fontWeight: 600 }}>Skany</th>
              <th style={{ textAlign: "right", padding: "8px 12px", color: "#94A3B8", fontWeight: 600 }}>Udział</th>
              {onChipClick && <th style={{ padding: "8px 12px" }}></th>}
            </tr>
          </thead>
          <tbody>
            {nfcChips.map((chip, idx) => {
              const pct = totalNfc > 0 ? Math.round((chip.count / totalNfc) * 100) : 0;
              return (
                <tr key={chip.nfcId} style={{ borderBottom: "1px solid #1C2541" }}>
                  <td style={{ padding: "8px 12px", color: "#64748B" }}>{idx + 1}</td>
                  <td style={{ padding: "8px 12px" }}>
                    {onChipClick ? (
                      <button
                        onClick={() => onChipClick(chip.nfcId)}
                        style={{ background: "none", border: "none", fontFamily: "var(--font-mono)", color: "#7dd3fc", fontWeight: 600, cursor: "pointer", textDecoration: "underline", padding: 0, fontSize: 12 }}
                        title="Kliknij zeby zobaczyc skany tego chipa"
                      >
                        {chip.nfcId}
                      </button>
                    ) : (
                      <span style={{ fontFamily: "var(--font-mono)", color: "#7dd3fc", fontWeight: 600, fontSize: 12 }}>
                        {chip.nfcId}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#F1F5F9" }}>{chip.count}</td>
                  <td style={{ padding: "8px 12px", textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                      <div style={{ width: 50, height: 4, background: "transparent", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "#8b5cf6", borderRadius: 2 }} />
                      </div>
                      <span style={{ color: "#94A3B8", minWidth: 30 }}>{pct}%</span>
                    </div>
                  </td>
                  {onChipClick && (
                    <td style={{ padding: "8px 12px" }}>
                      <button
                        onClick={() => onChipClick(chip.nfcId)}
                        style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: "#60a5fa", borderRadius: 4, padding: "3px 8px", fontSize: 10, cursor: "pointer" }}
                      >
                        Pokaz skany
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
