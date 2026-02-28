"use client";

import React from "react";

interface GuestRow {
  rank: number;
  ipHash: string;
  guestKey: string;
  scanCount: number;
  uniqueActions: number;
  source: string;
  deviceType: string;
  city: string | null;
  country: string | null;
  lastSeen: string;
}

interface Props {
  showGuestsTable: boolean;
  guestsData: GuestRow[];
  guestsTotal: number;
  guestsLoading: boolean;
  onToggle: () => void;
  onGuestClick: (ipHash: string, guestKey: string) => void;
}

export default function GuestsTable({
  showGuestsTable,
  guestsData,
  guestsTotal,
  guestsLoading,
  onToggle,
  onGuestClick,
}: Props) {
  return (
    <section className="card" style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: showGuestsTable ? 16 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h3 style={{ fontSize: 11, fontWeight: 600, color: "var(--txt-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Top Gości</h3>
          <button
            onClick={onToggle}
            style={{
              background: showGuestsTable ? "rgba(0,200,160,0.12)" : "var(--surface-3)",
              border: `1px solid ${showGuestsTable ? "rgba(0,200,160,0.3)" : "var(--border-hover)"}`,
              color: showGuestsTable ? "var(--accent-light)" : "var(--txt-sec)",
              borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600,
            }}
          >
            {showGuestsTable ? "Ukryj" : "Pokaż"} {guestsTotal > 0 ? `(${guestsTotal})` : ""}
          </button>
        </div>
      </div>

      {showGuestsTable && (
        <>
          {guestsLoading && <p style={{ fontSize: 12, color: "var(--txt-muted)", padding: "20px 0", textAlign: "center" }}>Ładowanie...</p>}
          {!guestsLoading && guestsData.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--txt-muted)", padding: "20px 0", textAlign: "center" }}>Brak danych</p>
          )}
          {!guestsLoading && guestsData.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-hover)" }}>
                    {["#", "Gość", "Skanów", "Akcji", "Źródło", "Urządzenie", "Miasto", "Ostatni skan"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 8px", color: "var(--txt-sec)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {guestsData.map((g) => (
                    <tr key={g.ipHash}
                      style={{ borderBottom: "1px solid var(--surface-2)", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--surface)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "6px 8px", color: "var(--txt-muted)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{g.rank}</td>
                      <td style={{ padding: "6px 8px" }}>
                        <button
                          onClick={() => onGuestClick(g.ipHash, g.guestKey)}
                          style={{
                            background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)",
                            color: "#818cf8", borderRadius: 4, padding: "2px 7px",
                            fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700,
                            cursor: "pointer", letterSpacing: 0.5, transition: "background 0.15s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.25)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "rgba(99,102,241,0.12)")}
                        >
                          #{g.guestKey}
                        </button>
                      </td>
                      <td style={{ padding: "6px 8px", color: "var(--txt)", fontWeight: 600 }}>{g.scanCount}</td>
                      <td style={{ padding: "6px 8px", color: "var(--success)", fontWeight: 600 }}>{g.uniqueActions}</td>
                      <td style={{ padding: "6px 8px" }}>
                        {g.source === "qr" ? (
                          <span style={{ padding: "1px 5px", borderRadius: 3, fontSize: 9, fontWeight: 700, background: "rgba(16,185,129,0.12)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.25)" }}>QR</span>
                        ) : g.source === "nfc" ? (
                          <span style={{ padding: "1px 5px", borderRadius: 3, fontSize: 9, fontWeight: 700, background: "rgba(0,200,160,0.12)", color: "var(--accent-light)", border: "1px solid rgba(0,200,160,0.25)" }}>NFC</span>
                        ) : g.source === "mixed" ? (
                          <span style={{ padding: "1px 5px", borderRadius: 3, fontSize: 9, fontWeight: 700, background: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.25)" }}>QR+NFC</span>
                        ) : <span style={{ color: "var(--border-hover)" }}>—</span>}
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        <span style={{
                          padding: "2px 6px", borderRadius: 3, fontSize: 10, fontWeight: 600,
                          background: g.deviceType === "iOS" ? "rgba(96,165,250,0.1)" : g.deviceType === "Android" ? "rgba(16,185,129,0.1)" : "rgba(139,149,168,0.1)",
                          color: g.deviceType === "iOS" ? "var(--accent)" : g.deviceType === "Android" ? "var(--success)" : "var(--txt-sec)",
                        }}>
                          {g.deviceType}
                        </span>
                      </td>
                      <td style={{ padding: "6px 8px", color: "var(--txt-sec)" }}>{g.city || "—"}</td>
                      <td style={{ padding: "6px 8px", color: "var(--txt-muted)", fontFamily: "var(--font-mono)", fontSize: 10 }}>
                        {new Date(g.lastSeen).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
