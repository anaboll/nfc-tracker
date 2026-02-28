"use client";

import React, { useState } from "react";
import type { NfcChip } from "@/types/dashboard";

interface Props {
  nfcChips: NfcChip[];
  onChipClick?: (nfcId: string) => void;
}

const PAGE_SIZE = 50;

export default function NfcChipsCard({ nfcChips, onChipClick }: Props) {
  const [collapsed, setCollapsed] = useState(true);
  const [page, setPage] = useState(1);

  if (!nfcChips || nfcChips.length === 0) return null;

  const totalNfc = nfcChips.reduce((s, c) => s + c.count, 0);
  const totalPages = Math.ceil(nfcChips.length / PAGE_SIZE);
  const pageChips = nfcChips.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section className="card">
      {/* Header with toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h3 style={{ fontSize: 11, fontWeight: 600, color: "var(--txt-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", margin: 0 }}>
            Fizyczne breloczki NFC
          </h3>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: !collapsed ? "rgba(0,200,160,0.12)" : "var(--surface-3)",
              border: `1px solid ${!collapsed ? "rgba(0,200,160,0.3)" : "rgba(148,163,184,0.15)"}`,
              color: !collapsed ? "#7dd3fc" : "#94A3B8",
              borderRadius: 6,
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
            title={collapsed ? "Pokaż breloczki NFC" : "Ukryj breloczki NFC"}
          >
            {collapsed ? "Pokaz" : "Ukryj"} ({nfcChips.length})
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <p style={{ fontSize: 12, color: "var(--txt-muted)", marginBottom: 16 }}>
            Unikalne chipy NFC ({nfcChips.length} {nfcChips.length === 1 ? "breloczek" : "breloczków"}, {totalNfc} skanów łącznie)
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--txt-sec)", fontWeight: 600 }}>#</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", color: "var(--txt-sec)", fontWeight: 600 }}>NFC Chip ID</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", color: "var(--txt-sec)", fontWeight: 600 }}>Skany</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", color: "var(--txt-sec)", fontWeight: 600 }}>Udział</th>
                  {onChipClick && <th style={{ padding: "8px 12px" }}></th>}
                </tr>
              </thead>
              <tbody>
                {pageChips.map((chip, idx) => {
                  const pct = totalNfc > 0 ? Math.round((chip.count / totalNfc) * 100) : 0;
                  const globalIdx = (page - 1) * PAGE_SIZE + idx;
                  return (
                    <tr key={chip.nfcId} style={{ borderBottom: "1px solid var(--surface-2)" }}>
                      <td style={{ padding: "8px 12px", color: "var(--txt-muted)" }}>{globalIdx + 1}</td>
                      <td style={{ padding: "8px 12px" }}>
                        {onChipClick ? (
                          <button
                            onClick={() => onChipClick(chip.nfcId)}
                            style={{ background: "none", border: "none", fontFamily: "var(--font-mono)", color: "var(--accent-light)", fontWeight: 600, cursor: "pointer", textDecoration: "underline", padding: 0, fontSize: 12 }}
                            title="Kliknij zeby zobaczyc skany tego chipa"
                          >
                            {chip.nfcId}
                          </button>
                        ) : (
                          <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-light)", fontWeight: 600, fontSize: 12 }}>
                            {chip.nfcId}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "var(--txt)" }}>{chip.count}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                          <div style={{ width: 50, height: 4, background: "transparent", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: "#8b5cf6", borderRadius: 2 }} />
                          </div>
                          <span style={{ color: "var(--txt-sec)", minWidth: 30 }}>{pct}%</span>
                        </div>
                      </td>
                      {onChipClick && (
                        <td style={{ padding: "8px 12px" }}>
                          <button
                            onClick={() => onChipClick(chip.nfcId)}
                            style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--accent)", borderRadius: 4, padding: "3px 8px", fontSize: 10, cursor: "pointer" }}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)",
            }}>
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                style={{
                  background: "transparent", border: "1px solid var(--border)", color: page === 1 ? "var(--txt-muted)" : "var(--txt-sec)",
                  borderRadius: 4, padding: "4px 8px", fontSize: 11, cursor: page === 1 ? "default" : "pointer", opacity: page === 1 ? 0.4 : 1,
                }}
              >
                ««
              </button>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                style={{
                  background: "transparent", border: "1px solid var(--border)", color: page === 1 ? "var(--txt-muted)" : "var(--txt-sec)",
                  borderRadius: 4, padding: "4px 8px", fontSize: 11, cursor: page === 1 ? "default" : "pointer", opacity: page === 1 ? 0.4 : 1,
                }}
              >
                ‹
              </button>

              {/* Page numbers */}
              {(() => {
                const pages: number[] = [];
                const start = Math.max(1, page - 2);
                const end = Math.min(totalPages, page + 2);
                for (let p = start; p <= end; p++) pages.push(p);
                return pages.map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      background: p === page ? "var(--accent)" : "transparent",
                      border: p === page ? "1px solid var(--accent)" : "1px solid var(--border)",
                      color: p === page ? "#fff" : "var(--txt-sec)",
                      borderRadius: 4, padding: "4px 10px", fontSize: 11, fontWeight: p === page ? 700 : 500,
                      cursor: "pointer", minWidth: 30,
                    }}
                  >
                    {p}
                  </button>
                ));
              })()}

              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                style={{
                  background: "transparent", border: "1px solid var(--border)", color: page === totalPages ? "var(--txt-muted)" : "var(--txt-sec)",
                  borderRadius: 4, padding: "4px 8px", fontSize: 11, cursor: page === totalPages ? "default" : "pointer", opacity: page === totalPages ? 0.4 : 1,
                }}
              >
                ›
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                style={{
                  background: "transparent", border: "1px solid var(--border)", color: page === totalPages ? "var(--txt-muted)" : "var(--txt-sec)",
                  borderRadius: 4, padding: "4px 8px", fontSize: 11, cursor: page === totalPages ? "default" : "pointer", opacity: page === totalPages ? 0.4 : 1,
                }}
              >
                »»
              </button>

              <span style={{ fontSize: 11, color: "var(--txt-muted)", marginLeft: 8 }}>
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, nfcChips.length)} z {nfcChips.length}
              </span>
            </div>
          )}
        </>
      )}
    </section>
  );
}
