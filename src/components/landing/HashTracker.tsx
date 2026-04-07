"use client";

import { useEffect } from "react";

/**
 * Detects hash patterns like #jak-to-dziala/XXXX and reports them as scans.
 * Used for trackable email links that look like regular anchor links.
 *
 * After tracking, cleans the URL to just #jak-to-dziala so the user doesn't
 * see the tracking code in their address bar.
 */
export default function HashTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash; // e.g. "#jak-to-dziala/DJ3L"
    if (!hash) return;

    // Pattern: #jak-to-dziala/CODE where CODE is 4+ alphanumeric uppercase chars
    const match = hash.match(/^#jak-to-dziala\/([A-Z0-9]{4,})$/i);
    if (!match) return;

    const code = match[1].toUpperCase();

    // Fire-and-forget tracking request
    fetch("/api/track-hash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        referrer: document.referrer || null,
        userAgent: navigator.userAgent,
        language: navigator.language,
      }),
    }).catch(() => {
      // Silently fail - don't break the UX
    });

    // Clean up URL - replace with just #jak-to-dziala so code doesn't linger
    // Use history.replaceState to avoid triggering navigation/scroll
    try {
      history.replaceState(null, "", "#jak-to-dziala");
      // Force re-scroll to the section (since the hash technically changed)
      const el = document.getElementById("jak-to-dziala");
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    } catch {
      /* ignore */
    }
  }, []);

  return null;
}
