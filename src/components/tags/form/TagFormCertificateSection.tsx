"use client";

/* ------------------------------------------------------------------ */
/*  TagFormCertificateSection — form dla tagType=certificate.          */
/*                                                                     */
/*  3 pod-sekcje:                                                      */
/*   1. Dzielo — tytul, artysta, rok, medium, wymiary, podloze         */
/*   2. Dokumentacja — zdjecia (1-5) + podpis + logo artysty           */
/*   3. Prezentacja — paleta + czcionka (wplywa na certyfikat web+PDF) */
/*                                                                     */
/*  Serial number generowany serverowo przy zapisie (widoczny read-    */
/*  only po zapisie w trybie edit). Data wydania auto=dzis, edytowalna.*/
/* ------------------------------------------------------------------ */

import React, { useState } from "react";
import type {
  CertificateData,
  PaintingMedium,
  PaintingSubstrate,
  CertificatePalette,
  CertificateFont,
} from "@/types/certificate";
import {
  MEDIUM_LABELS,
  SUBSTRATE_LABELS,
  PALETTE_LABELS,
  PALETTE_COLORS,
  FONT_LABELS,
} from "@/types/certificate";

interface Props {
  tagType: string;
  certificate: CertificateData;
  setCertificate: (c: CertificateData) => void;
  readOnly: boolean;
  errors: Record<string, string>;
  clearFieldError: (f: string) => void;
  tagId: string;
  mode: "create" | "edit";
}

const MAX_PHOTOS = 5;

