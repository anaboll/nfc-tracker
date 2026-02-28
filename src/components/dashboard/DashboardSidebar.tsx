"use client";

/* ------------------------------------------------------------------ */
/*  DashboardSidebar — left sidebar with Clients, Campaigns, Actions  */
/*  Extracted from src/app/dashboard/page.tsx                         */
/* ------------------------------------------------------------------ */

import React, { useState } from "react";
import { useDashboardFilters } from "@/contexts/DashboardFilterContext";
import type { ClientFull, CampaignFull, TagFull } from "@/types/dashboard";

interface Props {
  isAdmin: boolean;
  clients: ClientFull[];
  filteredCampaigns: CampaignFull[];
  filteredTags: TagFull[];
  onCreateClient: () => Promise<void>;
  onDeleteClient: (id: string) => void;
  onCreateCampaign: () => Promise<void>;
  onDeleteCampaign: (id: string) => void;
  fetchStats: (opts?: { tagIds?: string[] }) => void;
  fetchScans: () => void;
  /* client form state lifted from parent — for create-client handler to work */
  showAddClient: boolean;
  setShowAddClient: (v: boolean) => void;
  newClientName: string;
  setNewClientName: (v: string) => void;
  newClientDesc: string;
  setNewClientDesc: (v: string) => void;
  newClientColor: string;
  setNewClientColor: (v: string) => void;
  clientCreating: boolean;
  /* campaign form state lifted from parent */
  showAddCampaign: boolean;
  setShowAddCampaign: (v: boolean) => void;
  newCampaignName: string;
  setNewCampaignName: (v: string) => void;
  newCampaignDesc: string;
  setNewCampaignDesc: (v: string) => void;
  campaignCreating: boolean;
}

