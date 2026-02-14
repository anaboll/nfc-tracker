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
}: ActionEditorProps) {
  const [linkCopied, setLinkCopied] = useState(false);

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
      {/* Link akcji */}
      <div style={{ marginBottom: 14, padding: "10px 12px", background: "#0f1524", borderRadius: 8, border: "1px solid #1e2d45", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <label style={{ display: "block", fontSize: 10, color: "#8b95a8", marginBottom: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Link akcji
          </label>
          <input
            readOnly
            className="input-field"
            value={`${typeof window !== "undefined" ? window.location.origin : ""}/s/${tagId}`}
            style={{ fontSize: 11, padding: "5px 8px", color: "#f5b731", fontFamily: "monospace", cursor: "text", userSelect: "all" }}
            onFocus={e => e.target.select()}
          />
        </div>
        <button
          type="button"
          onClick={handleCopyLink}
          title="Kopiuj link"
          style={{
            background: linkCopied ? "rgba(34,197,94,0.12)" : "#1a253a",
            border: `1px solid ${linkCopied ? "rgba(34,197,94,0.4)" : "#1e2d45"}`,
            color: linkCopied ? "#22c55e" : "#8b95a8",
            borderRadius: 7,
            padding: "6px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
            marginTop: 18,
            transition: "background 0.2s, color 0.2s, border-color 0.2s",
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
              Kopiuj
            </>
          )}
        </button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>
            Nazwa
          </label>
          <input
            className="input-field"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>
            Typ
            <span style={{ marginLeft: 4, fontSize: 10, color: "#3a4460", fontWeight: 400 }}>(zablokowany)</span>
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
            <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>
              {editType === "google-review" ? "Link do recenzji Google" : "Docelowy URL"}
            </label>
            <input
              className="input-field"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              placeholder={editType === "google-review" ? "https://search.google.com/local/writereview?placeid=..." : "https://example.com"}
            />
          </div>
        )}
        <div>
          <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>
            Opis
          </label>
          <input
            className="input-field"
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>
            Kanał
            <span style={{ marginLeft: 4, fontSize: 10, color: "#3a4460", fontWeight: 400 }}>(atrybucja)</span>
          </label>
          <div style={{ display: "flex", gap: 0, borderRadius: 8, overflow: "hidden", border: "1px solid #1e2d45", width: "fit-content" }}>
            <button type="button" onClick={() => setEditChannel("nfc")}
              style={{ padding: "6px 14px", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", background: editChannel === "nfc" ? "#f5b731" : "#1a253a", color: editChannel === "nfc" ? "#06080d" : "#8b95a8", transition: "background 0.15s, color 0.15s" }}
            >NFC</button>
            <button type="button" onClick={() => setEditChannel("qr")}
              style={{ padding: "6px 14px", fontSize: 11, fontWeight: 600, border: "none", borderLeft: "1px solid #1e2d45", cursor: "pointer", background: editChannel === "qr" ? "#10b981" : "#1a253a", color: editChannel === "qr" ? "#06080d" : "#8b95a8", transition: "background 0.15s, color 0.15s" }}
            >QR</button>
          </div>
        </div>
      </div>
      {/* Multilink editor in edit mode */}
      {editType === "multilink" && (
        <div style={{
          marginBottom: 12,
          padding: 14,
          background: "#0f1524",
          borderRadius: 10,
          border: "1px solid #1e2d45",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h4 style={{ fontSize: 12, fontWeight: 600, color: "#e8ecf1" }}>Linki</h4>
            <button
              type="button"
              onClick={() => setEditTagLinks([...editTagLinks, { label: "", url: "", icon: "link" }])}
              style={{ background: "#1a253a", border: "1px solid #1e2d45", color: "#10b981", borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
            >
              + Dodaj link
            </button>
          </div>
          {editTagLinks.map((link, idx) => (
            <div key={idx} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
              <select
                className="input-field"
                value={link.icon}
                onChange={(e) => { const u = [...editTagLinks]; u[idx] = { ...u[idx], icon: e.target.value }; setEditTagLinks(u); }}
                style={{ padding: "5px 6px", width: 120, fontSize: 11 }}
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
              />
              <input
                className="input-field"
                placeholder="https://..."
                value={link.url}
                onChange={(e) => { const u = [...editTagLinks]; u[idx] = { ...u[idx], url: e.target.value }; setEditTagLinks(u); }}
                style={{ flex: "2 1 160px", minWidth: 120, fontSize: 11, padding: "5px 8px" }}
              />
              <button
                type="button"
                onClick={() => { const u = editTagLinks.filter((_, i) => i !== idx); setEditTagLinks(u.length ? u : [{ label: "", url: "", icon: "link" }]); }}
                style={{ background: "transparent", border: "1px solid #1e2d45", color: "#5a6478", borderRadius: 6, width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}
      {editType === "video" && (
        <p style={{ fontSize: 11, color: "#5a6478", marginBottom: 12 }}>
          URL zostanie ustawiony automatycznie na /watch/{tagId}. Wgraj video po zapisaniu.
        </p>
      )}
      {editType === "vcard" && (
        <div style={{
          marginBottom: 12,
          padding: 14,
          background: "#0f1524",
          borderRadius: 10,
          border: "1px solid #1e2d45",
        }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: "#e8ecf1", marginBottom: 10 }}>Dane wizytowki</h4>
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
                <label style={{ display: "block", fontSize: 10, color: "#8b95a8", marginBottom: 2 }}>{field.label}</label>
                <input
                  className="input-field"
                  value={(editVCard as unknown as Record<string, string>)[field.key] || ""}
                  onChange={(e) => setEditVCard({ ...editVCard, [field.key]: e.target.value })}
                  style={{ fontSize: 11, padding: "5px 8px" }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          className="btn-primary"
          onClick={() => onSave(tagId)}
          style={{ padding: "7px 18px", fontSize: 12 }}
        >
          Zapisz
        </button>
        <button
          onClick={onCancel}
          style={{
            background: "#1a253a",
            border: "1px solid #1e2d45",
            color: "#8b95a8",
            borderRadius: 8,
            padding: "7px 18px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Anuluj
        </button>
      </div>
      {/* Advanced section */}
      <details style={{ marginTop: 4 }}>
        <summary style={{ fontSize: 11, color: "#5a6478", cursor: "pointer", userSelect: "none", listStyle: "none", display: "flex", alignItems: "center", gap: 6 }}>
          <span className="adv-arrow">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </span>
          Zaawansowane (reset / usuń)
        </summary>
        <div style={{ marginTop: 10, padding: "12px 14px", background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#5a6478", flexBasis: "100%", marginBottom: 4 }}>Operacje nieodwracalne — działaj ostrożnie</span>
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
                style={{ background: "#1a253a", border: "1px solid #1e2d45", color: "#8b95a8", borderRadius: 6, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}
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
    </div>
  );
}
