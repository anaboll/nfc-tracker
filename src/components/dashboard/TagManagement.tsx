"use client";

/* ------------------------------------------------------------------ */
/*  TagManagement — tag cards + table view                            */
/*  Extracted from src/app/dashboard/page.tsx                         */
/* ------------------------------------------------------------------ */

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDashboardFilters } from "@/contexts/DashboardFilterContext";
import { ActionEditor } from "@/components/actions/ActionEditor";
import { ActionsTable, CtxMenuPortal } from "@/components/actions/ActionsTable";
import { getTagTypeLabel, getTagTypeColor, formatWatchTime } from "@/lib/dashboardHelpers";
import type { TagFull, TagLink, LinkClickData, VideoStats } from "@/types/dashboard";

interface Props {
  displayTags: TagFull[];
  isAdmin: boolean;
  /* handlers */
  handleToggleActive: (tag: TagFull) => void;
  handleDeleteTag: (id: string) => void;
  handleResetStats: (tagId?: string) => void;
  handleVideoUpload: (tagId: string, file: File) => void;
  handleRemoveVideo: (tagId: string) => void;
  handleCopyLink: (tagId: string) => void;
  fetchLinkClicks: (tagId: string) => void;
  fetchVideoStats: (tagId: string) => void;
  toggleLinkStats: (tagId: string) => void;
  toggleVideoStats: (tagId: string) => void;
  /* state */
  resetAllConfirm: boolean;
  setResetAllConfirm: (v: boolean) => void;
  resetting: boolean;
  uploadingTagId: string | null;
  uploadProgress: string;
  linkClickStats: Record<string, LinkClickData>;
  expandedLinkStats: string | null;
  videoStats: Record<string, VideoStats>;
  expandedVideoStats: string | null;
  copiedCardId: string | null;
  /* bulk */
  selectedIds: string[];
  setSelectedIds: (v: string[]) => void;
  handleBulkDelete: () => void;
  handleBulkClone: () => void;
  onBulkMoveRequest: () => void;
  bulkLoading: boolean;
  bulkMsg: string;
  /* copy toast */
  copyToastTimer: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  setCopyToast: (v: boolean) => void;
}

