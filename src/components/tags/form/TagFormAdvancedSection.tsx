"use client";

import React, { useState } from "react";

interface Props {
  mode: "create" | "edit";
  tagId: string;
  tagType: string;
  readOnly: boolean;
  /* Actions */
  onResetStats: (id: string) => Promise<void>;
  onDeleteTag: (id: string) => Promise<boolean>;
  resetting: boolean;
  /* Edit token (vCard) */
  editTokenUrl: string | null;
  editTokenLoading: boolean;
  onGenerateEditToken: () => Promise<void>;
  onRevokeEditToken: () => Promise<void>;
}

export default function TagFormAdvancedSection({
  mode, tagId, tagType, readOnly,
  onResetStats, onDeleteTag, resetting,
  editTokenUrl, editTokenLoading, onGenerateEditToken, onRevokeEditToken,
}: Props) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);

  if (mode !== "edit" || readOnly) return null;

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/s/${tagId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {}
  };

  const copyToken = async () => {
    if (!editTokenUrl) return;
    try {
      await navigator.clipboard.writeText(editTokenUrl);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    } catch {}
  };

  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>Zaawansowane</h3>

      {/* Public Link */}
      <div style={styles.block}>
        <div style={styles.blockLabel}>Link publiczny</div>
        <div style={styles.linkRow}>
          <input
            style={styles.linkInput}
            value={publicUrl}
            readOnly
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button onClick={copyLink} style={styles.copyBtn}>
            {linkCopied ? "✓" : "Kopiuj"}
          </button>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" style={styles.openBtn}>
            ↗
          </a>
        </div>
      </div>

      {/* Edit token for vCard */}
      {tagType === "vcard" && (
        <div style={styles.block}>
          <div style={styles.blockLabel}>Link edycji wizytowki</div>
          <div style={styles.blockHint}>
            Wygeneruj link dla wlasciciela wizytowki do self-service edycji danych.
          </div>

          {editTokenUrl ? (
            <>
              <div style={styles.linkRow}>
                <input
                  style={styles.linkInput}
                  value={editTokenUrl}
                  readOnly
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button onClick={copyToken} style={styles.copyBtn}>
                  {tokenCopied ? "✓" : "Kopiuj"}
                </button>
              </div>
              <button
                onClick={onRevokeEditToken}
                disabled={editTokenLoading}
                style={styles.revokeBtn}
              >
                Uniewazij link
              </button>
            </>
          ) : (
            <button
              onClick={onGenerateEditToken}
              disabled={editTokenLoading}
              style={styles.generateBtn}
            >
              {editTokenLoading ? "Generowanie..." : "Wygeneruj link edycji"}
            </button>
          )}
        </div>
      )}

      {/* Danger zone */}
      <details style={styles.dangerDetails}>
        <summary style={styles.dangerSummary}>Strefa niebezpieczenstwa</summary>

        <div style={{ padding: "12px 0", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Reset stats */}
          <div style={styles.dangerItem}>
            <div>
              <div style={styles.dangerLabel}>Reset statystyk</div>
              <div style={styles.dangerHint}>Usunie wszystkie skany tego tagu</div>
            </div>
            {!resetConfirm ? (
              <button onClick={() => setResetConfirm(true)} style={styles.dangerBtn}>
                Resetuj
              </button>
            ) : (
              <button
                onClick={async () => {
                  await onResetStats(tagId);
                  setResetConfirm(false);
                }}
                disabled={resetting}
                style={{ ...styles.dangerBtn, background: "#f87171", color: "#fff" }}
              >
                {resetting ? "Resetowanie..." : "Potwierdz reset"}
              </button>
            )}
          </div>

          {/* Delete tag */}
          <div style={styles.dangerItem}>
            <div>
              <div style={styles.dangerLabel}>Usun akcje</div>
              <div style={styles.dangerHint}>Nieodwracalne — usunie tag i dane</div>
            </div>
            <button
              onClick={() => {
                if (confirm(`Czy na pewno chcesz usunac akcje "${tagId}"?`)) {
                  onDeleteTag(tagId);
                }
              }}
              style={{ ...styles.dangerBtn, borderColor: "#ef4444", color: "#ef4444" }}
            >
              Usun
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}

/* ------------------------------------------------------------------ */
const styles: Record<string, React.CSSProperties> = {
  section: {
    marginBottom: 28,
    padding: 20,
    borderRadius: 12,
    background: "#0c1220",
    border: "1px solid #1e2d45",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "#8b95a8",
    marginBottom: 16,
  },
  block: {
    marginBottom: 16,
  },
  blockLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#e8ecf1",
    marginBottom: 4,
  },
  blockHint: {
    fontSize: 11,
    color: "#5a6478",
    marginBottom: 8,
  },
  linkRow: {
    display: "flex",
    gap: 6,
    alignItems: "center",
  },
  linkInput: {
    flex: 1,
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #1e2d45",
    background: "#131b2e",
    color: "#f5b731",
    fontSize: 12,
    fontFamily: "monospace",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  copyBtn: {
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid #1e2d45",
    background: "#131b2e",
    color: "#8b95a8",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    transition: "all 0.15s",
  },
  openBtn: {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #1e2d45",
    background: "#131b2e",
    color: "#8b95a8",
    fontSize: 14,
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
  },
  generateBtn: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid #10b981",
    background: "rgba(16,185,129,0.1)",
    color: "#10b981",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  revokeBtn: {
    marginTop: 6,
    padding: "6px 12px",
    borderRadius: 6,
    border: "1px solid #f87171",
    background: "transparent",
    color: "#f87171",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  dangerDetails: {
    marginTop: 8,
    borderTop: "1px solid #1e2d45",
    paddingTop: 8,
  },
  dangerSummary: {
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    color: "#f87171",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    padding: "6px 0",
    listStyle: "none",
  },
  dangerItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    borderRadius: 8,
    background: "rgba(248,113,113,0.05)",
    border: "1px solid rgba(248,113,113,0.15)",
  },
  dangerLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#e8ecf1",
  },
  dangerHint: {
    fontSize: 11,
    color: "#5a6478",
  },
  dangerBtn: {
    padding: "6px 14px",
    borderRadius: 6,
    border: "1px solid #f87171",
    background: "transparent",
    color: "#f87171",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
    whiteSpace: "nowrap" as const,
  },
};
