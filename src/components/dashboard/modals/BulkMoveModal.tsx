"use client";

import React from "react";
import type { CampaignInfo } from "@/types/dashboard";

interface Props {
  selectedCount: number;
  campaigns: CampaignInfo[];
  bulkMoveCampaignId: string;
  setBulkMoveCampaignId: (v: string) => void;
  bulkMsg: string;
  bulkLoading: boolean;
  handleBulkMove: () => void;
  onClose: () => void;
}

export default function BulkMoveModal({
  selectedCount,
  campaigns,
  bulkMoveCampaignId,
  setBulkMoveCampaignId,
  bulkMsg,
  bulkLoading,
  handleBulkMove,
  onClose,
}: Props) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1100 }}
      />
      <div style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "24px clamp(16px, 4vw, 32px)",
        zIndex: 1101,
        minWidth: "min(360px, 90vw)",
        maxWidth: "90vw",
        boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--txt)", marginBottom: 6 }}>
          Przenies {selectedCount} akcji
        </h3>
        <p style={{ fontSize: 12, color: "var(--txt-muted)", marginBottom: 20 }}>
          Wybierz kampanie docelowa. Akcje zostana przeniesione bez zmiany klienta.
        </p>
        <label style={{ display: "block", fontSize: 11, color: "var(--txt-sec)", marginBottom: 6 }}>
          Kampania docelowa
        </label>
        <select
          value={bulkMoveCampaignId}
          onChange={(e) => setBulkMoveCampaignId(e.target.value)}
          className="input-field"
          style={{ width: "100%", marginBottom: 20, padding: "8px 12px" }}
        >
          <option value="">(bez kampanii)</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {bulkMsg && (
          <p style={{ fontSize: 12, color: "var(--error)", marginBottom: 12 }}>{bulkMsg}</p>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--txt-sec)", fontSize: 13, cursor: "pointer" }}
          >
            Anuluj
          </button>
          <button
            onClick={handleBulkMove}
            disabled={bulkLoading}
            style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: bulkLoading ? 0.7 : 1 }}
          >
            {bulkLoading ? "Przenoszenie..." : "Przenies"}
          </button>
        </div>
      </div>
    </>
  );
}
