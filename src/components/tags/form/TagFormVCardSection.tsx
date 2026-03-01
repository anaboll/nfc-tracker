"use client";

import React, { useState, useRef } from "react";
import type { VCardData, VCardTheme, DisplayItem } from "@/types/vcard";
import { computeDisplayItems, FIELD_LABELS } from "@/types/vcard";
import ImageCropper from "@/components/ui/ImageCropper";
import ThemeEditor from "@/components/vcard/ThemeEditor";

interface Props {
  tagType: string;
  vcard: VCardData;
  setVcard: (v: VCardData) => void;
  readOnly: boolean;
  errors: Record<string, string>;
  clearFieldError: (f: string) => void;
  tagId: string;
  mode: "create" | "edit";
}

interface FieldDef {
  key: string;
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}

/** Normalize photo path */
function photoSrc(photo: string): string {
  if (!photo) return "";
  if (photo.startsWith("/api/uploads/")) return photo;
  if (photo.startsWith("/uploads/")) return `/api${photo}`;
  return photo;
}

const SECTIONS: { title: string; icon: string; collapsed?: boolean; fields: FieldDef[] }[] = [
  {
    title: "Dane osobowe",
    icon: "\uD83D\uDC64",
    fields: [
      { key: "firstName", label: "Imie", required: true },
      { key: "lastName", label: "Nazwisko", required: true },
      { key: "company", label: "Firma" },
      { key: "jobTitle", label: "Stanowisko" },
    ],
  },
  {
    title: "Kontakt",
    icon: "\uD83D\uDCDE",
    fields: [
      { key: "phone", label: "Telefon", type: "tel", placeholder: "+48..." },
      { key: "email", label: "Email", type: "email" },
      { key: "website", label: "Strona WWW", type: "url", placeholder: "https://..." },
      { key: "address", label: "Adres" },
    ],
  },
  {
    title: "Social Media",
    icon: "\uD83D\uDCF1",
    collapsed: true,
    fields: [
      { key: "instagram", label: "Instagram", placeholder: "@username lub URL" },
      { key: "facebook", label: "Facebook", placeholder: "username lub URL" },
      { key: "linkedin", label: "LinkedIn", placeholder: "username lub URL" },
      { key: "whatsapp", label: "WhatsApp", placeholder: "+48..." },
      { key: "tiktok", label: "TikTok", placeholder: "@username lub URL" },
      { key: "youtube", label: "YouTube", placeholder: "@channel lub URL" },
      { key: "telegram", label: "Telegram", placeholder: "@username lub URL" },
    ],
  },
  {
    title: "Notatka",
    icon: "\uD83D\uDCDD",
    fields: [
      { key: "note", label: "Notatka", placeholder: "Dodatkowe informacje..." },
    ],
  },
];

