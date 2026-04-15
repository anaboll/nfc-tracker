"use client";

import React, { useRef, useState } from "react";

interface Props {
  tagType: string;
  tagId: string;
  targetUrl: string;
  setTargetUrl: (v: string) => void;
  readOnly: boolean;
  errors: Record<string, string>;
  clearFieldError: (f: string) => void;
}

/**
 * Upload PDF for tag type "file". The uploaded path is stored as tag.targetUrl
 * so the /s/[tagId] redirect route forwards visitors to the PDF.
 */
export default function TagFormFileSection({
  tagType, tagId, targetUrl, setTargetUrl, readOnly, errors, clearFieldError,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);

  if (tagType !== "file") return null;

  const hasFile = !!targetUrl && targetUrl.startsWith("/api/uploads/");
  const filename = hasFile ? targetUrl.split("/").pop() || targetUrl : "";

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // allow re-picking same file later

    if (file.type !== "application/pdf") {
      setUploadError("Dozwolony format: PDF");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setUploadError("Maksymalny rozmiar: 100MB");
      return;
    }

    setUploadError(null);
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    if (tagId) formData.append("tagId", tagId);
    formData.append("context", "file");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload/pdf/admin");

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };

    xhr.onload = () => {
      setUploading(false);
      setProgress(0);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          setTargetUrl(data.path);
          setFileSize(data.size || file.size);
          clearFieldError("targetUrl");
        } catch {
          setUploadError("Bledna odpowiedz serwera");
        }
      } else {
        let msg = `Upload nie powiodl sie (${xhr.status})`;
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.error) msg = data.error;
        } catch { /* ignore */ }
        setUploadError(msg);
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setProgress(0);
      setUploadError("Blad polaczenia");
    };

    xhr.send(formData);
  };

  const formatSize = (bytes: number | null): string => {
    if (!bytes) return "";
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
  };

  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>Plik PDF</h3>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleUpload}
        style={{ display: "none" }}
        disabled={readOnly || uploading}
      />

      {!hasFile && (
        <>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={readOnly || uploading}
            style={{
              ...styles.uploadBtn,
              opacity: readOnly ? 0.5 : 1,
              cursor: readOnly || uploading ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? (
              <>
                <span style={styles.spinner} />
                <span>Wgrywam... {progress}%</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Wgraj PDF</span>
              </>
            )}
          </button>
          {uploading && (
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            </div>
          )}
        </>
      )}

      {hasFile && (
        <div style={styles.filePill}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.filename} title={filename}>{filename}</div>
            <div style={styles.fileMeta}>
              {fileSize ? `${formatSize(fileSize)} · ` : ""}
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.previewLink}
              >
                podglad
              </a>
            </div>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={styles.replaceBtn}
              title="Wgraj inny plik"
            >
              {uploading ? `${progress}%` : "Zmien"}
            </button>
          )}
        </div>
      )}
      {hasFile && uploading && (
        <div style={{ ...styles.progressTrack, marginTop: 8 }}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
      )}

      {uploadError && <div style={styles.error}>{uploadError}</div>}
      {errors.targetUrl && <div style={styles.error}>{errors.targetUrl}</div>}

      <div style={styles.hint}>
        Max 100 MB. Po zeskanowaniu tagu uzytkownik zostanie przekierowany bezposrednio do PDF-a.
      </div>
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
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "var(--txt-sec)",
    marginBottom: 12,
  },
  uploadBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 16px",
    borderRadius: 8,
    border: "1.5px dashed rgba(250,204,21,0.5)",
    background: "rgba(250,204,21,0.06)",
    color: "#facc15",
    fontSize: 13,
    fontWeight: 600,
    transition: "all 0.15s",
  },
  filePill: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 8,
    background: "rgba(250,204,21,0.06)",
    border: "1px solid rgba(250,204,21,0.25)",
  },
  filename: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--txt)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  fileMeta: {
    fontSize: 11,
    color: "var(--txt-sec)",
    marginTop: 2,
  },
  previewLink: {
    color: "#facc15",
    textDecoration: "underline",
  },
  replaceBtn: {
    padding: "6px 12px",
    borderRadius: 6,
    border: "1px solid var(--surface-2)",
    background: "var(--surface-2)",
    color: "var(--txt)",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    flexShrink: 0,
  },
  hint: {
    fontSize: 11,
    color: "var(--txt-muted)",
    marginTop: 10,
  },
  error: {
    fontSize: 12,
    color: "var(--error)",
    fontWeight: 500,
    marginTop: 8,
  },
  spinner: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    border: "2px solid rgba(250,204,21,0.3)",
    borderTopColor: "#facc15",
    animation: "spin 0.8s linear infinite",
    display: "inline-block",
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    background: "rgba(250,204,21,0.15)",
    marginTop: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "#facc15",
    transition: "width 0.15s ease",
  },
};
