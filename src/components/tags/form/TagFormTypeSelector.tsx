"use client";

import React from "react";

interface Props {
  value: string;
  onChange: (type: string) => void;
  disabled?: boolean;
  /* Tryb edit + locked: pokazujemy guzik "Zmien typ" zamiast pelnej blokady. */
  showUnlockButton?: boolean;
  onUnlock?: () => void;
}

const TYPES = [
  {
    value: "url",
    label: "URL Redirect",
    desc: "Przekierowanie na zewnetrzny link",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
      </svg>
    ),
    color: "#60a5fa",
  },
  {
    value: "vcard",
    label: "Wizytowka",
    desc: "Cyfrowa wizytowka kontaktowa",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    ),
    color: "#10b981",
  },
  {
    value: "multilink",
    label: "Multi-link",
    desc: "Strona z wieloma linkami",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
    color: "#2ee8c0",
  },
  {
    value: "video",
    label: "Video",
    desc: "Hosting i tracking wideo",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
    color: "#9f67ff",
  },
  {
    value: "google-review",
    label: "Recenzja Google",
    desc: "Link do recenzji Google",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    color: "#fb923c",
  },
  {
    value: "file",
    label: "Plik (PDF)",
    desc: "Przekierowanie do wgranego pliku",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="15" x2="15" y2="15" />
        <line x1="9" y1="18" x2="13" y2="18" />
      </svg>
    ),
    color: "#facc15",
  },
  {
    value: "certificate",
    label: "Certyfikat",
    desc: "Autentycznosc dziela sztuki",
    icon: (
      /* Rozetka z wstazka — klasyczny symbol odznaczenia / certyfikatu */
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="6" />
        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
      </svg>
    ),
    color: "#c9a961",
  },
];

export default function TagFormTypeSelector({ value, onChange, disabled, showUnlockButton, onUnlock }: Props) {
  return (
    <div style={styles.section}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ ...styles.sectionTitle, marginBottom: 0 }}>Typ akcji</h3>
        {showUnlockButton && onUnlock && (
          <button
            type="button"
            onClick={onUnlock}
            style={styles.unlockBtn}
            title="Zmien typ akcji (link NFC/QR pozostaje ten sam)"
          >
            🔓 Zmien typ
          </button>
        )}
      </div>
      <div style={styles.grid}>
        {TYPES.map((t) => {
          const selected = value === t.value;
          return (
            <button
              key={t.value}
              onClick={() => !disabled && onChange(t.value)}
              disabled={disabled}
              style={{
                ...styles.card,
                borderColor: selected ? t.color : "#2a2e38",
                background: selected ? `${t.color}10` : "#12151c",
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              <div style={{ color: selected ? t.color : "#555c6e", transition: "color 0.2s" }}>
                {t.icon}
              </div>
              <div>
                <div style={{ ...styles.cardLabel, color: selected ? "#eaf0f6" : "#8a92a4" }}>
                  {t.label}
                </div>
                <div style={styles.cardDesc}>{t.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
const styles: Record<string, React.CSSProperties> = {
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "#8a92a4",
    marginBottom: 12,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: 10,
  },
  card: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
    borderRadius: 10,
    border: "1.5px solid #2a2e38",
    textAlign: "left" as const,
    transition: "all 0.2s",
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  cardDesc: {
    fontSize: 11,
    color: "#555c6e",
    marginTop: 2,
    lineHeight: 1.3,
  },
  unlockBtn: {
    padding: "6px 12px",
    borderRadius: 8,
    border: "1px solid var(--warning, #f59e0b)",
    background: "transparent",
    color: "var(--warning, #f59e0b)",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },
};