export default function TagFormVCardSection({
  tagType, vcard, setVcard, readOnly, errors, clearFieldError, tagId, mode,
}: Props) {
  const [socialOpen, setSocialOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(true);
  const [displayOpen, setDisplayOpen] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  if (tagType !== "vcard") return null;

  const updateField = (key: string, value: string) => {
    setVcard({ ...vcard, [key]: value });
    clearFieldError("vcard");
  };

  /* -- Photo handlers -- */
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!file.type.startsWith("image/")) {
      setPhotoError("Dozwolone tylko pliki graficzne");
      setTimeout(() => setPhotoError(null), 3000);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError("Maksymalny rozmiar: 10MB");
      setTimeout(() => setPhotoError(null), 3000);
      return;
    }
    setCropFile(file);
  };

  const handleCroppedUpload = async (blob: Blob) => {
    setCropFile(null);
    setPhotoUploading(true);
    try {
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("file", file);
      if (tagId) formData.append("tagId", tagId);

      const res = await fetch("/api/vcard/photo/admin", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setVcard({ ...vcard, photo: data.path });
    } catch {
      setPhotoError("Nie udalo sie wgrac zdjecia");
      setTimeout(() => setPhotoError(null), 3000);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleThemeChange = (t: VCardTheme) => {
    setVcard({ ...vcard, theme: t });
  };

  /* -- Website logo upload -- */
  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return;
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (tagId) formData.append("tagId", tagId);
      const res = await fetch("/api/vcard/photo/admin", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setVcard({ ...vcard, websiteLogo: data.path });
    } catch {
      // silently fail
    } finally {
      setLogoUploading(false);
    }
  };

  const initials = [vcard.firstName?.[0], vcard.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";

  return (
    <>
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Wizytowka</h3>

        {errors.vcard && <div style={{ ...styles.error, marginBottom: 12 }}>{errors.vcard}</div>}

        {/* ── PHOTO UPLOAD ── */}
        <div style={styles.photoSection}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            style={{ display: "none" }}
            disabled={readOnly}
          />
          <div
            style={styles.photoWrapper}
            onClick={() => !readOnly && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            {vcard.photo ? (
              <div style={styles.photoPreview}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoSrc(vcard.photo)}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
                <div style={styles.photoOverlay}>Zmien</div>
              </div>
            ) : (
              <div style={styles.photoPlaceholder}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span style={{ fontSize: 11, marginTop: 4 }}>Dodaj zdjecie</span>
              </div>
            )}
          </div>
          {photoUploading && (
            <span style={{ fontSize: 11, color: "var(--accent)", marginTop: 6 }}>Wgrywanie...</span>
          )}
          {photoError && (
            <span style={{ fontSize: 11, color: "var(--error)", marginTop: 6 }}>{photoError}</span>
          )}
          {vcard.photo && !readOnly && (
            <button
              type="button"
              onClick={() => setVcard({ ...vcard, photo: "" })}
              style={styles.photoRemoveBtn}
            >
              Usun zdjecie
            </button>
          )}
        </div>

        {/* ── THEME EDITOR (inline, right after photo) ── */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => setThemeOpen(!themeOpen)}
            style={styles.collapseBtn}
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
              style={{
                transform: themeOpen ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span>{"\uD83C\uDFA8"} Motyw wizytowki</span>
          </button>
          {themeOpen && (
            <ThemeEditor
              theme={vcard.theme || ({} as VCardTheme)}
              onChange={handleThemeChange}
            />
          )}
        </div>

        {/* ── DISPLAY SETTINGS ── */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => setDisplayOpen(!displayOpen)}
            style={styles.collapseBtn}
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
              style={{
                transform: displayOpen ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span>{"\u2699\uFE0F"} Ustawienia wyswietlania</span>
          </button>
          {displayOpen && (
            <div style={{ padding: "12px 0" }}>
              <div style={styles.subsectionTitle}>Kolejnosc i widocznosc</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {(() => {
                  const items = computeDisplayItems(vcard);
                  const updateItems = (newItems: DisplayItem[]) => setVcard({ ...vcard, displayItems: newItems });

                  return items.map((item, idx, arr) => {
                    const isHidden = item.visible === false;
                    const isHeader = item.type === "header";

                    // Toggle switch (shared)
                    const toggleBtn = (
                      <button
                        type="button"
                        onClick={() => {
                          const ni = [...arr];
                          ni[idx] = { ...item, visible: !isHidden };
                          updateItems(ni);
                        }}
                        style={{
                          width: 34, height: 18, borderRadius: 9, border: "none", cursor: "pointer",
                          background: isHidden ? "var(--surface)" : "var(--accent)",
                          position: "relative", transition: "background 0.2s", flexShrink: 0,
                        }}
                      >
                        <div style={{
                          width: 14, height: 14, borderRadius: "50%", background: "#fff",
                          position: "absolute", top: 2,
                          left: isHidden ? 2 : 18, transition: "left 0.2s",
                        }} />
                      </button>
                    );

                    // Move buttons (shared)
                    const moveUp = (
                      <button type="button" disabled={idx === 0} onClick={() => {
                        const ni = [...arr]; [ni[idx - 1], ni[idx]] = [ni[idx], ni[idx - 1]]; updateItems(ni);
                      }} style={{ background: "none", border: "none", color: idx === 0 ? "var(--txt-muted)" : "var(--txt-sec)", cursor: idx === 0 ? "default" : "pointer", fontSize: 14, padding: "2px 4px" }}>
                        ▲
                      </button>
                    );
                    const moveDown = (
                      <button type="button" disabled={idx === arr.length - 1} onClick={() => {
                        const ni = [...arr]; [ni[idx], ni[idx + 1]] = [ni[idx + 1], ni[idx]]; updateItems(ni);
                      }} style={{ background: "none", border: "none", color: idx === arr.length - 1 ? "var(--txt-muted)" : "var(--txt-sec)", cursor: idx === arr.length - 1 ? "default" : "pointer", fontSize: 14, padding: "2px 4px" }}>
                        ▼
                      </button>
                    );

                    if (isHeader) {
                      return (
                        <div key={item.key} style={{
                          display: "flex", alignItems: "center", gap: 6, padding: "6px 10px",
                          borderRadius: 6, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)",
                          opacity: isHidden ? 0.5 : 1,
                        }}>
                          {toggleBtn}
                          <input
                            type="text"
                            value={item.text || ""}
                            onChange={(e) => {
                              const ni = [...arr]; ni[idx] = { ...item, text: e.target.value }; updateItems(ni);
                            }}
                            style={{
                              flex: 1, fontSize: 12, fontWeight: 700, color: "var(--txt)",
                              background: "transparent", border: "1px solid transparent", borderRadius: 4,
                              outline: "none", padding: "2px 6px",
                              textTransform: "uppercase", letterSpacing: "0.04em",
                            }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = "transparent"; }}
                            placeholder="Naglowek..."
                            disabled={readOnly}
                          />
                          {moveUp}{moveDown}
                          <button type="button" onClick={() => { updateItems(arr.filter((_, i) => i !== idx)); }}
                            style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer", fontSize: 16, padding: "2px 4px", lineHeight: 1 }}
                            title="Usun naglowek"
                          >×</button>
                        </div>
                      );
                    }

                    return (
                      <div key={item.key} style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "6px 10px",
                        borderRadius: 6, background: "var(--surface-2)", opacity: isHidden ? 0.5 : 1,
                      }}>
                        {toggleBtn}
                        <span style={{ fontSize: 12, color: "var(--txt-sec)", flex: 1 }}>{FIELD_LABELS[item.key] || item.key}</span>
                        {moveUp}{moveDown}
                      </div>
                    );
                  });
                })()}
              </div>
              <button
                type="button"
                onClick={() => {
                  const items = computeDisplayItems(vcard);
                  items.push({ type: "header", key: `h-${Date.now()}`, text: "", visible: true });
                  setVcard({ ...vcard, displayItems: items });
                }}
                disabled={readOnly}
                style={{
                  marginTop: 8, width: "100%", padding: "8px", borderRadius: 6,
                  border: "1px dashed var(--border-hover, #444)", background: "transparent",
                  color: "var(--txt-muted)", fontSize: 11, cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                + Dodaj naglowek
              </button>
            </div>
          )}
        </div>

        {/* ── DATA SECTIONS ── */}
        {SECTIONS.map((sec) => {
          const isCollapsible = sec.collapsed;

          if (isCollapsible) {
            return (
              <div key={sec.title} style={{ marginBottom: 16 }}>
                <button
                  onClick={() => setSocialOpen(!socialOpen)}
                  style={styles.collapseBtn}
                >
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
                    style={{
                      transform: socialOpen ? "rotate(90deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  <span>{sec.icon} {sec.title}</span>
                  <span style={styles.collapseBadge}>{sec.fields.length} pol</span>
                </button>

                {socialOpen && (
                  <div style={styles.fieldGrid}>
                    {sec.fields.map((f) => (
                      <div key={f.key} style={styles.field}>
                        <label style={styles.label}>{f.label}</label>
                        <input
                          style={styles.input}
                          type={f.type || "text"}
                          value={(vcard as unknown as Record<string, string>)[f.key] || ""}
                          onChange={(e) => updateField(f.key, e.target.value)}
                          placeholder={f.placeholder || ""}
                          disabled={readOnly}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          /* Note field gets a textarea */
          if (sec.title === "Notatka") {
            return (
              <div key={sec.title} style={{ marginBottom: 16 }}>
                <div style={styles.subsectionTitle}>{sec.icon} {sec.title}</div>
                <textarea
                  style={{ ...styles.input, minHeight: 70, resize: "vertical" as const, width: "100%" }}
                  value={vcard.note || ""}
                  onChange={(e) => updateField("note", e.target.value)}
                  placeholder="Dodatkowe informacje..."
                  disabled={readOnly}
                />
              </div>
            );
          }

          return (
            <div key={sec.title} style={{ marginBottom: 16 }}>
              <div style={styles.subsectionTitle}>{sec.icon} {sec.title}</div>
              <div style={styles.fieldGrid}>
                {sec.fields.map((f) => {
                  /* Special: website field with logo upload */
                  if (f.key === "website") {
                    return (
                      <div key={f.key} style={{ ...styles.field, gridColumn: "1 / -1" }}>
                        <label style={styles.label}>{f.label}</label>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input
                            style={{ ...styles.input, flex: 1 }}
                            type={f.type || "text"}
                            value={(vcard as unknown as Record<string, string>)[f.key] || ""}
                            onChange={(e) => updateField(f.key, e.target.value)}
                            placeholder={f.placeholder || ""}
                            disabled={readOnly}
                          />
                          <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoSelect}
                            style={{ display: "none" }}
                            disabled={readOnly}
                          />
                          {vcard.websiteLogo ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={photoSrc(vcard.websiteLogo)}
                                alt="logo"
                                style={{ width: 36, height: 36, borderRadius: 8, objectFit: "contain", border: "1px solid var(--surface-2)", background: "var(--surface-2)", cursor: "pointer" }}
                                onClick={() => !readOnly && logoInputRef.current?.click()}
                              />
                              <button
                                type="button"
                                onClick={() => setVcard({ ...vcard, websiteLogo: "" })}
                                style={{ background: "none", border: "none", color: "var(--error)", fontSize: 14, cursor: "pointer", padding: 4, lineHeight: 1 }}
                                title="Usun logo"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => !readOnly && logoInputRef.current?.click()}
                              disabled={readOnly || logoUploading}
                              style={{
                                padding: "8px 12px", borderRadius: 8,
                                border: "1px dashed var(--border-hover)",
                                background: "var(--surface-2)", color: "var(--txt-muted)",
                                fontSize: 11, cursor: "pointer", whiteSpace: "nowrap",
                                opacity: logoUploading ? 0.5 : 1,
                              }}
                              title="Wgraj logo strony"
                            >
                              {logoUploading ? "..." : "Logo"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={f.key} style={styles.field}>
                      <label style={styles.label}>
                        {f.label}
                        {f.required && <span style={{ color: "var(--error)" }}> *</span>}
                      </label>
                      <input
                        style={styles.input}
                        type={f.type || "text"}
                        value={(vcard as unknown as Record<string, string>)[f.key] || ""}
                        onChange={(e) => updateField(f.key, e.target.value)}
                        placeholder={f.placeholder || ""}
                        disabled={readOnly}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── IMAGE CROPPER MODAL ── */}
      {cropFile && (
        <ImageCropper
          file={cropFile}
          onCrop={handleCroppedUpload}
          onCancel={() => setCropFile(null)}
        />
      )}
    </>
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
  subsectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "var(--txt-muted)",
    marginBottom: 10,
  },
  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--txt-sec)",
  },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--surface-2)",
    background: "var(--surface-2)",
    color: "var(--txt)",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box" as const,
  },
  collapseBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--surface-2)",
    background: "var(--surface-2)",
    color: "var(--txt-sec)",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    cursor: "pointer",
    width: "100%",
    transition: "all 0.15s",
    marginBottom: 8,
  },
  collapseBadge: {
    marginLeft: "auto",
    fontSize: 11,
    fontWeight: 500,
    color: "var(--txt-muted)",
    textTransform: "none" as const,
    letterSpacing: 0,
  },
  error: {
    fontSize: 12,
    color: "var(--error)",
    fontWeight: 500,
  },
  /* Photo styles */
  photoSection: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    marginBottom: 20,
    gap: 4,
  },
  photoWrapper: {
    width: 100,
    height: 100,
    borderRadius: "50%",
    cursor: "pointer",
    overflow: "hidden",
    position: "relative" as const,
    border: "2px dashed var(--border-hover)",
    transition: "border-color 0.2s, transform 0.2s",
  },
  photoPreview: {
    width: "100%",
    height: "100%",
    position: "relative" as const,
  },
  photoOverlay: {
    position: "absolute" as const,
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.5)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 600,
    opacity: 0,
    transition: "opacity 0.2s",
    borderRadius: "50%",
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    color: "var(--txt-muted)",
    background: "var(--surface-2)",
  },
  photoRemoveBtn: {
    background: "none",
    border: "none",
    color: "var(--error)",
    fontSize: 11,
    cursor: "pointer",
    padding: "4px 8px",
    marginTop: 4,
  },
};