export default function TagManagement({
  displayTags, isAdmin,
  handleToggleActive, handleDeleteTag, handleResetStats,
  handleVideoUpload, handleRemoveVideo, handleCopyLink,
  fetchLinkClicks, fetchVideoStats, toggleLinkStats, toggleVideoStats,
  resetAllConfirm, setResetAllConfirm, resetting,
  uploadingTagId, uploadProgress,
  linkClickStats, expandedLinkStats, videoStats, expandedVideoStats,
  copiedCardId,
  selectedIds, setSelectedIds, handleBulkDelete, handleBulkClone, onBulkMoveRequest, bulkLoading, bulkMsg,
  copyToastTimer, setCopyToast,
}: Props) {
  const router = useRouter();
  const {
    viewMode, setViewMode,
    selectedClientId, selectedCampaignId,
    tagFilter, setTagFilter,
  } = useDashboardFilters();

  /* local state for context menu */
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const openCardMenu = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (openMenuId === id) {
      setOpenMenuId(null);
      setMenuRect(null);
    } else {
      setMenuRect((e.currentTarget as HTMLButtonElement).getBoundingClientRect());
      setOpenMenuId(id);
    }
  };

  const closeCardMenu = () => {
    setOpenMenuId(null);
    setMenuRect(null);
  };

  return (
    <section style={{ marginBottom: 24 }}>
      {/* ---- Header row ---- */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>
            <span style={{ color: "#F1F5F9" }}>Akcje</span>
          </h2>
          <span style={{ background: "transparent", color: "#94A3B8", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
            {displayTags.length}
          </span>
        </div>

        {/* View mode toggle + Global reset stats */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Cards / Table toggle */}
          <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(148,163,184,0.08)" }}>
            {(["cards", "table"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                title={mode === "cards" ? "Widok kart" : "Widok tabeli"}
                style={{
                  padding: "6px 12px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 5,
                  background: viewMode === mode ? "rgba(148,163,184,0.15)" : "transparent",
                  color: viewMode === mode ? "#F1F5F9" : "#64748B",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {mode === "cards" ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                    Karty
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                    Tabela
                  </>
                )}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 24, background: "rgba(148,163,184,0.15)" }} />
          {resetAllConfirm ? (
            <>
              <span style={{ fontSize: 12, color: "#f87171", fontWeight: 600 }}>Na pewno usunac WSZYSTKIE statystyki?</span>
              <button
                onClick={() => handleResetStats()}
                disabled={resetting}
                style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontWeight: 700 }}
              >
                {resetting ? "Usuwanie..." : "TAK, usun wszystko"}
              </button>
              <button
                onClick={() => setResetAllConfirm(false)}
                style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: "#94A3B8", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}
              >
                Anuluj
              </button>
            </>
          ) : (
            <button
              onClick={() => setResetAllConfirm(true)}
              style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: "#94A3B8", borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "border-color 0.2s, color 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#f87171"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(148,163,184,0.15)"; e.currentTarget.style.color = "#a0a0c0"; }}
            >
              Reset wszystkich statystyk
            </button>
          )}
        </div>
      </div>

      {/* ---- "+ Nowa akcja" button ---- */}
      {isAdmin && (
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => {
              const params = new URLSearchParams();
              if (selectedClientId) params.set("clientId", selectedClientId);
              if (selectedCampaignId) params.set("campaignId", selectedCampaignId);
              const qs = params.toString();
              router.push(`/dashboard/tags/new${qs ? `?${qs}` : ""}`);
            }}
            style={{
              background: "#38BDF8", border: "none", color: "#0B0F1A", borderRadius: 10,
              padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 8,
              boxShadow: "0 2px 12px rgba(0,200,160,0.25)", transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nowa akcja
          </button>
        </div>
      )}

      {/* ---- Empty state ---- */}
      {displayTags.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "40px 24px" }}>
          <p style={{ color: "#64748B", fontSize: 14 }}>
            {selectedClientId ? "Brak akcji dla wybranego filtra." : "Brak akcji. Kliknij \"+ Nowa akcja\" aby dodac pierwsza akcje."}
          </p>
        </div>
      )}

      {/* ---- TABLE view ---- */}
      {viewMode === "table" && displayTags.length > 0 && (
        <div className="card" style={{ padding: "4px 0" }}>
          <ActionsTable
            tags={displayTags}
            openMenuId={openMenuId}
            setOpenMenuId={setOpenMenuId}
            menuRef={menuRef}
            uploadingTagId={uploadingTagId}
            uploadProgress={uploadProgress}
            onToggleActive={handleToggleActive}
            onStartEdit={(tag) => router.push(`/dashboard/tags/${tag.id}/edit`)}
            onDeleteTag={handleDeleteTag}
            onResetStats={handleResetStats}
            onVideoUpload={handleVideoUpload}
            onRemoveVideo={handleRemoveVideo}
            onSetResetTagConfirm={() => {}}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            onBulkDelete={handleBulkDelete}
            onBulkClone={handleBulkClone}
            onBulkMoveRequest={onBulkMoveRequest}
            bulkLoading={bulkLoading}
            bulkMsg={bulkMsg}
            readOnly={!isAdmin}
            onCopySuccess={() => {
              if (copyToastTimer.current) clearTimeout(copyToastTimer.current);
              setCopyToast(true);
              copyToastTimer.current = setTimeout(() => setCopyToast(false), 2000);
            }}
          />
        </div>
      )}

      {/* ---- CARDS view ---- */}
      <div style={{ display: viewMode === "cards" ? "flex" : "none", flexDirection: "column", gap: 12 }}>
        {displayTags.map((tag) => (
          <div key={tag.id} className="card card-hover" style={{ padding: "16px 20px" }}>
            <div>
              {/* Top row: name + badges + actions */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
                {/* Left: name + badges */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                    {tag.name}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: tag.isActive ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: tag.isActive ? "#10b981" : "#f87171" }}>
                    {tag.isActive ? "Aktywny" : "Nieaktywny"}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: getTagTypeColor(tag.tagType).bg, color: getTagTypeColor(tag.tagType).color }}>
                    {getTagTypeLabel(tag.tagType)}
                  </span>
                  {tag.videoFile && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
                      Video wgrane
                    </span>
                  )}
                  {tag.client && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: tag.client.color ? `${tag.client.color}22` : "rgba(160,160,192,0.12)", color: tag.client.color || "#a0a0c0", display: "flex", alignItems: "center", gap: 4 }}>
                      {tag.client.color && (
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: tag.client.color, flexShrink: 0 }} />
                      )}
                      {tag.client.name}
                    </span>
                  )}
                  {tag.campaign && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "rgba(96,165,250,0.12)", color: "#60a5fa", display: "flex", alignItems: "center", gap: 4 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                      </svg>
                      {tag.campaign.name}
                    </span>
                  )}
                </div>

                {/* Right: actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {/* Active toggle — admin only */}
                  {isAdmin && (
                    <button
                      onClick={() => handleToggleActive(tag)}
                      title={tag.isActive ? "Dezaktywuj" : "Aktywuj"}
                      style={{ width: 44, height: 24, borderRadius: 8, background: tag.isActive ? "#10b981" : "#3d4250", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
                    >
                      <span style={{ position: "absolute", top: 3, left: tag.isActive ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                    </button>
                  )}

                  {/* Quick: Kopiuj link publiczny */}
                  <button
                    onClick={e => { e.stopPropagation(); handleCopyLink(tag.id); }}
                    title="Kopiuj link publiczny"
                    style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: copiedCardId === tag.id ? "#22c55e" : "#94A3B8", borderRadius: 6, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "color 0.15s, border-color 0.15s" }}
                    onMouseEnter={e => { if (copiedCardId !== tag.id) { e.currentTarget.style.color = "#7dd3fc"; e.currentTarget.style.borderColor = "#38BDF8"; } }}
                    onMouseLeave={e => { if (copiedCardId !== tag.id) { e.currentTarget.style.color = "#94A3B8"; e.currentTarget.style.borderColor = "rgba(148,163,184,0.15)"; } }}
                  >
                    {copiedCardId === tag.id
                      ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                    }
                  </button>

                  {/* Quick: Edytuj / Podglad */}
                  <button
                    onClick={e => { e.stopPropagation(); router.push(`/dashboard/tags/${tag.id}/edit`); }}
                    title={isAdmin ? "Edytuj akcje" : "Podglad"}
                    style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: "#94A3B8", borderRadius: 6, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "color 0.15s, border-color 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#F1F5F9"; e.currentTarget.style.borderColor = "#38BDF8"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "#94A3B8"; e.currentTarget.style.borderColor = "rgba(148,163,184,0.15)"; }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>

                  {/* ⋯ menu — admin only */}
                  {isAdmin && (
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={(e) => openCardMenu(tag.id, e)}
                        title="Więcej opcji"
                        style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: "#94A3B8", borderRadius: 6, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, lineHeight: 1, letterSpacing: "0.05em", flexShrink: 0, transition: "border-color 0.15s, color 0.15s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#38BDF8"; e.currentTarget.style.color = "#F1F5F9"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(148,163,184,0.15)"; e.currentTarget.style.color = "#94A3B8"; }}
                      >
                        ⋯
                      </button>

                      {openMenuId === tag.id && menuRect && (
                        <CtxMenuPortal anchorRect={menuRect} onClose={closeCardMenu}>
                          {/* Pobierz QR PNG */}
                          <button
                            onClick={async () => {
                              closeCardMenu();
                              const res = await fetch(`/api/qr?tagId=${encodeURIComponent(tag.id)}&format=png`);
                              if (!res.ok) return;
                              const blob = await res.blob();
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url; a.download = `qr-${tag.id}.png`; a.click();
                              URL.revokeObjectURL(url);
                            }}
                            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "transparent", border: "none", color: "#10b981", fontSize: 13, cursor: "pointer", textAlign: "left" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#243052"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                              <path d="M14 14h3v3m0 4h4v-4m-4 0h4" />
                            </svg>
                            Pobierz QR (PNG)
                          </button>

                          {/* Pobierz SVG */}
                          <button
                            onClick={async () => {
                              closeCardMenu();
                              const res = await fetch(`/api/qr?tagId=${encodeURIComponent(tag.id)}&format=svg`);
                              if (!res.ok) return;
                              const blob = await res.blob();
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url; a.download = `qr-${tag.id}.svg`; a.click();
                              URL.revokeObjectURL(url);
                            }}
                            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "transparent", border: "none", color: "#10b981", fontSize: 13, cursor: "pointer", textAlign: "left" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#243052"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                            </svg>
                            Pobierz SVG
                          </button>

                          {/* Pobierz PDF */}
                          <button
                            onClick={() => { closeCardMenu(); window.open(`/api/qr?tagId=${encodeURIComponent(tag.id)}&format=pdf`, "_blank"); }}
                            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "transparent", border: "none", color: "#7dd3fc", fontSize: 13, cursor: "pointer", textAlign: "left" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#243052"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                            </svg>
                            Pobierz PDF (druk A4)
                          </button>

                          {/* Video items */}
                          {tag.tagType === "video" && (
                            <>
                              <div style={{ height: 1, background: "rgba(148,163,184,0.15)", margin: "0 10px" }} />
                              <label
                                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "transparent", color: "#9f67ff", fontSize: 13, cursor: "pointer" }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "#243052"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                </svg>
                                {uploadingTagId === tag.id ? uploadProgress : (tag.videoFile ? "Podmień video" : "Wgraj video")}
                                <input type="file" accept="video/mp4,video/webm,video/quicktime" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) { closeCardMenu(); handleVideoUpload(tag.id, f); } e.target.value = ""; }} />
                              </label>
                              {tag.videoFile && (
                                <button
                                  onClick={() => { closeCardMenu(); handleRemoveVideo(tag.id); }}
                                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "transparent", border: "none", color: "#f87171", fontSize: 13, cursor: "pointer", textAlign: "left" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "#243052"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                                  </svg>
                                  Usuń video
                                </button>
                              )}
                            </>
                          )}

                          <div style={{ height: 1, background: "rgba(148,163,184,0.15)", margin: "0 10px" }} />

                          {/* Reset statystyk */}
                          <button
                            onClick={() => { closeCardMenu(); router.push(`/dashboard/tags/${tag.id}/edit`); }}
                            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "transparent", border: "none", color: "#f59e0b", fontSize: 13, cursor: "pointer", textAlign: "left" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(245,158,11,0.08)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                            </svg>
                            Reset statystyk
                          </button>

                          {/* Usuń akcję */}
                          <button
                            onClick={() => { closeCardMenu(); handleDeleteTag(tag.id); }}
                            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "transparent", border: "none", color: "#f87171", fontSize: 13, cursor: "pointer", textAlign: "left" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                            </svg>
                            Usuń akcję
                          </button>
                        </CtxMenuPortal>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom row: details */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 12, color: "#94A3B8", alignItems: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span style={{ color: "#64748B" }}>ID:</span>{" "}
                  <span style={{ fontFamily: "var(--font-mono)", color: "#7dd3fc" }}>{tag.id}</span>
                </span>
                <span>
                  <span style={{ color: "#64748B" }}>Skany:</span>{" "}
                  <span style={{ fontWeight: 600, color: "#F1F5F9" }}>{tag._count.scans}</span>
                </span>
                {/* Public link chip — click to copy */}
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <button
                    onClick={e => { e.stopPropagation(); handleCopyLink(tag.id); }}
                    title="Kliknij, aby skopiować link publiczny"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(0,200,160,0.1)", border: "1px solid rgba(0,200,160,0.25)", borderRadius: 6, padding: "3px 8px 3px 7px", cursor: "pointer", transition: "background 0.15s, border-color 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,200,160,0.18)"; e.currentTarget.style.borderColor = "rgba(0,200,160,0.45)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,200,160,0.1)"; e.currentTarget.style.borderColor = "rgba(0,200,160,0.25)"; }}
                  >
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#7dd3fc" }}>/s/{tag.id}</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                  </button>
                  <a
                    href={`/s/${tag.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    title="Otwórz link publiczny"
                    style={{ color: "#64748B", display: "inline-flex", alignItems: "center", transition: "color 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#94A3B8")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#64748B")}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </span>
                {tag.videoFile && (
                  <span>
                    <span style={{ color: "#64748B" }}>Video:</span>{" "}
                    <a
                      href={tag.videoFile.replace(/^\/uploads\//, "/api/video/")}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#10b981", fontSize: 11, textDecoration: "underline", cursor: "pointer" }}
                    >
                      {tag.videoFile.split("/").pop()}
                    </a>
                  </span>
                )}
              </div>
              {tag.description && (
                <p style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
                  {tag.description}
                </p>
              )}

              {/* Link click stats for multilink campaigns */}
              {tag.tagType === "multilink" && (
                <div style={{ marginTop: 8 }}>
                  <button
                    onClick={() => toggleLinkStats(tag.id)}
                    style={{ background: "transparent", border: "none", color: "#60a5fa", fontSize: 12, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: expandedLinkStats === tag.id ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}
                    >
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                    Statystyki klikniec ({linkClickStats[tag.id]?.total ?? "..."})
                  </button>
                  {expandedLinkStats === tag.id && linkClickStats[tag.id] && (
                    <div style={{ marginTop: 8, padding: 12, background: "#14171e", borderRadius: 8, border: "1px solid rgba(148,163,184,0.08)" }}>
                      {linkClickStats[tag.id].links.length === 0 ? (
                        <p style={{ fontSize: 12, color: "#64748B" }}>Brak klikniec</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {linkClickStats[tag.id].links.map((lc, idx) => (
                            <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: idx < linkClickStats[tag.id].links.length - 1 ? "1px solid #243052" : "none" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {lc.linkLabel || lc.linkUrl}
                                </span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                <div style={{ width: 60, height: 4, background: "transparent", borderRadius: 2, overflow: "hidden" }}>
                                  <div style={{ width: `${lc.percent}%`, height: "100%", background: "#38BDF8", borderRadius: 2 }} />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9", minWidth: 24, textAlign: "right" }}>{lc.clicks}</span>
                                <span style={{ fontSize: 10, color: "#64748B", minWidth: 28, textAlign: "right" }}>{lc.percent}%</span>
                              </div>
                            </div>
                          ))}
                          <div style={{ fontSize: 11, color: "#64748B", marginTop: 4, paddingTop: 6, borderTop: "1px solid #243052" }}>
                            Razem: {linkClickStats[tag.id].total} klikniec
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => fetchLinkClicks(tag.id)}
                        style={{ background: "transparent", border: "none", color: "#60a5fa", fontSize: 11, cursor: "pointer", padding: "4px 0 0 0", textDecoration: "underline" }}
                      >
                        Odswiez
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Video stats for video campaigns */}
              {tag.tagType === "video" && (
                <div style={{ marginTop: 8 }}>
                  <button
                    onClick={() => toggleVideoStats(tag.id)}
                    style={{ background: "transparent", border: "none", color: "#10b981", fontSize: 12, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: expandedVideoStats === tag.id ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}
                    >
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                    Statystyki video ({videoStats[tag.id]?.plays ?? "..."} odtworzen)
                  </button>
                  {expandedVideoStats === tag.id && videoStats[tag.id] && (
                    <div style={{ marginTop: 8, padding: 12, background: "#14171e", borderRadius: 8, border: "1px solid rgba(148,163,184,0.08)" }}>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 18, fontWeight: 700, color: "#10b981" }}>{videoStats[tag.id].plays}</span>
                          <span style={{ fontSize: 11, color: "#94A3B8" }}>odtworzen</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 18, fontWeight: 700, color: "#60a5fa" }}>{videoStats[tag.id].completions}</span>
                          <span style={{ fontSize: 11, color: "#94A3B8" }}>do konca</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 18, fontWeight: 700, color: "#7dd3fc" }}>{formatWatchTime(videoStats[tag.id].avgWatchTime)}</span>
                          <span style={{ fontSize: 11, color: "#94A3B8" }}>sred. czas</span>
                        </div>
                        {videoStats[tag.id].plays > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 18, fontWeight: 700, color: "#f59e0b" }}>
                              {Math.round((videoStats[tag.id].completions / videoStats[tag.id].plays) * 100)}%
                            </span>
                            <span style={{ fontSize: 11, color: "#94A3B8" }}>completion rate</span>
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button
                          onClick={() => setTagFilter(tag.id)}
                          style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981", fontSize: 11, cursor: "pointer", padding: "4px 12px", borderRadius: 6, fontWeight: 600 }}
                        >
                          Zobacz pelny wykres retencji
                        </button>
                        <button
                          onClick={() => fetchVideoStats(tag.id)}
                          style={{ background: "transparent", border: "none", color: "#10b981", fontSize: 11, cursor: "pointer", padding: "4px 0", textDecoration: "underline" }}
                        >
                          Odswiez
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
