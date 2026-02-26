"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  tagId: string;
  tagType: string;
  channel: "nfc" | "qr" | "both";
}

export default function TagFormSuccessScreen({ tagId, tagType, channel }: Props) {
  const router = useRouter();
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/s/${tagId}`;

  const handleDownloadQR = async (format: "png" | "svg" | "pdf") => {
    setDownloadingFormat(format);
    try {
      const res = await fetch(
        `/api/qr?tagId=${encodeURIComponent(tagId)}&format=${format}&channel=${channel}`
      );
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tagId}-qr.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Success icon */}
      <div style={styles.iconWrap}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>

      <h2 style={styles.title}>Akcja utworzona!</h2>
      <p style={styles.subtitle}>
        Tag <span style={{ color: "#2ee8c0", fontWeight: 700 }}>{tagId}</span> jest gotowy do uzycia.
      </p>

      {/* Public URL */}
      <div style={styles.urlBox}>
        <span style={styles.urlLabel}>Link publiczny:</span>
        <code style={styles.urlCode}>{publicUrl}</code>
      </div>

      {/* QR Downloads */}
      <div style={styles.qrSection}>
        <div style={styles.qrTitle}>Pobierz kod QR</div>
        <div style={styles.qrGrid}>
          {([
            { format: "png" as const, label: "PNG 1024×1024", desc: "Dla web i druku" },
            { format: "svg" as const, label: "SVG (wektor)", desc: "Skalowalny" },
            { format: "pdf" as const, label: "PDF (druk)", desc: "Gotowy do druku" },
          ]).map((opt) => (
            <button
              key={opt.format}
              onClick={() => handleDownloadQR(opt.format)}
              disabled={!!downloadingFormat}
              style={{
                ...styles.qrBtn,
                opacity: downloadingFormat ? 0.5 : 1,
              }}
            >
              <div style={styles.qrBtnLabel}>
                {downloadingFormat === opt.format ? "Pobieranie..." : opt.label}
              </div>
              <div style={styles.qrBtnDesc}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <button
          onClick={() => router.push("/dashboard/tags/new")}
          style={styles.secondaryBtn}
        >
          Utworz kolejna akcje
        </button>
        <button
          onClick={() => {
            if (tagType === "vcard") {
              router.push(`/dashboard/tags/${tagId}/edit`);
            } else {
              router.push("/dashboard");
            }
          }}
          style={styles.primaryBtn}
        >
          {tagType === "vcard" ? "Edytuj wizytowke" : "Wroc do dashboardu"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    textAlign: "center" as const,
    padding: "48px 24px",
    maxWidth: 520,
    margin: "0 auto",
  },
  iconWrap: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    color: "#eaf0f6",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#8a92a4",
    marginBottom: 24,
  },
  urlBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "10px 16px",
    borderRadius: 10,
    background: "rgba(0,200,160,0.08)",
    border: "1px solid rgba(0,200,160,0.2)",
    marginBottom: 28,
  },
  urlLabel: {
    fontSize: 12,
    color: "#8a92a4",
  },
  urlCode: {
    fontSize: 13,
    color: "#2ee8c0",
    fontFamily: "monospace",
  },
  qrSection: {
    marginBottom: 28,
  },
  qrTitle: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "#8a92a4",
    marginBottom: 12,
  },
  qrGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
  },
  qrBtn: {
    padding: "14px 10px",
    borderRadius: 10,
    border: "1px solid #2a2e38",
    background: "#12151c",
    cursor: "pointer",
    transition: "all 0.15s",
    textAlign: "center" as const,
  },
  qrBtnLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#eaf0f6",
    marginBottom: 2,
  },
  qrBtnDesc: {
    fontSize: 11,
    color: "#555c6e",
  },
  actions: {
    display: "flex",
    gap: 10,
    justifyContent: "center",
  },
  secondaryBtn: {
    padding: "10px 20px",
    borderRadius: 8,
    border: "1px solid #2a2e38",
    background: "transparent",
    color: "#8a92a4",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  primaryBtn: {
    padding: "10px 24px",
    borderRadius: 8,
    border: "none",
    background: "#00c8a0",
    color: "#12151c",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.15s",
  },
};
