"use client";

import React, { useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Types (mirror dashboard — consider extracting to shared/types.ts)  */
/* ------------------------------------------------------------------ */

interface TagLink {
  label: string;
  url: string;
  icon: string;
}

interface ClientInfo {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface CampaignInfo {
  id: string;
  name: string;
}

interface TagFull {
  id: string;
  name: string;
  targetUrl: string;
  description: string | null;
  videoFile: string | null;
  isActive: boolean;
  tagType: string;
  links: TagLink[] | null;
  clientId: string | null;
  client: ClientInfo | null;
  campaignId: string | null;
  campaign: CampaignInfo | null;
  _count: { scans: number };
}

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

export interface ActionsTableProps {
  tags: TagFull[];

  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement>;

  uploadingTagId: string | null;
  uploadProgress: string;

  onToggleActive: (tag: TagFull) => void;
  onStartEdit: (tag: TagFull) => void;
  onDeleteTag: (id: string) => void;
  onResetStats: (tagId: string) => void;
  onVideoUpload: (tagId: string, file: File) => void;
  onRemoveVideo: (tagId: string) => void;
  onSetResetTagConfirm: (id: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const TYPE_LABELS: Record<string, string> = {
  url: "URL",
  video: "Video",
  multilink: "Multi-link",
  vcard: "Wizytówka",
  "google-review": "Recenzja",
};

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  url:             { bg: "rgba(96,165,250,0.12)",  color: "#60a5fa" },
  video:           { bg: "rgba(159,103,255,0.12)", color: "#9f67ff" },
  multilink:       { bg: "rgba(245,183,49,0.12)",  color: "#f5b731" },
  vcard:           { bg: "rgba(16,185,129,0.12)",  color: "#10b981" },
  "google-review": { bg: "rgba(251,146,60,0.12)",  color: "#fb923c" },
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function ActionsTable({
  tags,
  openMenuId,
  setOpenMenuId,
  menuRef,
  uploadingTagId,
  uploadProgress,
  onToggleActive,
  onStartEdit,
  onDeleteTag,
  onResetStats,
  onVideoUpload,
  onRemoveVideo,
  onSetResetTagConfirm,
}: ActionsTableProps) {
  /* shared menu item style helpers */
  const menuItem = (color: string) => ({
    display: "flex" as const,
    alignItems: "center" as const,
    gap: 10,
    width: "100%",
    padding: "10px 14px",
    background: "transparent",
    border: "none",
    color,
    fontSize: 13,
    cursor: "pointer" as const,
    textAlign: "left" as const,
  });

  const hoverIn = (e: React.MouseEvent<HTMLElement>, bg = "#1a253a") => {
    (e.currentTarget as HTMLElement).style.background = bg;
  };
  const hoverOut = (e: React.MouseEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.background = "transparent";
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          color: "#e8ecf1",
        }}
      >
        {/* ---- HEAD ---- */}
        <thead>
          <tr style={{ borderBottom: "1px solid #1e2d45" }}>
            {["Nazwa", "Typ", "Status", "Skany", "URL / ID", "Akcje"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "8px 12px",
                  textAlign: "left",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#5a6478",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        {/* ---- BODY ---- */}
        <tbody>
          {tags.map((tag, idx) => {
            const typeStyle = TYPE_COLORS[tag.tagType] ?? { bg: "rgba(139,149,168,0.12)", color: "#8b95a8" };
            const isLast = idx === tags.length - 1;

            return (
              <tr
                key={tag.id}
                onClick={() => onStartEdit(tag)}
                style={{
                  borderBottom: isLast ? "none" : "1px solid #1a253a",
                  cursor: "pointer",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#0f1a2e"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                {/* Nazwa */}
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                  {tag.name}
                  {tag.description && (
                    <div style={{ fontSize: 11, color: "#5a6478", fontWeight: 400, marginTop: 1 }}>
                      {tag.description}
                    </div>
                  )}
                </td>

                {/* Typ */}
                <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: typeStyle.bg,
                      color: typeStyle.color,
                    }}
                  >
                    {TYPE_LABELS[tag.tagType] ?? tag.tagType}
                  </span>
                </td>

                {/* Status */}
                <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: tag.isActive ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                      color: tag.isActive ? "#10b981" : "#f87171",
                    }}
                  >
                    {tag.isActive ? "Aktywny" : "Nieaktywny"}
                  </span>
                </td>

                {/* Skany */}
                <td style={{ padding: "10px 12px", fontWeight: 700, color: "#f5b731", whiteSpace: "nowrap" }}>
                  {tag._count.scans}
                </td>

                {/* URL / ID */}
                <td style={{ padding: "10px 12px", maxWidth: 220 }}>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      color: "#f5b731",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={tag.id}
                  >
                    {tag.id}
                  </div>
                  {(tag.tagType === "url" || tag.tagType === "google-review") && tag.targetUrl && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#5a6478",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginTop: 1,
                      }}
                      title={tag.targetUrl}
                    >
                      {tag.targetUrl}
                    </div>
                  )}
                </td>

                {/* Akcje */}
                <td
                  style={{ padding: "10px 12px", whiteSpace: "nowrap" }}
                  onClick={(e) => e.stopPropagation()} /* prevent row-click when clicking controls */
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {/* Active toggle */}
                    <button
                      onClick={() => onToggleActive(tag)}
                      title={tag.isActive ? "Dezaktywuj" : "Aktywuj"}
                      style={{
                        width: 44,
                        height: 24,
                        borderRadius: 12,
                        background: tag.isActive ? "#10b981" : "#2a4060",
                        border: "none",
                        cursor: "pointer",
                        position: "relative",
                        transition: "background 0.2s",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: 3,
                          left: tag.isActive ? 23 : 3,
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "#fff",
                          transition: "left 0.2s",
                        }}
                      />
                    </button>

                    {/* ⋯ menu */}
                    <div
                      style={{ position: "relative" }}
                      ref={openMenuId === tag.id ? menuRef : undefined}
                    >
                      <button
                        onClick={() => setOpenMenuId(openMenuId === tag.id ? null : tag.id)}
                        title="Więcej opcji"
                        style={{
                          background: "#1a253a",
                          border: "1px solid #1e2d45",
                          color: "#8b95a8",
                          borderRadius: 6,
                          width: 32,
                          height: 32,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                          lineHeight: 1,
                          letterSpacing: "0.05em",
                          flexShrink: 0,
                          transition: "border-color 0.15s, color 0.15s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#e69500"; e.currentTarget.style.color = "#e8ecf1"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e2d45"; e.currentTarget.style.color = "#8b95a8"; }}
                      >
                        ⋯
                      </button>

                      {openMenuId === tag.id && (
                        <div
                          className="ctx-menu"
                          style={{
                            position: "absolute",
                            top: "calc(100% + 6px)",
                            right: 0,
                            minWidth: 200,
                            background: "#0d1526",
                            border: "1px solid #1e2d45",
                            borderRadius: 10,
                            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                            zIndex: 500,
                            overflow: "hidden",
                          }}
                        >
                          {/* Edytuj */}
                          <button
                            onClick={() => { setOpenMenuId(null); onStartEdit(tag); }}
                            style={menuItem("#e8ecf1")}
                            onMouseEnter={hoverIn}
                            onMouseLeave={hoverOut}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Edytuj
                          </button>

                          <div style={{ height: 1, background: "#1e2d45", margin: "0 10px" }} />

                          {/* Pobierz QR PNG */}
                          <button
                            onClick={async () => {
                              setOpenMenuId(null);
                              const res = await fetch(`/api/qr?tagId=${encodeURIComponent(tag.id)}&format=png`);
                              if (!res.ok) return;
                              const blob = await res.blob();
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url; a.download = `qr-${tag.id}.png`; a.click();
                              URL.revokeObjectURL(url);
                            }}
                            style={menuItem("#10b981")}
                            onMouseEnter={hoverIn}
                            onMouseLeave={hoverOut}
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
                              setOpenMenuId(null);
                              const res = await fetch(`/api/qr?tagId=${encodeURIComponent(tag.id)}&format=svg`);
                              if (!res.ok) return;
                              const blob = await res.blob();
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url; a.download = `qr-${tag.id}.svg`; a.click();
                              URL.revokeObjectURL(url);
                            }}
                            style={menuItem("#10b981")}
                            onMouseEnter={hoverIn}
                            onMouseLeave={hoverOut}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                            </svg>
                            Pobierz SVG
                          </button>

                          {/* Pobierz PDF */}
                          <button
                            onClick={() => { setOpenMenuId(null); window.open(`/api/qr?tagId=${encodeURIComponent(tag.id)}&format=pdf`, "_blank"); }}
                            style={menuItem("#f5b731")}
                            onMouseEnter={hoverIn}
                            onMouseLeave={hoverOut}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                            </svg>
                            Pobierz PDF (druk A4)
                          </button>

                          {/* Video items */}
                          {tag.tagType === "video" && (
                            <>
                              <div style={{ height: 1, background: "#1e2d45", margin: "0 10px" }} />
                              <label
                                style={{ ...menuItem("#9f67ff"), display: "flex" }}
                                onMouseEnter={hoverIn}
                                onMouseLeave={hoverOut}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                </svg>
                                {uploadingTagId === tag.id ? uploadProgress : (tag.videoFile ? "Podmień video" : "Wgraj video")}
                                <input
                                  type="file"
                                  accept="video/mp4,video/webm,video/quicktime"
                                  style={{ display: "none" }}
                                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setOpenMenuId(null); onVideoUpload(tag.id, f); } e.target.value = ""; }}
                                />
                              </label>
                              {tag.videoFile && (
                                <button
                                  onClick={() => { setOpenMenuId(null); onRemoveVideo(tag.id); }}
                                  style={menuItem("#f87171")}
                                  onMouseEnter={(e) => hoverIn(e, "#1a253a")}
                                  onMouseLeave={hoverOut}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                                  </svg>
                                  Usuń video
                                </button>
                              )}
                            </>
                          )}

                          <div style={{ height: 1, background: "#1e2d45", margin: "0 10px" }} />

                          {/* Reset statystyk */}
                          <button
                            onClick={() => { setOpenMenuId(null); onSetResetTagConfirm(tag.id); onStartEdit(tag); }}
                            style={menuItem("#f59e0b")}
                            onMouseEnter={(e) => hoverIn(e, "rgba(245,158,11,0.08)")}
                            onMouseLeave={hoverOut}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                            </svg>
                            Reset statystyk
                          </button>

                          {/* Usuń akcję */}
                          <button
                            onClick={() => { setOpenMenuId(null); onDeleteTag(tag.id); }}
                            style={menuItem("#f87171")}
                            onMouseEnter={(e) => hoverIn(e, "rgba(239,68,68,0.08)")}
                            onMouseLeave={hoverOut}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                            </svg>
                            Usuń akcję
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
