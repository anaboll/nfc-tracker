"use client";

import React from "react";
import type { ClientInfo, CampaignInfo } from "@/types/tag";

interface Props {
  mode: "create" | "edit";
  readOnly: boolean;
  tagId: string;
  setTagId: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  channel: "nfc" | "qr";
  setChannel: (v: "nfc" | "qr") => void;
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
            ID akcji {mode === "create" && <span style={{ color: "#f87171" }}>*</span>}
          </label>
          {mode === "create" ? (
            <>
              <input
                style={{ ...styles.input, borderColor: errors.tagId ? "#f87171" : "#1e2d45" }}
                value={tagId}
                onChange={(e) => {
                  setTagId(e.target.value.toLowerCase().replace(/[^a-z0-9\-_.+]/g, "-"));
                  clearFieldError("tagId");
                }}
                placeholder="np. jan-kowalski"
                disabled={readOnly}
              />
              {tagId && (
                <div style={styles.hint}>
                  Link: <span style={{ color: "#f5b731" }}>/s/{tagId}</span>
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
            Nazwa <span style={{ color: "#f87171" }}>*</span>
          </label>
          <input
            style={{ ...styles.input, borderColor: errors.name ? "#f87171" : "#1e2d45" }}
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
            Klient <span style={{ color: "#f87171" }}>*</span>
          </label>
          <select
            style={{ ...styles.input, borderColor: errors.clientId ? "#f87171" : "#1e2d45" }}
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
            Kampania <span style={{ color: "#f87171" }}>*</span>
          </label>
          <select
            style={{
              ...styles.input,
              borderColor: errors.campaignId ? "#f87171" : "#1e2d45",
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
        <div style={styles.field}>
          <label style={styles.label}>Kanal (atrybucja)</label>
          <div style={styles.channelWrap}>
            {(["nfc", "qr"] as const).map((ch) => (
              <button
                key={ch}
                onClick={() => !readOnly && setChannel(ch)}
                disabled={readOnly}
                style={{
                  ...styles.channelBtn,
                  background: channel === ch ? (ch === "nfc" ? "rgba(96,165,250,0.15)" : "rgba(245,183,49,0.15)") : "transparent",
                  borderColor: channel === ch ? (ch === "nfc" ? "#60a5fa" : "#f5b731") : "#1e2d45",
                  color: channel === ch ? (ch === "nfc" ? "#60a5fa" : "#f5b731") : "#5a6478",
                }}
              >
                {ch.toUpperCase()}
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
    color: "#e8ecf1",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #1e2d45",
    background: "#131b2e",
    color: "#e8ecf1",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box" as const,
  },
  lockedValue: {
    padding: "10px 12px",
    borderRadius: 8,
    background: "#131b2e",
    border: "1px solid #1e2d45",
    color: "#f5b731",
    fontSize: 14,
    fontFamily: "monospace",
    opacity: 0.8,
  },
  hint: {
    fontSize: 11,
    color: "#5a6478",
  },
  error: {
    fontSize: 12,
    color: "#f87171",
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
    border: "1.5px solid #1e2d45",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.15s",
  },
};
