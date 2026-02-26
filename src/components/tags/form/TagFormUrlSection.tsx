"use client";

import React from "react";

interface Props {
  tagType: string;
  targetUrl: string;
  setTargetUrl: (v: string) => void;
  readOnly: boolean;
  errors: Record<string, string>;
  clearFieldError: (f: string) => void;
}

export default function TagFormUrlSection({
  tagType, targetUrl, setTargetUrl, readOnly, errors, clearFieldError,
}: Props) {
  if (tagType !== "url" && tagType !== "google-review") return null;

  const isGoogle = tagType === "google-review";

  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>
        {isGoogle ? "Link do recenzji Google" : "Docelowy URL"}
      </h3>

      <div style={styles.field}>
        <label style={styles.label}>
          URL <span style={{ color: "#f87171" }}>*</span>
        </label>
        <input
          style={{ ...styles.input, borderColor: errors.targetUrl ? "#f87171" : "#2a2e38" }}
          type="url"
          value={targetUrl}
          onChange={(e) => { setTargetUrl(e.target.value); clearFieldError("targetUrl"); }}
          placeholder={isGoogle ? "https://g.page/r/..." : "https://example.com"}
          disabled={readOnly}
        />
        {isGoogle && (
          <div style={styles.hint}>
            Wklej link z Google Business Profile → &quot;Popros o recenzje&quot;
          </div>
        )}
        {errors.targetUrl && <div style={styles.error}>{errors.targetUrl}</div>}
      </div>
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
    marginBottom: 12,
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#eaf0f6",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #2a2e38",
    background: "#1a1d26",
    color: "#eaf0f6",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box" as const,
  },
  hint: {
    fontSize: 11,
    color: "#555c6e",
    marginTop: 2,
  },
  error: {
    fontSize: 12,
    color: "#f87171",
    fontWeight: 500,
  },
};
