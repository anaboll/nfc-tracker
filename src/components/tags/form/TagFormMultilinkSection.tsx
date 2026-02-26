"use client";

import React from "react";
import type { TagLink } from "@/types/tag";
import { iconOptions } from "./iconOptions";

interface Props {
  tagType: string;
  links: TagLink[];
  setLinks: (v: TagLink[]) => void;
  readOnly: boolean;
  errors: Record<string, string>;
  clearFieldError: (f: string) => void;
}

export default function TagFormMultilinkSection({
  tagType, links, setLinks, readOnly, errors, clearFieldError,
}: Props) {
  if (tagType !== "multilink") return null;

  const updateLink = (idx: number, field: keyof TagLink, value: string) => {
    const updated = links.map((l, i) => (i === idx ? { ...l, [field]: value } : l));
    setLinks(updated);
    clearFieldError("links");
  };

  const addLink = () => {
    setLinks([...links, { label: "", url: "", icon: "link" }]);
  };

  const removeLink = (idx: number) => {
    if (links.length <= 1) {
      setLinks([{ label: "", url: "", icon: "link" }]);
    } else {
      setLinks(links.filter((_, i) => i !== idx));
    }
  };

  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>Linki</h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {links.map((link, idx) => (
          <div key={idx} style={styles.linkRow}>
            {/* Icon select */}
            <select
              style={{ ...styles.input, width: 130, flexShrink: 0 }}
              value={link.icon}
              onChange={(e) => updateLink(idx, "icon", e.target.value)}
              disabled={readOnly}
            >
              {iconOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Label */}
            <input
              style={{ ...styles.input, flex: 1, minWidth: 100 }}
              value={link.label}
              onChange={(e) => updateLink(idx, "label", e.target.value)}
              placeholder="Etykieta"
              disabled={readOnly}
            />

            {/* URL */}
            <input
              style={{ ...styles.input, flex: 2, minWidth: 160 }}
              value={link.url}
              onChange={(e) => updateLink(idx, "url", e.target.value)}
              placeholder="https://..."
              disabled={readOnly}
            />

            {/* Remove */}
            {!readOnly && (
              <button
                onClick={() => removeLink(idx)}
                style={styles.removeBtn}
                title="Usun link"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {errors.links && <div style={styles.error}>{errors.links}</div>}

      {!readOnly && (
        <button onClick={addLink} style={styles.addBtn}>
          + Dodaj link
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
const styles: Record<string, React.CSSProperties> = {
  section: {
    marginBottom: 28,
    padding: 20,
    borderRadius: 8,
    background: "#151D35",
    border: "1px solid #1C2541",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "#94A3B8",
    marginBottom: 12,
  },
  linkRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap" as const,
  },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #1C2541",
    background: "#1C2541",
    color: "#F1F5F9",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box" as const,
  },
  removeBtn: {
    background: "none",
    border: "none",
    color: "#f87171",
    cursor: "pointer",
    padding: 4,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
  addBtn: {
    marginTop: 10,
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px dashed #1C2541",
    background: "transparent",
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
    width: "100%",
  },
  error: {
    fontSize: 12,
    color: "#f87171",
    fontWeight: 500,
    marginTop: 6,
  },
};
