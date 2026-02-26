"use client";

import React, { useState, useEffect } from "react";
import type { VCardData } from "@/types/vcard";
import { useParams, useSearchParams } from "next/navigation";

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
  const tagId = params.tagId as string;
  const token = searchParams.get("token") || "";

  const [vcard, setVcard] = useState<VCardData | null>(null);
  const [tagName, setTagName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
        setVcard(data.vcard || {});
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
      const res = await fetch(`/api/vcard?tagId=${encodeURIComponent(tagId)}&token=${encodeURIComponent(token)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vcard),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Blad ${res.status}`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
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

  /* -- Loading / Error states -- */
  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>Ladowanie...</div>
        </div>
      </div>
    );
  }

  if (error && !vcard) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#12151c", marginBottom: 8 }}>Brak dostepu</h1>
            <p style={{ color: "#666", fontSize: 14 }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!vcard) return null;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>Edycja wizytowki</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#12151c" }}>
            {vcard.firstName || ""} {vcard.lastName || ""}
          </h1>
          {tagName && (
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>{tagName}</div>
          )}
        </div>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <div key={section.title} style={{ marginBottom: 28 }}>
            <h2 style={styles.sectionTitle}>{section.title}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {section.fields.map((field) => (
                <div key={field.key}>
                  <label style={styles.label}>
                    {field.label}
                    {field.required && <span style={{ color: "#e63946" }}> *</span>}
                  </label>
                  <input
                    style={styles.input}
                    type={field.type || "text"}
                    value={(vcard as unknown as Record<string, string>)[field.key] || ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={field.placeholder || ""}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Note */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={styles.sectionTitle}>Notatka</h2>
          <textarea
            style={{ ...styles.input, minHeight: 80, resize: "vertical" }}
            value={vcard.note || ""}
            onChange={(e) => updateField("note", e.target.value)}
            placeholder="Dodatkowe informacje..."
          />
        </div>

        {/* Error/Success toast */}
        {error && (
          <div style={{ padding: "10px 16px", borderRadius: 10, background: "#fee2e2", color: "#b91c1c", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
            {error}
          </div>
        )}
        {saved && (
          <div style={{ padding: "10px 16px", borderRadius: 10, background: "#dcfce7", color: "#166534", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
            ✓ Zmiany zapisane!
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: 12,
            border: "none",
            background: saving ? "#a78bfa" : "#7c3aed",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor: saving ? "wait" : "pointer",
            transition: "background 0.2s",
            marginBottom: 16,
          }}
        >
          {saving ? "Zapisywanie..." : "Zapisz zmiany"}
        </button>

        {/* Preview link */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <a
            href={`/vcard/${tagId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 13, color: "#7c3aed", textDecoration: "none", fontWeight: 500 }}
          >
            Podglad wizytowki →
          </a>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", paddingBottom: 16 }}>
          <p style={{ fontSize: 11, color: "#ccc" }}>
            Powered by TwojeNFC.pl
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles (light theme, mobile-first)                                 */
/* ------------------------------------------------------------------ */

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f7f7fb",
    display: "flex",
    justifyContent: "center",
    padding: "24px 16px",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  container: {
    width: "100%",
    maxWidth: 440,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "#999",
    marginBottom: 12,
    paddingLeft: 2,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#444",
    marginBottom: 4,
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: "1px solid #e0e0e8",
    fontSize: 14,
    color: "#12151c",
    background: "#fff",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box" as const,
  },
};