export default function TagFormCertificateSection({
  tagType, certificate, setCertificate, readOnly, errors, clearFieldError, tagId, mode,
}: Props) {
  const [uploading, setUploading] = useState<null | "photo" | "signature" | "logo">(null);
  const [uploadError, setUploadError] = useState("");

  if (tagType !== "certificate") return null;

  const update = (patch: Partial<CertificateData>) => {
    setCertificate({ ...certificate, ...patch });
  };

  const uploadFile = async (file: File, purpose: "photo" | "signature" | "logo"): Promise<string | null> => {
    setUploadError("");
    setUploading(purpose);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("tagId", tagId || "new");
      fd.append("purpose", purpose);
      const res = await fetch("/api/certificate/photo/admin", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      return data.path as string;
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Blad uploadu");
      return null;
    } finally {
      setUploading(null);
    }
  };

  const handlePhotoAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (certificate.photos.length >= MAX_PHOTOS) {
      setUploadError(`Max ${MAX_PHOTOS} zdjec`);
      return;
    }
    const path = await uploadFile(file, "photo");
    if (path) update({ photos: [...certificate.photos, path] });
  };

  const handlePhotoRemove = (idx: number) => {
    update({ photos: certificate.photos.filter((_, i) => i !== idx) });
  };

  const handleSignature = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const path = await uploadFile(file, "signature");
    if (path) update({ signaturePhoto: path });
  };

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const path = await uploadFile(file, "logo");
    if (path) update({ artistLogo: path });
  };

  const palette = certificate.theme?.palette || "premium-ecru";
  const fontHeading = certificate.theme?.fontHeading || "playfair";

  return (
    <>
      {/* ========================================================== */}
      {/*  DZIELO — meta artystyczne                                 */}
      {/* ========================================================== */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Dzielo</h3>

        <div style={styles.grid2}>
          <Field label="Tytul dziela *" error={errors.certTitle}>
            <input
              style={styles.input}
              value={certificate.title}
              onChange={(e) => { update({ title: e.target.value }); clearFieldError("certTitle"); }}
              placeholder='np. "Jesien w Kazimierzu"'
              disabled={readOnly}
            />
          </Field>

          <Field label="Rok powstania *" error={errors.certYear}>
            <input
              type="number"
              style={styles.input}
              value={certificate.year}
              onChange={(e) => { update({ year: parseInt(e.target.value) || new Date().getFullYear() }); clearFieldError("certYear"); }}
              min={1800}
              max={new Date().getFullYear() + 1}
              disabled={readOnly}
            />
          </Field>

          <Field label="Imie artysty *" error={errors.certArtistFirst}>
            <input
              style={styles.input}
              value={certificate.artistFirstName}
              onChange={(e) => { update({ artistFirstName: e.target.value }); clearFieldError("certArtistFirst"); }}
              disabled={readOnly}
            />
          </Field>

          <Field label="Nazwisko artysty *" error={errors.certArtistLast}>
            <input
              style={styles.input}
              value={certificate.artistLastName}
              onChange={(e) => { update({ artistLastName: e.target.value }); clearFieldError("certArtistLast"); }}
              disabled={readOnly}
            />
          </Field>

          <Field label="Medium (technika)">
            <select
              style={styles.input}
              value={certificate.medium || ""}
              onChange={(e) => update({ medium: (e.target.value || undefined) as PaintingMedium | undefined })}
              disabled={readOnly}
            >
              <option value="">— wybierz —</option>
              {(Object.keys(MEDIUM_LABELS) as PaintingMedium[]).map((m) => (
                <option key={m} value={m}>{MEDIUM_LABELS[m]}</option>
              ))}
            </select>
          </Field>

          <Field label="Podloze">
            <select
              style={styles.input}
              value={certificate.substrate || ""}
              onChange={(e) => update({ substrate: (e.target.value || undefined) as PaintingSubstrate | undefined })}
              disabled={readOnly}
            >
              <option value="">— wybierz —</option>
              {(Object.keys(SUBSTRATE_LABELS) as PaintingSubstrate[]).map((s) => (
                <option key={s} value={s}>{SUBSTRATE_LABELS[s]}</option>
              ))}
            </select>
          </Field>

          <Field label="Doprecyzowanie techniki (opcjonalne)" wide>
            <input
              style={styles.input}
              value={certificate.mediumDetails || ""}
              onChange={(e) => update({ mediumDetails: e.target.value })}
              placeholder='np. "olej na plotnie, laserunki, dodatek zlotego listka"'
              disabled={readOnly}
            />
          </Field>

          <Field label="Szerokosc (cm)">
            <input
              type="number"
              style={styles.input}
              value={certificate.dimensionsW ?? ""}
              onChange={(e) => update({ dimensionsW: e.target.value ? parseFloat(e.target.value) : undefined })}
              step={0.1}
              min={0}
              disabled={readOnly}
            />
          </Field>

          <Field label="Wysokosc (cm)">
            <input
              type="number"
              style={styles.input}
              value={certificate.dimensionsH ?? ""}
              onChange={(e) => update({ dimensionsH: e.target.value ? parseFloat(e.target.value) : undefined })}
              step={0.1}
              min={0}
              disabled={readOnly}
            />
          </Field>

          <Field label="Glebokosc / blejtram (cm, opcjonalne)">
            <input
              type="number"
              style={styles.input}
              value={certificate.dimensionsD ?? ""}
              onChange={(e) => update({ dimensionsD: e.target.value ? parseFloat(e.target.value) : undefined })}
              step={0.1}
              min={0}
              disabled={readOnly}
            />
          </Field>
        </div>

        <Field label="Opis / komentarz artystyczny (opcjonalne)" wide>
          <textarea
            style={{ ...styles.input, minHeight: 80, resize: "vertical" }}
            value={certificate.description || ""}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Kilka zdan o dziele, kontekst, inspiracja, technika szczegolowo..."
            disabled={readOnly}
          />
        </Field>
      </div>

      {/* ========================================================== */}
      {/*  DOKUMENTACJA — zdjecia, podpis, logo                      */}
      {/* ========================================================== */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Dokumentacja wizualna</h3>

        {/* Zdjecia pracy (1-5) */}
        <div style={{ marginBottom: 20 }}>
          <div style={styles.fieldLabel}>
            Zdjecia dziela * ({certificate.photos.length}/{MAX_PHOTOS})
            <span style={styles.fieldHint}>Pierwsze zdjecie = glowne (hero). Pozostale = detale.</span>
          </div>
          <div style={styles.photoGrid}>
            {certificate.photos.map((p, idx) => (
              <div key={idx} style={styles.photoBox}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt={`Zdjecie ${idx + 1}`} style={styles.photoImg} />
                <div style={styles.photoIdx}>{idx + 1}</div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handlePhotoRemove(idx)}
                    style={styles.photoRemove}
                    title="Usun"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {!readOnly && certificate.photos.length < MAX_PHOTOS && (
              <label style={{
                ...styles.photoBox,
                ...styles.photoAdd,
                pointerEvents: uploading === "photo" ? "none" : "auto",
                opacity: uploading === "photo" ? 0.6 : 1,
              }}>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoAdd} style={{ display: "none" }} />
                <div style={{ fontSize: 28, color: "var(--txt-muted)" }}>+</div>
                <div style={{ fontSize: 10, color: "var(--txt-muted)", marginTop: 2 }}>
                  {uploading === "photo" ? "Uploading..." : "Dodaj zdjecie"}
                </div>
              </label>
            )}
          </div>
          {errors.certPhotos && <div style={styles.error}>{errors.certPhotos}</div>}
        </div>

        {/* Podpis + Logo artysty */}
        <div style={styles.grid2}>
          <div>
            <div style={styles.fieldLabel}>
              Skan podpisu artysty
              <span style={styles.fieldHint}>JPG/PNG — pojawi sie na dole certyfikatu</span>
            </div>
            {certificate.signaturePhoto ? (
              <div style={styles.smallPhotoBox}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={certificate.signaturePhoto} alt="Podpis" style={{ maxWidth: "100%", maxHeight: 80 }} />
                {!readOnly && (
                  <button type="button" onClick={() => update({ signaturePhoto: undefined })} style={styles.photoRemove}>×</button>
                )}
              </div>
            ) : !readOnly && (
              <label style={{ ...styles.smallPhotoBox, ...styles.photoAdd, opacity: uploading === "signature" ? 0.6 : 1 }}>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleSignature} style={{ display: "none" }} />
                <div style={{ fontSize: 11, color: "var(--txt-muted)" }}>
                  {uploading === "signature" ? "Uploading..." : "Dodaj podpis"}
                </div>
              </label>
            )}
          </div>

          <div>
            <div style={styles.fieldLabel}>
              Logo / monogram artysty
              <span style={styles.fieldHint}>Opcjonalne — drobny branding na certyfikacie</span>
            </div>
            {certificate.artistLogo ? (
              <div style={styles.smallPhotoBox}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={certificate.artistLogo} alt="Logo" style={{ maxWidth: "100%", maxHeight: 80 }} />
                {!readOnly && (
                  <button type="button" onClick={() => update({ artistLogo: undefined })} style={styles.photoRemove}>×</button>
                )}
              </div>
            ) : !readOnly && (
              <label style={{ ...styles.smallPhotoBox, ...styles.photoAdd, opacity: uploading === "logo" ? 0.6 : 1 }}>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" onChange={handleLogo} style={{ display: "none" }} />
                <div style={{ fontSize: 11, color: "var(--txt-muted)" }}>
                  {uploading === "logo" ? "Uploading..." : "Dodaj logo"}
                </div>
              </label>
            )}
          </div>
        </div>

        {uploadError && <div style={styles.error}>{uploadError}</div>}
      </div>

      {/* ========================================================== */}
      {/*  PREZENTACJA — paleta + font                               */}
      {/* ========================================================== */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Prezentacja certyfikatu</h3>

        <Field label="Paleta kolorow" wide>
          <div style={styles.paletteGrid}>
            {(Object.keys(PALETTE_LABELS) as CertificatePalette[]).map((p) => {
              const colors = PALETTE_COLORS[p];
              const selected = palette === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => update({ theme: { ...certificate.theme, palette: p } })}
                  disabled={readOnly}
                  style={{
                    ...styles.paletteBox,
                    borderColor: selected ? colors.accent : "var(--surface-2)",
                    background: colors.bg,
                    color: colors.fg,
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%",
                    background: colors.accent, border: `2px solid ${colors.fg}`,
                    margin: "0 auto 6px",
                  }} />
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{PALETTE_LABELS[p]}</div>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Czcionka naglowkow" wide>
          <div style={styles.fontGrid}>
            {(Object.keys(FONT_LABELS) as CertificateFont[]).map((f) => {
              const selected = fontHeading === f;
              const fontStack = f === "playfair"
                ? "'Playfair Display', Georgia, serif"
                : f === "cormorant"
                  ? "'Cormorant Garamond', Georgia, serif"
                  : "'Inter', system-ui, sans-serif";
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => update({ theme: { ...certificate.theme, fontHeading: f } })}
                  disabled={readOnly}
                  style={{
                    ...styles.fontBox,
                    borderColor: selected ? "var(--accent)" : "var(--surface-2)",
                    fontFamily: fontStack,
                  }}
                >
                  <div style={{ fontSize: 18, lineHeight: 1 }}>Aa</div>
                  <div style={{ fontSize: 10, color: "var(--txt-muted)", marginTop: 4 }}>{FONT_LABELS[f]}</div>
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      {/* ========================================================== */}
      {/*  META certyfikatu — numer seryjny, data                    */}
      {/* ========================================================== */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Metadata certyfikatu</h3>

        <div style={styles.grid2}>
          <Field label="Numer seryjny (auto)" >
            <div style={{ ...styles.input, background: "var(--surface-2)", color: "var(--accent-light)", fontFamily: "var(--font-mono, monospace)" }}>
              {certificate.serialNumber || (mode === "create" ? "(generowany przy zapisie)" : "—")}
            </div>
          </Field>

          <Field label="Data wydania">
            <input
              type="date"
              style={styles.input}
              value={certificate.issueDate}
              onChange={(e) => update({ issueDate: e.target.value })}
              disabled={readOnly}
            />
          </Field>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper component for label + error                                 */
/* ------------------------------------------------------------------ */

function Field({ label, error, children, wide }: { label: string; error?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ gridColumn: wide ? "1 / -1" : undefined }}>
      <div style={styles.fieldLabel}>{label}</div>
      {children}
      {error && <div style={styles.error}>{error}</div>}
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
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--txt-sec)",
    marginBottom: 16,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--txt)",
    marginBottom: 6,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  fieldHint: {
    fontSize: 11,
    color: "var(--txt-muted)",
    fontWeight: 400,
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
    boxSizing: "border-box",
  },
  error: {
    fontSize: 12,
    color: "var(--error)",
    fontWeight: 500,
    marginTop: 4,
  },
  photoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: 10,
  },
  photoBox: {
    position: "relative",
    aspectRatio: "1/1",
    borderRadius: 8,
    border: "1px solid var(--surface-2)",
    overflow: "hidden",
    background: "var(--surface-2)",
  },
  photoImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  photoIdx: {
    position: "absolute",
    top: 4,
    left: 4,
    padding: "2px 8px",
    borderRadius: 10,
    background: "rgba(0,0,0,0.7)",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
  },
  photoRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.7)",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontSize: 16,
    lineHeight: 1,
    padding: 0,
  },
  photoAdd: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "border-color 0.15s",
  },
  smallPhotoBox: {
    position: "relative",
    minHeight: 90,
    padding: 12,
    borderRadius: 8,
    border: "1px dashed var(--surface-2)",
    background: "var(--surface-2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  paletteGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 10,
  },
  paletteBox: {
    padding: 14,
    borderRadius: 8,
    border: "2px solid",
    cursor: "pointer",
    transition: "all 0.15s",
    textAlign: "center",
  },
  fontGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
    gap: 10,
  },
  fontBox: {
    padding: "14px 10px",
    borderRadius: 8,
    border: "2px solid",
    background: "var(--surface-2)",
    color: "var(--txt)",
    cursor: "pointer",
    transition: "all 0.15s",
    textAlign: "center",
  },
};
