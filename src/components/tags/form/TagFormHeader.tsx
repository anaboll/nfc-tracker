"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface Props {
  mode: "create" | "edit";
  tagName?: string;
  onSave: () => void;
  saving: boolean;
  readOnly: boolean;
  isDirty: boolean;
  clientId?: string;
  campaignId?: string;
}

export default function TagFormHeader({
  mode, tagName, onSave, saving, readOnly, isDirty, clientId, campaignId,
}: Props) {
  const router = useRouter();

  const goBack = () => {
    const params = new URLSearchParams();
    if (clientId) params.set("clientId", clientId);
    if (campaignId) params.set("campaignId", campaignId);
    const qs = params.toString();
    router.push(`/dashboard${qs ? `?${qs}` : ""}`);
  };

  return (
    <div style={styles.header}>
      {/* Breadcrumbs */}
      <div style={styles.left}>
        <button onClick={goBack} style={styles.backBtn} title="Powrot do dashboardu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div style={styles.breadcrumbs}>
          <span style={styles.breadcrumbMuted} onClick={goBack} role="button" tabIndex={0}>
            Dashboard
          </span>
          <span style={styles.breadcrumbSep}>/</span>
          <span style={styles.breadcrumbCurrent}>
            {mode === "create" ? "Nowa akcja" : tagName || "Edycja"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <button onClick={goBack} style={styles.cancelBtn}>
          {readOnly ? "Zamknij" : "Anuluj"}
        </button>
        {!readOnly && (
          <button
            onClick={onSave}
            disabled={saving || (!isDirty && mode === "edit")}
            style={{
              ...styles.saveBtn,
              opacity: saving || (!isDirty && mode === "edit") ? 0.5 : 1,
              cursor: saving ? "wait" : "pointer",
            }}
          >
            {saving ? "Zapisywanie..." : mode === "create" ? "Utworz akcje" : "Zapisz zmiany"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
const styles: Record<string, React.CSSProperties> = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 24px",
    background: "rgba(13,21,38,0.85)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid #1e2d45",
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#8b95a8",
    cursor: "pointer",
    padding: 4,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    transition: "color 0.15s",
  },
  breadcrumbs: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 14,
    minWidth: 0,
  },
  breadcrumbMuted: {
    color: "#8b95a8",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    transition: "color 0.15s",
  },
  breadcrumbSep: {
    color: "#5a6478",
  },
  breadcrumbCurrent: {
    color: "#e8ecf1",
    fontWeight: 600,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 240,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  cancelBtn: {
    padding: "8px 18px",
    borderRadius: 8,
    border: "1px solid #1e2d45",
    background: "transparent",
    color: "#8b95a8",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  saveBtn: {
    padding: "8px 22px",
    borderRadius: 8,
    border: "none",
    background: "linear-gradient(135deg, #e69500, #f5b731)",
    color: "#1a1a2e",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.15s",
  },
};
