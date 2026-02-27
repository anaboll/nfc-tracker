"use client";

import React, { useState } from "react";
import VCardRenderer from "./VCardRenderer";
import type { VCardData, VCardTheme } from "@/types/vcard";

/* ------------------------------------------------------------------ */
/*  VCardLivePreview — phone-frame mockup with live renderer           */
/* ------------------------------------------------------------------ */

interface Props {
  vcard: VCardData;
  theme: VCardTheme;
}

export default function VCardLivePreview({ vcard, theme }: Props) {
  const [mobileVisible, setMobileVisible] = useState(false);

  return (
    <>
      {/* Desktop: sticky sidebar preview */}
      <div className="vcard-preview-desktop">
        <div className="vcard-preview-label">Podglad wizytowki</div>
        <div className="vcard-phone-frame">
          <div className="vcard-phone-notch" />
          <div className="vcard-phone-screen">
            <VCardRenderer
              vcard={vcard}
              themeOverride={theme}
              hideSaveButton
            />
          </div>
        </div>
      </div>

      {/* Mobile: toggle button + overlay */}
      <button
        className="vcard-preview-mobile-toggle"
        onClick={() => setMobileVisible(true)}
        type="button"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
        Podglad
      </button>

      {/* Mobile overlay */}
      {mobileVisible && (
        <div className="vcard-preview-overlay" onClick={() => setMobileVisible(false)}>
          <div className="vcard-preview-overlay-inner" onClick={(e) => e.stopPropagation()}>
            <button
              className="vcard-preview-close"
              onClick={() => setMobileVisible(false)}
              type="button"
            >
              &times;
            </button>
            <div className="vcard-phone-frame vcard-phone-frame--overlay">
              <div className="vcard-phone-notch" />
              <div className="vcard-phone-screen">
                <VCardRenderer
                  vcard={vcard}
                  themeOverride={theme}
                  hideSaveButton
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
