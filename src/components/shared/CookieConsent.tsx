"use client";

import { useState, useEffect } from "react";

const CONSENT_COOKIE = "tn_consent";
const CONSENT_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

function getConsentCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setConsentCookie(value: string) {
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${CONSENT_MAX_AGE}; samesite=lax`;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if no consent cookie exists
    const consent = getConsentCookie();
    if (!consent) {
      // Small delay so banner doesn't flash on initial render
      const timer = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    setConsentCookie("all");
    setVisible(false);
  };

  const handleEssentialOnly = () => {
    setConsentCookie("essential");
    setVisible(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: "rgba(10, 10, 20, 0.97)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(255,255,255,0.1)",
        padding: "16px 20px",
        animation: "cookieSlideUp 0.4s ease-out",
      }}
    >
      <style>{`
        @keyframes cookieSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Text */}
        <p
          style={{
            flex: 1,
            minWidth: 200,
            margin: 0,
            fontSize: 13,
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.8)",
          }}
        >
          <span style={{ fontSize: 16, marginRight: 6 }}>&#x1F36A;</span>
          Ta strona wykorzystuje pliki cookie do analizy ruchu i poprawy
          jakości usług. Pliki cookie niezbędne do działania strony są
          zawsze aktywne.
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            onClick={handleEssentialOnly}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "rgba(255,255,255,0.7)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
              e.currentTarget.style.color = "rgba(255,255,255,0.7)";
            }}
          >
            Tylko niezbędne
          </button>
          <button
            onClick={handleAccept}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
              boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(99,102,241,0.3)";
            }}
          >
            Akceptuję wszystkie
          </button>
        </div>
      </div>
    </div>
  );
}