export default function DashboardSidebar({
  isAdmin,
  clients,
  filteredCampaigns,
  filteredTags,
  onCreateClient,
  onDeleteClient,
  onCreateCampaign,
  onDeleteCampaign,
  fetchStats,
  fetchScans,
  showAddClient, setShowAddClient,
  newClientName, setNewClientName,
  newClientDesc, setNewClientDesc,
  newClientColor, setNewClientColor,
  clientCreating,
  showAddCampaign, setShowAddCampaign,
  newCampaignName, setNewCampaignName,
  newCampaignDesc, setNewCampaignDesc,
  campaignCreating,
}: Props) {
  const {
    selectedClientId, setSelectedClientId,
    selectedCampaignId, setSelectedCampaignId,
    selectedTagIds, setSelectedTagIds,
    actionsMode, setActionsMode,
    tagSearch, setTagSearch,
    clientSearch, setClientSearch,
    sidebarOpen, setSidebarOpen,
    showScanTable,
  } = useDashboardFilters();

  return (
    <aside
      className={`nfc-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}
      onScroll={() => {}}
      style={{
        width: 260,
        flexShrink: 0,
        position: "sticky",
        top: 76,
        maxHeight: "calc(100vh - 96px)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      {/* Mobile close button */}
      <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>
        &times;
      </button>

      {/* ── Klienci block ── */}
      <div style={{ padding: "0 0 12px", borderBottom: "1px solid rgba(148,163,184,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Klient</span>
          {isAdmin && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {selectedClientId && (
                <button
                  onClick={() => onDeleteClient(selectedClientId)}
                  title="Usuń klienta"
                  style={{ background: "transparent", border: "none", color: "var(--border-hover)", cursor: "pointer", fontSize: 13, padding: "0 2px", lineHeight: 1, transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--error)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--border-hover)")}
                >🗑</button>
              )}
              <button
                onClick={() => setShowAddClient(!showAddClient)}
                title="Dodaj klienta"
                style={{ background: "transparent", border: "1px dashed var(--border-hover)", color: "var(--txt-muted)", borderRadius: 6, width: 22, height: 22, fontSize: 16, lineHeight: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.2s, color 0.2s", flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent-light)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--txt-muted)"; }}
              >+</button>
            </div>
          )}
        </div>

        {/* search bar */}
        <div style={{ display: "flex", alignItems: "center", background: "transparent", border: "none", borderBottom: "1px solid var(--border)", borderRadius: 0, padding: "6px 0", marginBottom: 6 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--border-hover)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginRight: 6 }}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={clientSearch}
            onChange={e => setClientSearch(e.target.value)}
            placeholder="Szukaj klienta…"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 12, color: "var(--txt)", caretColor: "var(--accent-light)" }}
          />
          {clientSearch && (
            <button onClick={() => setClientSearch("")} style={{ background: "none", border: "none", color: "var(--txt-muted)", cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
          )}
        </div>

        <div style={{ marginLeft: -4, marginRight: -4 }}>
          {/* "Wszyscy klienci" row */}
          <button
            onClick={() => { setSelectedClientId(null); setSelectedCampaignId(null); setSelectedTagIds([]); setActionsMode("NA"); fetchStats({ tagIds: [] }); }}
            style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "7px 8px", borderRadius: 7, border: "none", cursor: "pointer", textAlign: "left",
              background: !selectedClientId ? "rgba(0,200,160,0.1)" : "transparent",
              color: !selectedClientId ? "var(--accent-light)" : "var(--txt-sec)",
              fontSize: 12, fontWeight: !selectedClientId ? 600 : 400,
              transition: "background 0.12s",
            }}
            onMouseEnter={e => { if (selectedClientId) e.currentTarget.style.background = "var(--surface-2)"; }}
            onMouseLeave={e => { if (selectedClientId) e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{
              width: 14, height: 14, borderRadius: 3, border: `1px solid ${!selectedClientId ? "var(--accent-light)" : "var(--border-hover)"}`,
              background: !selectedClientId ? "var(--accent-muted)" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {!selectedClientId && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
            </span>
            Wszyscy klienci
          </button>

          {/* per-client rows */}
          {clients
            .filter(c => !clientSearch || c.name.toLowerCase().includes(clientSearch.toLowerCase()))
            .map(c => {
              const sel = selectedClientId === c.id;
              const dotColor = c.color || "#38BDF8";
              return (
                <button
                  key={c.id}
                  onClick={() => { setSelectedClientId(c.id); setSelectedCampaignId(null); setSelectedTagIds([]); setActionsMode("NA"); fetchStats({ tagIds: [] }); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%",
                    padding: "7px 8px", borderRadius: 7, border: "none", cursor: "pointer", textAlign: "left",
                    background: sel ? `${dotColor}18` : "transparent",
                    color: sel ? dotColor : "var(--txt)",
                    fontSize: 12, fontWeight: sel ? 600 : 400,
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => { if (!sel) e.currentTarget.style.background = "var(--surface-2)"; }}
                  onMouseLeave={e => { if (!sel) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                  {c.scanCount > 0 && <span style={{ fontSize: 10, color: "var(--border-hover)", flexShrink: 0 }}>{c.scanCount}</span>}
                </button>
              );
            })}
          {clients.filter(c => !clientSearch || c.name.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 && (
            <div style={{ padding: "8px 4px", fontSize: 11, color: "var(--border-hover)" }}>Brak wyników</div>
          )}
        </div>

        {/* Add client inline form */}
        {showAddClient && (
          <div style={{ marginTop: 8, padding: "10px", background: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
            <input className="input-field" value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Nazwa klienta" style={{ fontSize: 12, padding: "6px 10px" }} />
            <input className="input-field" value={newClientDesc} onChange={e => setNewClientDesc(e.target.value)} placeholder="Opis (opcjonalnie)" style={{ fontSize: 12, padding: "6px 10px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="color" value={newClientColor} onChange={e => setNewClientColor(e.target.value)} style={{ width: 32, height: 28, border: "1px solid var(--border)", borderRadius: 4, background: "var(--surface-2)", cursor: "pointer", flexShrink: 0 }} />
              <button className="btn-primary" onClick={onCreateClient} disabled={clientCreating} style={{ flex: 1, padding: "6px 0", fontSize: 12 }}>{clientCreating ? "..." : "Dodaj"}</button>
              <button onClick={() => setShowAddClient(false)} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--txt-sec)", borderRadius: 6, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}>✕</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Kampanie block ── */}
      <div style={{ padding: "0 0 12px", borderBottom: "1px solid rgba(148,163,184,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Kampania</span>
          {isAdmin && selectedClientId && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {selectedCampaignId && (
                <button
                  onClick={() => onDeleteCampaign(selectedCampaignId)}
                  title="Usuń kampanię"
                  style={{ background: "transparent", border: "none", color: "var(--border-hover)", cursor: "pointer", fontSize: 13, padding: "0 2px", lineHeight: 1, transition: "color 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--error)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--border-hover)")}
                >🗑</button>
              )}
              <button
                onClick={() => setShowAddCampaign(!showAddCampaign)}
                title="Dodaj kampanię"
                style={{ background: "transparent", border: "1px dashed var(--border-hover)", color: "var(--txt-muted)", borderRadius: 6, width: 22, height: 22, fontSize: 16, lineHeight: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.2s, color 0.2s", flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--txt-muted)"; }}
              >+</button>
            </div>
          )}
        </div>

        {!selectedClientId ? (
          /* placeholder when no client chosen */
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 4px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--border-hover)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ fontSize: 11, color: "var(--border-hover)", lineHeight: 1.4 }}>Wybierz klienta, aby zobaczyć kampanie</span>
          </div>
        ) : (
          /* always-visible campaign list */
          <div style={{ marginLeft: -4, marginRight: -4 }}>
            {/* "Wszystkie kampanie" row */}
            <button
              onClick={() => { setSelectedCampaignId(null); setSelectedTagIds([]); setActionsMode("NA"); fetchStats({ tagIds: [] }); }}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "6px 8px", borderRadius: 7, fontSize: 12,
                fontWeight: !selectedCampaignId ? 600 : 400,
                background: !selectedCampaignId ? "rgba(96,165,250,0.12)" : "transparent",
                color: !selectedCampaignId ? "var(--accent)" : "var(--txt-sec)",
                border: "none", cursor: "pointer", textAlign: "left",
                transition: "background 0.12s",
              }}
              onMouseEnter={e => { if (selectedCampaignId) e.currentTarget.style.background = "var(--surface-2)"; }}
              onMouseLeave={e => { if (selectedCampaignId) e.currentTarget.style.background = "transparent"; }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ flexShrink: 0, opacity: 0.6 }}>
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
              <span style={{ flex: 1 }}>Wszystkie kampanie</span>
              {!selectedCampaignId && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>

            {/* per-campaign rows */}
            {filteredCampaigns.length === 0 ? (
              <div style={{ padding: "10px 8px", fontSize: 11, color: "var(--border-hover)", lineHeight: 1.5 }}>
                Brak kampanii dla tego klienta
              </div>
            ) : (
              filteredCampaigns.map(c => {
                const sel = selectedCampaignId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCampaignId(c.id);
                      setSelectedTagIds([]);
                      setActionsMode("ALL");
                      fetchStats({ tagIds: [] });
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, width: "100%",
                      padding: "6px 8px", borderRadius: 7, fontSize: 12,
                      fontWeight: sel ? 600 : 400,
                      background: sel ? "rgba(96,165,250,0.12)" : "transparent",
                      color: sel ? "var(--accent)" : "var(--txt)",
                      border: "none", cursor: "pointer", textAlign: "left",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={e => { if (!sel) e.currentTarget.style.background = "var(--surface-2)"; }}
                    onMouseLeave={e => { if (!sel) e.currentTarget.style.background = "transparent"; }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ flexShrink: 0, opacity: sel ? 1 : 0.5 }}>
                      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                    </svg>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                    {c.scanCount > 0 && (
                      <span style={{ fontSize: 10, color: sel ? "var(--accent)" : "var(--border-hover)", flexShrink: 0, opacity: 0.8 }}>{c.scanCount}</span>
                    )}
                    {sel && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Add campaign inline form */}
        {selectedClientId && showAddCampaign && (
          <div style={{ marginTop: 8, padding: "10px", background: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
            <input className="input-field" value={newCampaignName} onChange={e => setNewCampaignName(e.target.value)} placeholder="Nazwa kampanii" style={{ fontSize: 12, padding: "6px 10px" }} />
            <input className="input-field" value={newCampaignDesc} onChange={e => setNewCampaignDesc(e.target.value)} placeholder="Opis (opcjonalnie)" style={{ fontSize: 12, padding: "6px 10px" }} />
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn-primary" onClick={onCreateCampaign} disabled={campaignCreating} style={{ flex: 1, padding: "6px 0", fontSize: 12 }}>{campaignCreating ? "..." : "Dodaj"}</button>
              <button onClick={() => setShowAddCampaign(false)} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--txt-sec)", borderRadius: 6, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}>✕</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Akcje block ── */}
      <div style={{ padding: "0 0 12px", borderBottom: "1px solid rgba(148,163,184,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Akcje</span>
            {actionsMode === "SELECTED" && (
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent-light)", background: "rgba(0,200,160,0.12)", border: "1px solid rgba(0,200,160,0.3)", borderRadius: 10, padding: "1px 6px" }}>
                {selectedTagIds.length}
              </span>
            )}
          </div>
          {actionsMode === "SELECTED" && (
            <button
              onClick={() => { setSelectedTagIds([]); setActionsMode("ALL"); fetchStats({ tagIds: [] }); if (showScanTable) fetchScans(); }}
              style={{ background: "transparent", border: "none", color: "var(--txt-muted)", fontSize: 10, cursor: "pointer", padding: "1px 4px", transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--error)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--txt-muted)")}
              title="Wyczyść filtr akcji"
            >Wyczyść</button>
          )}
        </div>

        {!selectedCampaignId ? (
          /* no campaign: placeholder */
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 4px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--border-hover)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ fontSize: 11, color: "var(--border-hover)", lineHeight: 1.4 }}>Wybierz kampanię, aby zobaczyć akcje</span>
          </div>
        ) : (
          /* campaign selected: always-visible list */
          <>
            {/* search bar */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "transparent", border: "none",
              borderBottom: "1px solid var(--border)", borderRadius: 0, padding: "6px 0", marginBottom: 6,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--txt-muted)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                value={tagSearch}
                onChange={e => setTagSearch(e.target.value)}
                placeholder="Szukaj akcji…"
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 12, color: "var(--txt)", caretColor: "var(--accent-light)" }}
              />
              {tagSearch && (
                <button
                  onClick={() => setTagSearch("")}
                  style={{ background: "none", border: "none", color: "var(--txt-muted)", cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1, flexShrink: 0 }}
                >×</button>
              )}
            </div>

            {/* list */}
            {filteredTags.length === 0 ? (
              <div style={{ padding: "10px 4px", fontSize: 11, color: "var(--border-hover)", lineHeight: 1.5 }}>
                Brak akcji w tej kampanii
              </div>
            ) : (
              <div style={{ marginLeft: -4, marginRight: -4 }}>
                {/* "Wszystkie akcje" row */}
                <button
                  onClick={() => { setSelectedTagIds([]); setActionsMode("ALL"); fetchStats({ tagIds: [] }); if (showScanTable) fetchScans(); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%",
                    padding: "5px 8px", borderRadius: 7, fontSize: 12,
                    fontWeight: actionsMode === "ALL" ? 600 : 400,
                    background: actionsMode === "ALL" ? "rgba(96,165,250,0.1)" : "transparent",
                    color: actionsMode === "ALL" ? "var(--accent)" : "var(--txt-sec)",
                    border: "none", cursor: "pointer", textAlign: "left",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => { if (actionsMode !== "ALL") e.currentTarget.style.background = "var(--surface-2)"; }}
                  onMouseLeave={e => { if (actionsMode !== "ALL") e.currentTarget.style.background = "transparent"; }}
                >
                  {/* checkbox-like indicator */}
                  <span style={{
                    width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                    border: `1.5px solid ${actionsMode === "ALL" ? "var(--accent)" : "var(--border-hover)"}`,
                    background: actionsMode === "ALL" ? "rgba(96,165,250,0.2)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {actionsMode === "ALL" && <span style={{ fontSize: 9, color: "var(--accent)", lineHeight: 1 }}>✓</span>}
                  </span>
                  <span style={{ flex: 1 }}>Wszystkie akcje</span>
                </button>

                {/* per-tag rows — filtered by search */}
                {filteredTags
                  .filter(t => !tagSearch || t.name.toLowerCase().includes(tagSearch.toLowerCase()))
                  .map(t => {
                    const sel = selectedTagIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          const next = sel
                            ? selectedTagIds.filter(id => id !== t.id)
                            : [...selectedTagIds, t.id];
                          setSelectedTagIds(next);
                          setActionsMode(next.length > 0 ? "SELECTED" : "ALL");
                          fetchStats({ tagIds: next });
                          if (showScanTable) fetchScans();
                        }}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, width: "100%",
                          padding: "5px 8px", borderRadius: 7, fontSize: 12,
                          fontWeight: sel ? 600 : 400,
                          background: sel ? "rgba(0,200,160,0.08)" : "transparent",
                          color: sel ? "var(--accent-light)" : "var(--txt)",
                          border: "none", cursor: "pointer", textAlign: "left",
                          transition: "background 0.12s",
                        }}
                        onMouseEnter={e => { if (!sel) e.currentTarget.style.background = "var(--surface-2)"; }}
                        onMouseLeave={e => { if (!sel) e.currentTarget.style.background = sel ? "rgba(0,200,160,0.08)" : "transparent"; }}
                      >
                        <span style={{
                          width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                          border: `1.5px solid ${sel ? "var(--accent-light)" : "var(--border-hover)"}`,
                          background: sel ? "rgba(0,200,160,0.2)" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {sel && <span style={{ fontSize: 9, color: "var(--accent-light)", lineHeight: 1 }}>✓</span>}
                        </span>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                        {t._count.scans > 0 && (
                          <span style={{ fontSize: 10, color: sel ? "var(--accent-light)" : "var(--border-hover)", flexShrink: 0, opacity: 0.8 }}>{t._count.scans}</span>
                        )}
                      </button>
                    );
                  })}

                {/* no search results */}
                {tagSearch && filteredTags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase())).length === 0 && (
                  <div style={{ padding: "10px 8px", fontSize: 11, color: "var(--border-hover)" }}>Brak wyników</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
