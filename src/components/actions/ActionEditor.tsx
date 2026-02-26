"use client";

import React, { useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types (copied from dashboard – keep in sync or extract to shared)  */
/* ------------------------------------------------------------------ */

interface TagLink {
  label: string;
  url: string;
  icon: string;
}

interface VCardData {
  firstName: string;
  lastName: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  tiktok?: string;
  youtube?: string;
  whatsapp?: string;
  telegram?: string;
  note?: string;
}

const iconOptions = [
  { value: "instagram", label: "Instagram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Telefon" },
  { value: "website", label: "Strona WWW" },
  { value: "telegram", label: "Telegram" },
  { value: "link", label: "Link" },
];

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

export interface ActionEditorProps {
  tagId: string;

  editName: string;
  setEditName: (v: string) => void;

  editType: string;

  editUrl: string;
  setEditUrl: (v: string) => void;

  editDesc: string;
  setEditDesc: (v: string) => void;

  editChannel: "nfc" | "qr";
  setEditChannel: (v: "nfc" | "qr") => void;

  editTagLinks: TagLink[];
  setEditTagLinks: (v: TagLink[]) => void;

  editVCard: VCardData;
  setEditVCard: (v: VCardData) => void;

  resetTagConfirm: string | null;
  setResetTagConfirm: (v: string | null) => void;
  resetting: boolean;

  onSave: (id: string) => void;
  onCancel: () => void;
  onResetStats: (tagId: string) => void;
  onDeleteTag: (tagId: string) => void;

  readOnly?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function ActionEditor({
  tagId,
  editName,
  setEditName,
  editType,
  editUrl,
  setEditUrl,
  editDesc,
  setEditDesc,
  editChannel,
  setEditChannel,
  editTagLinks,
  setEditTagLinks,
  editVCard,
  setEditVCard,
  resetTagConfirm,
  setResetTagConfirm,
  resetting,
  onSave,
  onCancel,
  onResetStats,
  onDeleteTag,
  readOnly = false,
}: ActionEditorProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [editTokenUrl, setEditTokenUrl] = useState<string | null>(null);
  const [editTokenLoading, setEditTokenLoading] = useState(false);
  const [editTokenCopied, setEditTokenCopied] = useState(false);

  const handleGenerateEditToken = async () => {
    setEditTokenLoading(true);
    try {
      const res = await fetch("/api/tags/edit-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId }),
      });
      if (res.ok) {
        const data = await res.json();
        setEditTokenUrl(data.editUrl);
      }
    } catch { /* ignore */ }
    finally { setEditTokenLoading(false); }
  };

  const handleRevokeEditToken = async () => {
    try {
      await fetch("/api/tags/edit-token", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId }),
      });
      setEditTokenUrl(null);
    } catch { /* ignore */ }
  };

  const handleCopyEditToken = () => {
    if (!editTokenUrl) return;
    navigator.clipboard.writeText(editTokenUrl).then(() => {
      setEditTokenCopied(true);
      setTimeout(() => setEditTokenCopied(false), 1500);
    });
  };

  const disabledStyle: React.CSSProperties = readOnly ? { opacity: 0.55, cursor: "default", pointerEvents: "none" } : {};

  const handleCopyLink = () => {
    const url = `${window.location.origin}/s/${tagId}`;
    const done = () => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    };
    navigator.clipboard.writeText(url).then(done).catch(() => {
      const el = document.createElement("textarea");
      el.value = url;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      done();
    });
  };

  return (
    <div>
      {/* Link publiczny — always visible (read-only friendly) */}
      <div style={{ marginBottom: 20, padding: "12px 14px", background: "rgba(0,200,160,0.05)", borderRadius: 10, border: "1px solid rgba(0,200,160,0.3)" }}>
        <label style={{ display: "block", fontSize: 11, color: "#eaf0f6", marginBottom: 8, fontWeight: 700, letterSpacing: 0.3 }}>
          Link publiczny
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            readOnly
            className="input-field"
            value={`${typeof window !== "undefined" ? window.location.origin : ""}/s/${tagId}`}
            style={{ fontSize: 12, padding: "6px 10px", color: "#2ee8c0", fontFamily: "monospace", cursor: "text", userSelect: "all", flex: 1 }}
            onFocus={e => e.target.select()}
          />
          <button
            type="button"
            onClick={handleCopyLink}
            title="Kopiuj link publiczny"
            style={{
              background: linkCopied ? "rgba(34,197,94,0.12)" : "#232730",
              border: `1px solid ${linkCopied ? "rgba(34,197,94,0.4)" : "#3d4250"}`,
              color: linkCopied ? "#34d399" : "#eaf0f6",
              borderRadius: 7,
              padding: "6px 12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              fontWeight: 600,
              flexShrink: 0,
              transition: "background 0.2s, color 0.2s, border-color 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {linkCopied ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Skopiowano
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Kopiuj link
              </>
            )}
          </button>
          <a
            href={`/s/${tagId}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Otwórz w nowej karcie"
            style={{
              background: "#232730",
              border: "1px solid #3d4250",
              color: "#8a92a4",
              borderRadius: 7,
              padding: "6px 10px",
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              fontWeight: 600,
              flexShrink: 0,
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#eaf0f6"; e.currentTarget.style.borderColor = "#3a5070"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#8a92a4"; e.currentTarget.style.borderColor = "#3d4250"; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Otwórz
          </a>
        </div>
      </div>

      {/* Fields */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: 11, color: "#8a92a4", marginBottom: 3 }}>
            Nazwa
          </label>
          <input
            className="input-field"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            disabled={readOnly}
            style={readOnly ? { opacity: 0.55, cursor: "default" } : {}}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "#8a92a4", marginBottom: 3 }}>
            Typ
            <span style={{ marginLeft: 4, fontSize: 10, color: "#3d4250", fontWeight: 400 }}>(zablokowany)</span>
          </label>
          <select
            className="input-field"
            value={editType}
            disabled
            style={{ padding: "8px 12px", opacity: 0.55, cursor: "not-allowed" }}
          >
            <option value="url">Przekierowanie URL</option>
            <option value="video">Video player</option>
            <option value="multilink">Multi-link</option>
            <option value="vcard">Wizytówka (vCard)</option>
            <option value="google-review">Recenzja Google</option>
          </select>
        </div>
        {(editType === "url" || editType === "google-review") && (
          <div>
            <label style={{ display: "block", fontSize: 11, color: "#8a92a4", marginBottom: 3 }}>
              {editType === "google-review" ? "Link do recenzji Google" : "Docelowy URL"}
            </label>
            <input
              className="input-field"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              placeholder={editType === "google-review" ? "https://search.google.com/local/writereview?placeid=..." : "https://example.com"}
              disabled={readOnly}
              style={readOnly ? { opacity: 0.55, cursor: "default" } : {}}
            />
          </div>
        )}
        <div>
          <label style={{ display: "block", fontSize: 11, color: "#8a92a4", marginBottom: 3 }}>
            Opis
          </label>
          <input
            className="input-field"
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            disabled={readOnly}
            style={readOnly ? { opacity: 0.55, cursor: "default" } : {}}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "#8a92a4", marginBottom: 3 }}>
            Kanał
            <span style={{ marginLeft: 4, fontSize: 10, color: "#3d4250", fontWeight: 400 }}>(atrybucja)</span>
          </label>
          <div style={{ display: "flex", gap: 0, borderRadius: 8, overflow: "hidden", border: "1px solid #2a2e38", width: "fit-content", ...disabledStyle }}>
            <button type="button" onClick={() => !readOnly && setEditChannel("nfc")}
              style={{ padding: "6px 14px", fontSize: 11, fontWeight: 600, border: "none", cursor: readOnly ? "default" : "pointer", background: editChannel === "nfc" ? "#2ee8c0" : "#232730", color: editChannel === "nfc" ? "#0b0d12" : "#8a92a4", transition: "background 0.15s, color 0.15s" }}
            >NFC</button>
            <button type="button" onClick={() => !readOnly && setEditChannel("qr")}
              style={{ padding: "6px 14px", fontSize: 11, fontWeight: 600, border: "none", borderLeft: "1px solid #2a2e38", cursor: readOnly ? "default" : "pointer", background: editChannel === "qr" ? "#10b981" : "#232730", color: editChannel === "qr" ? "#0b0d12" : "#8a92a4", transition: "background 0.15s, color 0.15s" }}
            >QR</button>
          </div>
        </div>
      </div>

      {/* Multilink editor */}
      {editType === "multilink" && (
        <div style={{
          marginBottom: 12,
          padding: 14,
          background: "#0f1524",
          borderRadius: 10,
          border: "1px solid #2a2e38",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h4 style={{ fontSize: 12, fontWeight: 600, color: "#eaf0f6" }}>Linki</h4>
            {!readOnly && (
              <button
                type="button"
                onClick={() => setEditTagLinks([...editTagLinks, { label: "", url: "", icon: "link" }])}
                style={{ background: "#232730", border: "1px solid #2a2e38", color: "#10b981", borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
              >
                + Dodaj link
              </button>
            )}
          </div>
          {editTagLinks.map((link, idx) => (
            <div key={idx} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
              <select
                className="input-field"
                value={link.icon}
                onChange={(e) => { const u = [...editTagLinks]; u[idx] = { ...u[idx], icon: e.target.value }; setEditTagLinks(u); }}
                style={{ padding: "5px 6px", width: 120, fontSize: 11 }}
                disabled={readOnly}
              >
                {iconOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <input
                className="input-field"
                placeholder="Etykieta"
                value={link.label}
                onChange={(e) => { const u = [...editTagLinks]; u[idx] = { ...u[idx], label: e.target.value }; setEditTagLinks(u); }}
                style={{ flex: "1 1 100px", minWidth: 80, fontSize: 11, padding: "5px 8px" }}
                disabled={readOnly}
              />
              <input
                className="input-field"
                placeholder="https://..."
                value={link.url}
                onChange={(e) => { const u = [...editTagLinks]; u[idx] = { ...u[idx], url: e.target.value }; setEditTagLinks(u); }}
                style={{ flex: "2 1 160px", minWidth: 120, fontSize: 11, padding: "5px 8px" }}
                disabled={readOnly}
              />
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => { const u = editTagLinks.filter((_, i) => i !== idx); setEditTagLinks(u.length ? u : [{ label: "", url: "", icon: "link" }]); }}
                  style={{ background: "transparent", border: "1px solid #2a2e38", color: "#555c6e", borderRadius: 6, width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}
                >
                  X
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {editType === "video" && (
        <p style={{ fontSize: 11, color: "#555c6e", marginBottom: 12 }}>
          URL zostanie ustawiony automatycznie na /watch/{tagId}. Wgraj video po zapisaniu.
        </p>
      )}

      {/* vCard editor */}
      {editType === "vcard" && (
        <div style={{
          marginBottom: 12,
          padding: 14,
          background: "#0f1524",
          borderRadius: 10,
          border: "1px solid #2a2e38",
        }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: "#eaf0f6", marginBottom: 10 }}>Dane wizytowki</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
            {[
              { key: "firstName", label: "Imie" },
              { key: "lastName", label: "Nazwisko" },
              { key: "company", label: "Firma" },
              { key: "jobTitle", label: "Stanowisko" },
              { key: "phone", label: "Telefon" },
              { key: "email", label: "Email" },
              { key: "website", label: "Strona WWW" },
              { key: "address", label: "Adres" },
              { key: "instagram", label: "Instagram" },
              { key: "facebook", label: "Facebook" },
              { key: "linkedin", label: "LinkedIn" },
              { key: "whatsapp", label: "WhatsApp" },
              { key: "tiktok", label: "TikTok" },
              { key: "youtube", label: "YouTube" },
              { key: "telegram", label: "Telegram" },
              { key: "note", label: "Notatka" },
            ].map(field => (
              <div key={field.key}>
                <label style={{ display: "block", fontSize: 10, color: "#8a92a4", marginBottom: 2 }}>{field.label}</label>
                <input
                  className="input-field"
                  value={(editVCard as unknown as Record<string, string>)[field.key] || ""}
                  onChange={(e) => setEditVCard({ ...editVCard, [field.key]: e.target.value })}
                  style={{ fontSize: 11, padding: "5px 8px" }}
                  disabled={readOnly}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Self-service edit link — vCard + admin only */}
      {editType === "vcard" && !readOnly && (
        <div style={{
          marginBottom: 14,
          padding: 14,
          background: "#0f1524",
          borderRadius: 10,
          border: "1px solid #2a2e38",
        }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: "#eaf0f6", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2ee8c0" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
            Link edycji wizytowki
          </h4>
          <p style={{ fontSize: 11, color: "#555c6e", marginBottom: 10, lineHeight: 1.5 }}>
            Wygeneruj link, ktory pozwoli wlascicielowi wizytowki samodzielnie edytowac swoje dane.
          </p>
          {editTokenUrl ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                readOnly
                className="input-field"
                value={editTokenUrl}
                style={{ fontSize: 11, padding: "6px 10px", color: "#2ee8c0", fontFamily: "monospace", cursor: "text", userSelect: "all" }}
                onFocus={e => e.target.select()}
              />
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={handleCopyEditToken}
                  style={{
                    background: editTokenCopied ? "rgba(34,197,94,0.12)" : "#232730",
                    border: `1px solid ${editTokenCopied ? "rgba(34,197,94,0.4)" : "#2a2e38"}`,
                    color: editTokenCopied ? "#34d399" : "#eaf0f6",
                    borderRadius: 6, padding: "5px 12px", fontSize: 11, cursor: "pointer", fontWeight: 600,
                  }}
                >
                  {editTokenCopied ? "✓ Skopiowano" : "Kopiuj link"}
                </button>
                <button
                  type="button"
                  onClick={handleRevokeEditToken}
                  style={{ background: "transparent", border: "1px solid #2e1e1e", color: "#f87171", borderRadius: 6, padding: "5px 12px", fontSize: 11, cursor: "pointer" }}
                >
                  Uniewaznij
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGenerateEditToken}
              disabled={editTokenLoading}
              style={{
                background: "#232730", border: "1px solid #2a2e38", color: "#2ee8c0",
                borderRadius: 6, padding: "6px 14px", fontSize: 11, cursor: "pointer", fontWeight: 600,
                opacity: editTokenLoading ? 0.6 : 1,
              }}
            >
              {editTokenLoading ? "Generowanie..." : "Wygeneruj link edycji"}
            </button>
          )}
        </div>
      )}

      {/* Action buttons — Save only for admin, Close always visible */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {!readOnly && (
          <button
            className="btn-primary"
            onClick={() => onSave(tagId)}
            style={{ padding: "7px 18px", fontSize: 12 }}
          >
            Zapisz
          </button>
        )}
        <button
          onClick={onCancel}
          style={{
            background: "#232730",
            border: "1px solid #2a2e38",
            color: "#8a92a4",
            borderRadius: 8,
            padding: "7px 18px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {readOnly ? "Zamknij" : "Anuluj"}
        </button>
      </div>

      {/* Advanced section — hidden for viewers */}
      {!readOnly && (
        <details style={{ marginTop: 4 }} open={resetTagConfirm === tagId || undefined}>
          <summary style={{ fontSize: 11, color: "#555c6e", cursor: "pointer", userSelect: "none", listStyle: "none", display: "flex", alignItems: "center", gap: 6 }}>
            <span className="adv-arrow">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </span>
            Zaawansowane (reset / usuń)
          </summary>
          <div style={{ marginTop: 10, padding: "12px 14px", background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "#555c6e", flexBasis: "100%", marginBottom: 4 }}>Operacje nieodwracalne — działaj ostrożnie</span>
            {resetTagConfirm === tagId ? (
              <>
                <button
                  onClick={() => onResetStats(tagId)}
                  disabled={resetting}
                  style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", borderRadius: 6, padding: "6px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                >
                  {resetting ? "..." : "Potwierdź reset"}
                </button>
                <button
                  onClick={() => setResetTagConfirm(null)}
                  style={{ background: "#232730", border: "1px solid #2a2e38", color: "#8a92a4", borderRadius: 6, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}
                >
                  Nie
                </button>
              </>
            ) : (
              <button
                onClick={() => setResetTagConfirm(tagId)}
                style={{ background: "transparent", border: "1px solid #2e1e1e", color: "#f59e0b", borderRadius: 6, padding: "6px 12px", fontSize: 11, cursor: "pointer" }}
              >
                Reset statystyk
              </button>
            )}
            <button
              onClick={() => onDeleteTag(tagId)}
              style={{ background: "transparent", border: "1px solid #2e1e1e", color: "#f87171", borderRadius: 6, padding: "6px 12px", fontSize: 11, cursor: "pointer" }}
            >
              Usuń akcję
            </button>
          </div>
        </details>
      )}
    </div>
  );
}
