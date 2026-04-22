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
    title: "Dane osobowe / firmowe",
    icon: "\uD83D\uDC64",
    fields: [
      { key: "firstName", label: "Imie (opcjonalne jesli podasz firme)" },
      { key: "lastName", label: "Nazwisko (opcjonalne jesli podasz firme)" },
      { key: "company", label: "Firma (uzyta jako duzy naglowek gdy brak imienia)" },
      { key: "slogan", label: "Slogan / podtytul", placeholder: "np. Pobieranie krwi w domu lub pracy" },
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
  const [pdfUploadingKey, setPdfUploadingKey] = useState<string | null>(null);
  const [pdfProgress, setPdfProgress] = useState<number>(0);
  const [pdfErrorKey, setPdfErrorKey] = useState<{ key: string; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const pdfTargetItemKey = useRef<string | null>(null);

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

  /* -- Custom-link PDF upload -- */
  const triggerPdfPicker = (itemKey: string) => {
    pdfTargetItemKey.current = itemKey;
    pdfInputRef.current?.click();
  };

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const itemKey = pdfTargetItemKey.current;
    e.target.value = "";
    if (!file || !itemKey) return;

    if (file.type !== "application/pdf") {
      setPdfErrorKey({ key: itemKey, msg: "Dozwolony format: PDF" });
      setTimeout(() => setPdfErrorKey(null), 4000);
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setPdfErrorKey({ key: itemKey, msg: "Maksymalny rozmiar: 100MB" });
      setTimeout(() => setPdfErrorKey(null), 4000);
      return;
    }

    setPdfUploadingKey(itemKey);
    setPdfProgress(0);

    // Use XHR so we can report upload progress
    const formData = new FormData();
    formData.append("file", file);
    if (tagId) formData.append("tagId", tagId);
    formData.append("context", "catalog");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload/pdf/admin");

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setPdfProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };

    xhr.onload = () => {
      setPdfUploadingKey(null);
      pdfTargetItemKey.current = null;
      setPdfProgress(0);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const currentItems: DisplayItem[] = vcard.displayItems || [];
          const nextItems = currentItems.map((it) =>
            it.key === itemKey
              ? {
                  ...it,
                  url: data.path,
                  label: it.label && it.label.trim() !== "" ? it.label : "Katalog produktow",
                }
              : it
          );
          setVcard({ ...vcard, displayItems: nextItems });
        } catch {
          setPdfErrorKey({ key: itemKey, msg: "Bledna odpowiedz serwera" });
          setTimeout(() => setPdfErrorKey(null), 4000);
        }
      } else {
        let msg = `Upload nie powiodl sie (${xhr.status})`;
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.error) msg = data.error;
        } catch { /* ignore */ }
        setPdfErrorKey({ key: itemKey, msg });
        setTimeout(() => setPdfErrorKey(null), 4000);
      }
    };

    xhr.onerror = () => {
      setPdfUploadingKey(null);
      pdfTargetItemKey.current = null;
      setPdfProgress(0);
      setPdfErrorKey({ key: itemKey, msg: "Blad polaczenia" });
      setTimeout(() => setPdfErrorKey(null), 4000);
    };

    xhr.send(formData);
  };

  const initials = [vcard.firstName?.[0], vcard.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";

  return (
    <>
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Wizytowka</h3>

        {errors.vcard && <div style={{ ...styles.error, marginBottom: 12 }}>{errors.vcard}</div>}

        {/* ── PHOTO UPLOAD ── */}
        {/* Hidden PDF input (shared by all custom-link rows) */}
        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handlePdfSelect}
          style={{ display: "none" }}
          disabled={readOnly}
        />

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
              <p style={{ fontSize: 11, color: "var(--txt-muted)", marginBottom: 10, lineHeight: 1.5 }}>
                Kliknij nazwe aby ja zmienic. Dodaj wlasne linki lub naglowki.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {(() => {
                  const items = computeDisplayItems(vcard);
                  const updateItems = (newItems: DisplayItem[]) => setVcard({ ...vcard, displayItems: newItems });

                  const toggleBtn = (isHidden: boolean, onClick: () => void) => (
                    <button
                      type="button"
                      onClick={onClick}
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

                  const moveBtn = (label: string, disabled: boolean, onClick: () => void) => (
                    <button type="button" disabled={disabled} onClick={onClick}
                      style={{ background: "none", border: "none", color: disabled ? "var(--txt-muted)" : "var(--txt-sec)", cursor: disabled ? "default" : "pointer", fontSize: 14, padding: "2px 4px" }}>
                      {label}
                    </button>
                  );

                  const deleteBtn = (onClick: () => void, title: string) => (
                    <button type="button" onClick={onClick}
                      style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer", fontSize: 16, padding: "2px 4px", lineHeight: 1 }}
                      title={title}>×</button>
                  );

                  return items.map((item, idx, arr) => {
                    const isHidden = item.visible === false;

                    const onToggle = () => {
                      const ni = [...arr];
                      ni[idx] = { ...item, visible: isHidden };
                      updateItems(ni);
                    };
                    const onMoveUp = () => {
                      const ni = [...arr]; [ni[idx - 1], ni[idx]] = [ni[idx], ni[idx - 1]]; updateItems(ni);
                    };
                    const onMoveDown = () => {
                      const ni = [...arr]; [ni[idx], ni[idx + 1]] = [ni[idx + 1], ni[idx]]; updateItems(ni);
                    };
                    const onDelete = () => { updateItems(arr.filter((_, i) => i !== idx)); };

                    /* ---- HEADER ---- */
                    if (item.type === "header") {
                      return (
                        <div key={item.key} style={{
                          display: "flex", alignItems: "center", gap: 6, padding: "6px 10px",
                          borderRadius: 6, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)",
                          opacity: isHidden ? 0.5 : 1,
                        }}>
                          {toggleBtn(isHidden, onToggle)}
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
                          {moveBtn("▲", idx === 0, onMoveUp)}
                          {moveBtn("▼", idx === arr.length - 1, onMoveDown)}
                          {deleteBtn(onDelete, "Usun naglowek")}
                        </div>
                      );
                    }

                    /* ---- CUSTOM LINK ---- */
                    if (item.type === "custom-link") {
                      return (
                        <div key={item.key} style={{
                          display: "flex", flexDirection: "column", gap: 4, padding: "6px 10px",
                          borderRadius: 6, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.18)",
                          opacity: isHidden ? 0.5 : 1,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {toggleBtn(isHidden, onToggle)}
                            <input
                              type="text"
                              value={item.label || ""}
                              onChange={(e) => {
                                const ni = [...arr]; ni[idx] = { ...item, label: e.target.value }; updateItems(ni);
                              }}
                              style={{
                                flex: 1, fontSize: 12, fontWeight: 600, color: "var(--txt)",
                                background: "transparent", border: "1px solid transparent", borderRadius: 4,
                                outline: "none", padding: "2px 6px",
                              }}
                              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = "transparent"; }}
                              placeholder="Nazwa linku..."
                              disabled={readOnly}
                            />
                            {moveBtn("▲", idx === 0, onMoveUp)}
                            {moveBtn("▼", idx === arr.length - 1, onMoveDown)}
                            {deleteBtn(onDelete, "Usun link")}
                          </div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", paddingLeft: 40 }}>
                            <input
                              type="url"
                              value={item.url || ""}
                              onChange={(e) => {
                                const ni = [...arr]; ni[idx] = { ...item, url: e.target.value }; updateItems(ni);
                              }}
                              style={{
                                flex: 1, fontSize: 11, color: "var(--txt-sec)",
                                background: "var(--surface-2)", border: "1px solid var(--surface-2)", borderRadius: 4,
                                outline: "none", padding: "4px 8px",
                              }}
                              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--surface-2)"; }}
                              placeholder="https://... lub wgraj PDF"
                              disabled={readOnly}
                            />
                            {(() => {
                              const isPdf = !!item.url && item.url.startsWith("/api/uploads/") && item.url.toLowerCase().endsWith(".pdf");
                              const isUploadingThis = pdfUploadingKey === item.key;
                              const label = isUploadingThis
                                ? `Wgrywam... ${pdfProgress}%`
                                : isPdf
                                  ? "Zmien PDF"
                                  : "Wgraj PDF";
                              return (
                                <button
                                  type="button"
                                  onClick={() => !readOnly && !isUploadingThis && triggerPdfPicker(item.key)}
                                  disabled={readOnly || isUploadingThis}
                                  title={isPdf ? "Zmien plik PDF" : "Wgraj plik PDF z dysku"}
                                  style={{
                                    padding: "6px 10px",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    borderRadius: 6,
                                    border: "1px solid rgba(250,204,21,0.5)",
                                    background: isPdf
                                      ? "rgba(250,204,21,0.18)"
                                      : "rgba(250,204,21,0.08)",
                                    color: "#facc15",
                                    cursor: readOnly || isUploadingThis ? "not-allowed" : "pointer",
                                    whiteSpace: "nowrap",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    minWidth: isUploadingThis ? 110 : "auto",
                                  }}
                                >
                                  <span style={{ fontSize: 13, lineHeight: 1 }}>📄</span>
                                  <span>{label}</span>
                                </button>
                              );
                            })()}
                          </div>
                          {/* Progress bar while uploading this item */}
                          {pdfUploadingKey === item.key && (
                            <div style={{
                              paddingLeft: 40, paddingRight: 4, marginTop: 6,
                            }}>
                              <div style={{
                                height: 4, borderRadius: 2,
                                background: "rgba(250,204,21,0.15)",
                                overflow: "hidden",
                              }}>
                                <div style={{
                                  width: `${pdfProgress}%`,
                                  height: "100%",
                                  background: "#facc15",
                                  transition: "width 0.15s ease",
                                }} />
                              </div>
                            </div>
                          )}
                          {/* Uploaded file hint */}
                          {item.url && item.url.startsWith("/api/uploads/") && item.url.toLowerCase().endsWith(".pdf") && pdfUploadingKey !== item.key && (
                            <div style={{
                              paddingLeft: 40, fontSize: 10, color: "var(--txt-muted)",
                              display: "flex", alignItems: "center", gap: 6, marginTop: 2,
                            }}>
                              <span>📄 {item.url.split("/").pop()}</span>
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "#facc15", textDecoration: "underline" }}
                              >
                                podglad
                              </a>
                            </div>
                          )}
                          {pdfErrorKey && pdfErrorKey.key === item.key && (
                            <div style={{ fontSize: 11, color: "var(--error)", paddingLeft: 40, marginTop: 4 }}>
                              {pdfErrorKey.msg}
                            </div>
                          )}
                        </div>
                      );
                    }

                    /* ---- FIELD ---- */
                    const useLabel = item.showLabel !== undefined ? item.showLabel : true;
                    const rawValue = (vcard as unknown as Record<string, string>)[item.key] || "";
                    const onToggleMode = () => {
                      const ni = [...arr]; ni[idx] = { ...item, showLabel: !useLabel }; updateItems(ni);
                    };
                    return (
                      <div key={item.key} style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "6px 10px",
                        borderRadius: 6, background: "var(--surface-2)", opacity: isHidden ? 0.5 : 1,
                      }}>
                        {toggleBtn(isHidden, onToggle)}
                        {useLabel ? (
                          <input
                            type="text"
                            value={item.label ?? FIELD_LABELS[item.key] ?? item.key}
                            onChange={(e) => {
                              const ni = [...arr]; ni[idx] = { ...item, label: e.target.value }; updateItems(ni);
                            }}
                            style={{
                              flex: 1, fontSize: 12, fontWeight: 500, color: "var(--txt-sec)",
                              background: "transparent", border: "1px solid transparent", borderRadius: 4,
                              outline: "none", padding: "2px 6px",
                            }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = "transparent"; }}
                            disabled={readOnly}
                          />
                        ) : (
                          <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: "var(--txt-muted)", padding: "2px 6px", fontStyle: "italic" }}>
                            {rawValue || FIELD_LABELS[item.key]}
                          </span>
                        )}
                        <button type="button" onClick={onToggleMode} title={useLabel ? "Pokazuje etykiete — kliknij aby pokazac wartosc" : "Pokazuje wartosc — kliknij aby pokazac etykiete"}
                          style={{
                            fontSize: 9, padding: "2px 6px", borderRadius: 4, cursor: "pointer",
                            background: useLabel ? "var(--accent)" : "transparent",
                            color: useLabel ? "#fff" : "var(--txt-muted)",
                            border: useLabel ? "1px solid var(--accent)" : "1px solid var(--surface-2)",
                            fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0,
                            transition: "all 0.15s",
                          }}
                        >
                          {useLabel ? "Aa" : "123"}
                        </button>
                        {moveBtn("▲", idx === 0, onMoveUp)}
                        {moveBtn("▼", idx === arr.length - 1, onMoveDown)}
                      </div>
                    );
                  });
                })()}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    const items = computeDisplayItems(vcard);
                    items.push({ type: "header", key: `h-${Date.now()}`, text: "", visible: true });
                    setVcard({ ...vcard, displayItems: items });
                  }}
                  disabled={readOnly}
                  style={{
                    flex: 1, padding: "8px", borderRadius: 6,
                    border: "1px dashed var(--border-hover, #444)", background: "transparent",
                    color: "var(--txt-muted)", fontSize: 11, cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  + Naglowek
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const items = computeDisplayItems(vcard);
                    items.push({ type: "custom-link", key: `cl-${Date.now()}`, label: "", url: "", visible: true });
                    setVcard({ ...vcard, displayItems: items });
                  }}
                  disabled={readOnly}
                  style={{
                    flex: 1, padding: "8px", borderRadius: 6,
                    border: "1px dashed rgba(16,185,129,0.4)", background: "transparent",
                    color: "rgba(16,185,129,0.8)", fontSize: 11, cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  + Link
                </button>
              </div>
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
