"use client";

import React from "react";

interface Props {
  value: string;
  onChange: (type: string) => void;
  disabled?: boolean;
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
    color: "#f5b731",
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
];

export default function TagFormTypeSelector({ value, onChange, disabled }: Props) {
  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>Typ akcji</h3>
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
                borderColor: selected ? t.color : "#1e2d45",
                background: selected ? `${t.color}10` : "#0c1220",
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              <div style={{ color: selected ? t.color : "#5a6478", transition: "color 0.2s" }}>
                {t.icon}
              </div>
              <div>
                <div style={{ ...styles.cardLabel, color: selected ? "#e8ecf1" : "#8b95a8" }}>
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
    color: "#8b95a8",
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
    border: "1.5px solid #1e2d45",
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
    color: "#5a6478",
    marginTop: 2,
    lineHeight: 1.3,
  },
};
