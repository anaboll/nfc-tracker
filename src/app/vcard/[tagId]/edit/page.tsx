"use client";

import React, { useState, useEffect } from "react";
import type { VCardData, VCardTheme } from "@/types/vcard";
import { DEFAULT_VCARD_THEME } from "@/types/vcard";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import VCardLivePreview from "@/components/vcard/VCardLivePreview";
import ThemeEditor from "@/components/vcard/ThemeEditor";
import ImageCropper from "@/components/ui/ImageCropper";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Normalize photo path: old "/uploads/x" → "/api/uploads/x" */
function photoSrc(photo: string | undefined | null): string {
  if (!photo) return "";
  if (photo.startsWith("/api/uploads/")) return photo;
  if (photo.startsWith("/uploads/")) return `/api${photo}`;
  return photo;
}

/* ------------------------------------------------------------------ */
/*  Field config                                                       */
/* ------------------------------------------------------------------ */

interface FieldDef {
  key: string;
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}

const SECTIONS: { title: string; fields: FieldDef[] }[] = [
  {
    title: "Dane osobowe",
    fields: [
      { key: "firstName", label: "Imie", required: true },
      { key: "lastName", label: "Nazwisko", required: true },
      { key: "company", label: "Firma" },
      { key: "jobTitle", label: "Stanowisko" },
    ],
  },
  {
    title: "Kontakt",
    fields: [
      { key: "phone", label: "Telefon", type: "tel" },
      { key: "email", label: "Email", type: "email" },
      { key: "website", label: "Strona WWW", type: "url" },
      { key: "address", label: "Adres" },
    ],
  },
  {
    title: "Social Media",
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
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function VCardEditPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tagId = params.tagId as string;
  const token = searchParams.get("token") || "";
  const fromDashboard = searchParams.get("from") === "dashboard";

  const [vcard, setVcard] = useState<VCardData | null>(null);
  const [theme, setTheme] = useState<VCardTheme>({ ...DEFAULT_VCARD_THEME });
  const [tagName, setTagName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [socialExpanded, setSocialExpanded] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);

  /* -- Load vCard data -- */
  useEffect(() => {
    if (!tagId || !token) {
      setError("Brak dostepu — nieprawidlowy link.");
      setLoading(false);
      return;
    }
    fetch(`/api/vcard?tagId=${encodeURIComponent(tagId)}&token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Blad ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        const vcardData = data.vcard || {};
        setVcard(vcardData);
        if (vcardData.theme) {
          setTheme({ ...DEFAULT_VCARD_THEME, ...vcardData.theme });
        }
        setTagName(data.name || "");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tagId, token]);

  /* -- Save -- */
  const handleSave = async () => {
    if (!vcard) return;
    setSaving(true);
    setSaved(false);
    try {
      const payload = { ...vcard, theme };
      const res = await fetch(
        `/api/vcard?tagId=${encodeURIComponent(tagId)}&token=${encodeURIComponent(token)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Blad ${res.status}`);
      }
      setSaved(true);
      // If came from dashboard, redirect back after 1.5s
      if (fromDashboard) {
        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Blad zapisu";
      setError(msg);
      setTimeout(() => setError(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: string) => {
    if (!vcard) return;
    setVcard({ ...vcard, [key]: value });
  };

  /* -- Photo: open cropper when file selected -- */
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !vcard) return;
    // Reset input so re-selecting same file triggers onChange
    e.target.value = "";
    if (!file.type.startsWith("image/")) {
      setError("Dozwolone tylko pliki graficzne");
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Maksymalny rozmiar zdjecia to 10MB");
      setTimeout(() => setError(null), 3000);
      return;
    }
    setCropFile(file);
  };

  /* -- Photo: upload after crop -- */
  const handleCroppedUpload = async (blob: Blob) => {
    setCropFile(null);
    if (!vcard) return;

    const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tagId", tagId);
    formData.append("token", token);

    try {
      const res = await fetch("/api/vcard/photo", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setVcard({ ...vcard, photo: data.path });
    } catch {
      setError("Nie udalo sie wgrac zdjecia");
      setTimeout(() => setError(null), 3000);
    }
  };

  /* -- Loading / Error states -- */
  if (loading) {
    return (
      <div className="vcard-edit-page">
        <div className="vcard-edit-loading">Ladowanie...</div>
      </div>
    );
  }

  if (error && !vcard) {
    return (
      <div className="vcard-edit-page">
        <div className="vcard-edit-error-screen">
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#128274;</div>
          <h1>Brak dostepu</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!vcard) return null;

  /* -- Build merged vcard for preview -- */
  const previewVcard: VCardData = { ...vcard };

  return (
    <div className="vcard-edit-page">
      <div className="vcard-edit-layout">
        {/* LEFT: Edit Form */}
        <div className="vcard-edit-form-col">
          {/* Back to dashboard button */}
          {fromDashboard && (
            <button
              type="button"
              className="vcard-edit-back-btn"
              onClick={() => router.push("/dashboard")}
            >
              &larr; Wroc do panelu
            </button>
          )}

          {/* Header */}
          <div className="vcard-edit-header">
            <span className="vcard-edit-header-sub">Edycja wizytowki</span>
            <h1 className="vcard-edit-header-title">
              {vcard.firstName || ""} {vcard.lastName || ""}
            </h1>
            {tagName && <span className="vcard-edit-header-tag">{tagName}</span>}
          </div>

          {/* Photo upload */}
          <div className="vcard-edit-photo-section">
            <label className="vcard-edit-photo-label">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                style={{ display: "none" }}
              />
              {vcard.photo ? (
                <div className="vcard-edit-photo-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoSrc(vcard.photo)}
                    alt=""
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="vcard-edit-photo-overlay">Zmien</div>
                </div>
              ) : (
                <div className="vcard-edit-photo-placeholder">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>Dodaj zdjecie</span>
                </div>
              )}
            </label>
            {vcard.photo && (
              <button
                type="button"
                className="vcard-edit-photo-remove"
                onClick={() => setVcard({ ...vcard, photo: "" })}
              >
                Usun zdjecie
              </button>
            )}
          </div>

          {/* Data Sections */}
          {SECTIONS.map((section, sIdx) => {
            const isSocial = section.title === "Social Media";
            if (isSocial && !socialExpanded) {
              return (
                <div key={section.title} className="vcard-edit-section">
                  <button
                    type="button"
                    className="vcard-edit-section-toggle"
                    onClick={() => setSocialExpanded(true)}
                  >
                    <h2 className="vcard-edit-section-title">{section.title}</h2>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </div>
              );
            }

            return (
              <div key={section.title} className="vcard-edit-section">
                {isSocial ? (
                  <button
                    type="button"
                    className="vcard-edit-section-toggle"
                    onClick={() => setSocialExpanded(false)}
                  >
                    <h2 className="vcard-edit-section-title">{section.title}</h2>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ transform: "rotate(180deg)" }}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                ) : (
                  <h2 className="vcard-edit-section-title">{section.title}</h2>
                )}
                <div className={`vcard-edit-fields ${sIdx === 0 ? "vcard-edit-fields--2col" : ""}`}>
                  {section.fields.map((field) => (
                    <div key={field.key} className="vcard-edit-field">
                      <label className="vcard-edit-label">
                        {field.label}
                        {field.required && <span className="vcard-edit-required"> *</span>}
                      </label>
                      <input
                        className="vcard-edit-input"
                        type={field.type || "text"}
                        value={(vcard as unknown as Record<string, string>)[field.key] || ""}
                        onChange={(e) => updateField(field.key, e.target.value)}
                        placeholder={field.placeholder || ""}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Note */}
          <div className="vcard-edit-section">
            <h2 className="vcard-edit-section-title">Notatka</h2>
            <textarea
              className="vcard-edit-input vcard-edit-textarea"
              value={vcard.note || ""}
              onChange={(e) => updateField("note", e.target.value)}
              placeholder="Dodatkowe informacje..."
              rows={3}
            />
          </div>

          {/* Theme Editor */}
          <div className="vcard-edit-section">
            <h2 className="vcard-edit-section-title" style={{ marginBottom: 0 }}>Motyw wizytowki</h2>
            <ThemeEditor theme={theme} onChange={setTheme} />
          </div>

          {/* Error / Success toasts */}
          {error && (
            <div className="vcard-edit-toast vcard-edit-toast--error">{error}</div>
          )}
          {saved && (
            <div className="vcard-edit-toast vcard-edit-toast--success">&#10003; Zmiany zapisane!</div>
          )}

          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="vcard-edit-save-btn"
          >
            {saving ? "Zapisywanie..." : "Zapisz zmiany"}
          </button>

          {/* Preview link */}
          <div className="vcard-edit-preview-link">
            <a href={`/vcard/${tagId}`} target="_blank" rel="noopener noreferrer">
              Otworz wizytowke &rarr;
            </a>
          </div>

          {/* Footer */}
          <div className="vcard-edit-footer">
            Powered by TwojeNFC.pl
          </div>
        </div>

        {/* RIGHT: Live Preview */}
        <VCardLivePreview vcard={previewVcard} theme={theme} />
      </div>

      {/* Image Cropper Modal */}
      {cropFile && (
        <ImageCropper
          file={cropFile}
          onCrop={handleCroppedUpload}
          onCancel={() => setCropFile(null)}
        />
      )}
    </div>
  );
}
