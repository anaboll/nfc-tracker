"use client";

/* ------------------------------------------------------------------ */
/*  EmailActionSheet — modal który pojawia się po kliknięciu          */
/*  belki Email na vCardzie. Zawiera 2 opcje:                          */
/*    1. Wyślij email — natywny mailto: link (działa jak masz mail-app)*/
/*    2. Skopiuj adres — clipboard.writeText + inline toast            */
/*                                                                     */
/*  Czemu nie po prostu mailto:? Bo iPhone bez ustawionego defaultowego*/
/*  mail-app rzuca błąd systemowy "Nie skonfigurowano poczty". Action  */
/*  sheet daje user-owi świadomy wybór, działa wszędzie.               */
/*                                                                     */
/*  Toast jest INLINE (nie używa globalnego ToastProvider) bo public   */
/*  vCard page nie ma providera owiniętego — komponent jest            */
/*  samowystarczalny.                                                  */
/* ------------------------------------------------------------------ */

import React, { useEffect, useState } from "react";

interface Props {
  email: string;
  isOpen: boolean;
  onClose: () => void;
  /* Kolory z theme vCarda — modal dopasowuje się wizualnie do wizytówki */
  primaryColor?: string;
  bgColor?: string;
  textColor?: string;
  isDarkBg?: boolean;
}

export default function EmailActionSheet({
  email,
  isOpen,
  onClose,
  primaryColor = "#7c3aed",
  bgColor = "#1a1a2e",
  textColor = "#ffffff",
  isDarkBg = true,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  /* Reset stanu gdy modal się zamyka — żeby przy ponownym otwarciu start od zera */
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setCopied(false);
        setCopyError(false);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  /* Klawisz Escape zamyka modal */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      /* Auto-zamknij modal po 1.5s pokazując toast — user widzi konfirmację */
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch {
      /* Fallback: jeśli clipboard API nie dostępne (HTTP, stare browsery) */
      try {
        const ta = document.createElement("textarea");
        ta.value = email;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => onClose(), 1500);
      } catch {
        setCopyError(true);
      }
    }
  };

  /* Kolory dopasowane do palety vCarda */
  const overlayBg = isDarkBg ? "rgba(0, 0, 0, 0.65)" : "rgba(0, 0, 0, 0.45)";
  const sheetBg = bgColor;
  const sheetBorder = isDarkBg ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)";
  const buttonBorder = isDarkBg ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)";
  const dividerColor = isDarkBg ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)";
  const textMuted = isDarkBg ? "rgba(255, 255, 255, 0.55)" : "rgba(0, 0, 0, 0.5)";

  return (
    <>
      {/* Overlay — kliknięcie poza modal zamyka */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: overlayBg,
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 9998,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          padding: "0 16px 16px",
          animation: "vcardSheetFadeIn 0.18s ease-out",
        }}
      >
        {/* Sheet — kliknięcie wewnątrz nie propaguje (nie zamyka) */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: sheetBg,
            color: textColor,
            border: `1px solid ${sheetBorder}`,
            borderRadius: 16,
            width: "100%",
            maxWidth: 440,
            overflow: "hidden",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.4)",
            animation: "vcardSheetSlideUp 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)",
            marginBottom: "max(env(safe-area-inset-bottom), 8px)",
          }}
        >
          {/* Header z adresem email */}
          <div
            style={{
              padding: "16px 20px 14px",
              borderBottom: `1px solid ${dividerColor}`,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: "0.1em", color: textMuted, textTransform: "uppercase", marginBottom: 4 }}>
              Email
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: textColor,
                wordBreak: "break-all",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}
            >
              {email}
            </div>
          </div>

          {/* Akcja 1: Wyślij email (natywny mailto:) */}
          <a
            href={`mailto:${email}`}
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "16px 20px",
              borderBottom: `1px solid ${dividerColor}`,
              color: textColor,
              textDecoration: "none",
              transition: "background 0.15s",
              fontSize: 15,
              fontWeight: 500,
              borderTop: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = isDarkBg ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <SendIcon color={primaryColor} />
            <span>Wyślij email</span>
          </a>

          {/* Akcja 2: Skopiuj adres */}
          <button
            type="button"
            onClick={handleCopy}
            disabled={copied}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "16px 20px",
              border: "none",
              background: copied ? (isDarkBg ? "rgba(34, 197, 94, 0.12)" : "rgba(34, 197, 94, 0.1)") : "transparent",
              color: copied ? "#22c55e" : textColor,
              fontSize: 15,
              fontWeight: 500,
              cursor: copied ? "default" : "pointer",
              fontFamily: "inherit",
              textAlign: "left",
              transition: "background 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!copied) e.currentTarget.style.background = isDarkBg ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
            }}
            onMouseLeave={(e) => {
              if (!copied) e.currentTarget.style.background = "transparent";
            }}
          >
            {copied ? <CheckIcon /> : <CopyIcon color={primaryColor} />}
            <span>{copied ? "Skopiowano!" : "Skopiuj adres"}</span>
          </button>

          {copyError && (
            <div style={{ padding: "10px 20px", fontSize: 12, color: "#ef4444", textAlign: "center", borderTop: `1px solid ${dividerColor}` }}>
              Nie udało się skopiować. Zaznacz adres ręcznie i Ctrl+C.
            </div>
          )}

          {/* Anuluj */}
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              padding: "14px 20px",
              border: "none",
              borderTop: `1px solid ${dividerColor}`,
              background: "transparent",
              color: textMuted,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Anuluj
          </button>
        </div>
      </div>

      {/* Inline keyframes — bez zaleznosci od global CSS */}
      <style>{`
        @keyframes vcardSheetFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes vcardSheetSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Icons — proste inline SVG, brak zależności                          */
/* ------------------------------------------------------------------ */

function SendIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function CopyIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
