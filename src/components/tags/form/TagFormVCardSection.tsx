"use client";

import React, { useState } from "react";
import type { VCardData } from "@/types/vcard";

interface Props {
  tagType: string;
  vcard: VCardData;
  setVcard: (v: VCardData) => void;
  readOnly: boolean;
  errors: Record<string, string>;
  clearFieldError: (f: string) => void;
}

interface FieldDef {
  key: string;
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}

const SECTIONS: { title: string; collapsed?: boolean; fields: FieldDef[] }[] = [
  {
    title: "Dane osobowe",
    fields: [
      { key: "firstName", label: "Imie", required: true },
      { key: "lastName", label: "Nazwisko", required: true },
      { key: "company", label: "Firma" },
      { key: "jobTitle", label: "Stanowisko" },
    ],
  },
  {
    title: "Kontakt",
    fields: [
      { key: "phone", label: "Telefon", type: "tel", placeholder: "+48..." },
      { key: "email", label: "Email", type: "email" },
      { key: "website", label: "Strona WWW", type: "url", placeholder: "https://..." },
      { key: "address", label: "Adres" },
    ],
  },
  {
    title: "Social Media",
    collapsed: true,
    fields: [
      { key: "instagram", label: "Instagram", placeholder: "@username lub URL" },
      { key: "facebook", label: "Facebook", placeholder: "username lub URL" },
      { key: "linkedin", label: "LinkedIn", placeholder: "username lub URL" },
      { key: "whatsapp", label: "WhatsApp", placeholder: "+48..." },
      { key: "tiktok", label: "TikTok", placeholder: "@username lub URL" },
      { key: "youtube", label: "YouTube", placeholder: "@channel lub URL" },
      { key: "telegram", label: "Telegram", placeholder: "@username lub URL" },
    ],
  },
  {
    title: "Notatka",
    fields: [
      { key: "note", label: "Notatka", placeholder: "Dodatkowe informacje..." },
    ],
  },
];

export default function TagFormVCardSection({
  tagType, vcard, setVcard, readOnly, errors, clearFieldError,
}: Props) {
  const [socialOpen, setSocialOpen] = useState(false);

  if (tagType !== "vcard") return null;

  const updateField = (key: string, value: string) => {
    setVcard({ ...vcard, [key]: value });
    clearFieldError("vcard");
  };

  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>Wizytowka</h3>

      {errors.vcard && <div style={{ ...styles.error, marginBottom: 12 }}>{errors.vcard}</div>}

      {SECTIONS.map((sec) => {
        const isCollapsible = sec.collapsed;

        if (isCollapsible) {
          return (
            <div key={sec.title} style={{ marginBottom: 16 }}>
              <button
                onClick={() => setSocialOpen(!socialOpen)}
                style={styles.collapseBtn}
              >
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
                  style={{
                    transform: socialOpen ? "rotate(90deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <span>{sec.title}</span>
                <span style={styles.collapseBadge}>{sec.fields.length} pol</span>
              </button>

              {socialOpen && (
                <div style={styles.fieldGrid}>
                  {sec.fields.map((f) => (
                    <div key={f.key} style={styles.field}>
                      <label style={styles.label}>{f.label}</label>
                      <input
                        style={styles.input}
                        type={f.type || "text"}
                        value={(vcard as unknown as Record<string, string>)[f.key] || ""}
                        onChange={(e) => updateField(f.key, e.target.value)}
                        placeholder={f.placeholder || ""}
                        disabled={readOnly}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        /* Note field gets a textarea */
        if (sec.title === "Notatka") {
          return (
            <div key={sec.title} style={{ marginBottom: 16 }}>
              <div style={styles.subsectionTitle}>{sec.title}</div>
              <textarea
                style={{ ...styles.input, minHeight: 70, resize: "vertical" as const, width: "100%" }}
                value={vcard.note || ""}
                onChange={(e) => updateField("note", e.target.value)}
                placeholder="Dodatkowe informacje..."
                disabled={readOnly}
              />
            </div>
          );
        }

        return (
          <div key={sec.title} style={{ marginBottom: 16 }}>
            <div style={styles.subsectionTitle}>{sec.title}</div>
            <div style={styles.fieldGrid}>
              {sec.fields.map((f) => (
                <div key={f.key} style={styles.field}>
                  <label style={styles.label}>
                    {f.label}
                    {f.required && <span style={{ color: "#f87171" }}> *</span>}
                  </label>
                  <input
                    style={styles.input}
                    type={f.type || "text"}
                    value={(vcard as unknown as Record<string, string>)[f.key] || ""}
                    onChange={(e) => updateField(f.key, e.target.value)}
                    placeholder={f.placeholder || ""}
                    disabled={readOnly}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
const styles: Record<string, React.CSSProperties> = {
  section: {
    marginBottom: 28,
    padding: 20,
    borderRadius: 12,
    background: "#12151c",
    border: "1px solid #2a2e38",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "#8a92a4",
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "#555c6e",
    marginBottom: 10,
  },
  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#8a92a4",
  },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #2a2e38",
    background: "#1a1d26",
    color: "#eaf0f6",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box" as const,
  },
  collapseBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #2a2e38",
    background: "#1a1d26",
    color: "#8a92a4",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    cursor: "pointer",
    width: "100%",
    transition: "all 0.15s",
    marginBottom: 8,
  },
  collapseBadge: {
    marginLeft: "auto",
    fontSize: 11,
    fontWeight: 500,
    color: "#555c6e",
    textTransform: "none" as const,
    letterSpacing: 0,
  },
  error: {
    fontSize: 12,
    color: "#f87171",
    fontWeight: 500,
  },
};
