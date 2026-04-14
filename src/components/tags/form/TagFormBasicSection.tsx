"use client";

import React from "react";
import type { ClientInfo, CampaignInfo } from "@/types/tag";
import { generateTagCode } from "@/lib/generate-tag-code";

interface Props {
  mode: "create" | "edit";
  readOnly: boolean;
  tagId: string;
  setTagId: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  channel: "nfc" | "qr" | "both";
  setChannel: (v: "nfc" | "qr" | "both") => void;
  clientId: string;
  setClientId: (v: string) => void;
  campaignId: string;
  setCampaignId: (v: string) => void;
  clients: ClientInfo[];
  campaignsForClient: CampaignInfo[];
  errors: Record<string, string>;
  clearFieldError: (f: string) => void;
}

export default function TagFormBasicSection({
  mode, readOnly, tagId, setTagId, name, setName,
  description, setDescription, channel, setChannel,
  clientId, setClientId, campaignId, setCampaignId,
  clients, campaignsForClient, errors, clearFieldError,
}: Props) {
  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>Podstawowe informacje</h3>

      <div style={styles.grid}>
        {/* Tag ID */}
        <div style={styles.field}>
          <label style={styles.label}>
            ID akcji {mode === "create" && <span style={{ color: "var(--error)" }}>*</span>}
          </label>
          {mode === "create" ? (
            <>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  style={{ ...styles.input, borderColor: errors.tagId ? "var(--error)" : "var(--surface-2)", flex: 1 }}
                  value={tagId}
                  onChange={(e) => {
                    setTagId(e.target.value.toLowerCase().replace(/[^a-z0-9\-_.+]/g, "-"));
                    clearFieldError("tagId");
                  }}
                  placeholder="np. a3x7k"
                  disabled={readOnly}
                />
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      setTagId(generateTagCode());
                      clearFieldError("tagId");
                    }}
                    title="Wygeneruj nowy losowy kod"
                    style={styles.regenBtn}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--surface-2)")}
                  >
                    🔄
                  </button>
                )}
              </div>
              {tagId && (
                <div style={styles.hint}>
                  Link: <span style={{ color: "var(--accent-light)" }}>/s/{tagId}</span>
                  <span style={{ opacity: 0.6, marginLeft: 8 }}>
                    (neutralny kod — mozesz zmienic typ akcji bez zmiany linka)
                  </span>
                </div>
              )}
              {errors.tagId && <div style={styles.error}>{errors.tagId}</div>}
            </>
          ) : (
            <div style={styles.lockedValue}>{tagId}</div>
          )}
        </div>

        {/* Name */}
        <div style={styles.field}>
          <label style={styles.label}>
            Nazwa <span style={{ color: "var(--error)" }}>*</span>
          </label>
          <input
            style={{ ...styles.input, borderColor: errors.name ? "var(--error)" : "var(--surface-2)" }}
            value={name}
            onChange={(e) => { setName(e.target.value); clearFieldError("name"); }}
            placeholder="Nazwa akcji"
            disabled={readOnly}
          />
          {errors.name && <div style={styles.error}>{errors.name}</div>}
        </div>

        {/* Client */}
        <div style={styles.field}>
          <label style={styles.label}>
            Klient <span style={{ color: "var(--error)" }}>*</span>
          </label>
          <select
            style={{ ...styles.input, borderColor: errors.clientId ? "var(--error)" : "var(--surface-2)" }}
            value={clientId}
            onChange={(e) => { setClientId(e.target.value); clearFieldError("clientId"); }}
            disabled={readOnly}
          >
            <option value="">— Wybierz klienta —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.clientId && <div style={styles.error}>{errors.clientId}</div>}
        </div>

        {/* Campaign */}
        <div style={styles.field}>
          <label style={styles.label}>
            Kampania <span style={{ color: "var(--error)" }}>*</span>
          </label>
          <select
            style={{
              ...styles.input,
              borderColor: errors.campaignId ? "var(--error)" : "var(--surface-2)",
              opacity: !clientId ? 0.4 : 1,
            }}
            value={campaignId}
            onChange={(e) => { setCampaignId(e.target.value); clearFieldError("campaignId"); }}
            disabled={readOnly || !clientId}
          >
            <option value="">
              {!clientId
                ? "— Najpierw wybierz klienta —"
                : campaignsForClient.length === 0
                  ? "— Brak kampanii —"
                  : `— Wybierz kampanie (${campaignsForClient.length}) —`}
            </option>
            {campaignsForClient.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.campaignId && <div style={styles.error}>{errors.campaignId}</div>}
        </div>

        {/* Channel */}
        <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
          <label style={styles.label}>Jak bedzie uzywany ten tag?</label>
          <div style={styles.channelWrap}>
            {([
              { value: "both" as const, label: "NFC + QR", color: "#10b981", cssVar: "var(--success)", desc: "Chip NFC i kod QR" },
              { value: "nfc" as const, label: "Tylko NFC", color: "#60a5fa", cssVar: "var(--accent)", desc: "Brelok / naklejka NFC" },
              { value: "qr" as const, label: "Tylko QR", color: "#7dd3fc", cssVar: "var(--accent-light)", desc: "Kod QR do druku" },
            ]).map((ch) => (
              <button
                key={ch.value}
                onClick={() => !readOnly && setChannel(ch.value)}
                disabled={readOnly}
                style={{
                  ...styles.channelBtn,
                  background: channel === ch.value ? `${ch.color}18` : "transparent",
                  borderColor: channel === ch.value ? ch.cssVar : "var(--surface-2)",
                  color: channel === ch.value ? ch.cssVar : "var(--txt-muted)",
                }}
              >
                <span style={{ fontWeight: 700 }}>{ch.label}</span>
                <span style={{ fontSize: 10, opacity: 0.7 }}>{ch.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
          <label style={styles.label}>Opis (opcjonalny)</label>
          <textarea
            style={{ ...styles.input, minHeight: 60, resize: "vertical" as const }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Krotki opis akcji..."
            disabled={readOnly}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
const styles: Record<string, React.CSSProperties> = {
  section: {
    marginBottom: 28,
    padding: 20,
    borderRadius: 8,
    background: "var(--surface)",
    border: "1px solid var(--surface-2)",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "var(--txt-sec)",
    marginBottom: 16,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--txt)",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--surface-2)",
    background: "var(--surface-2)",
    color: "var(--txt)",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box" as const,
  },
  lockedValue: {
    padding: "10px 12px",
    borderRadius: 8,
    background: "var(--surface-2)",
    border: "1px solid var(--surface-2)",
    color: "var(--accent-light)",
    fontSize: 14,
    fontFamily: "var(--font-mono)",
    opacity: 0.8,
  },
  hint: {
    fontSize: 11,
    color: "var(--txt-muted)",
  },
  regenBtn: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--surface-2)",
    background: "var(--surface-2)",
    color: "var(--txt)",
    fontSize: 16,
    cursor: "pointer",
    transition: "border-color 0.2s",
    lineHeight: 1,
  },
  error: {
    fontSize: 12,
    color: "var(--error)",
    fontWeight: 500,
  },
  channelWrap: {
    display: "flex",
    gap: 8,
  },
  channelBtn: {
    flex: 1,
    padding: "8px 0",
    borderRadius: 8,
    border: "1.5px solid var(--surface-2)",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.15s",
  },
};
