"use client";

import React from "react";

interface EmptyStateProps {
  icon: "globe" | "city" | "language" | "tag" | "chart" | "device" | "nfc";
  message: string;
  hint?: string;
}

const ICONS: Record<EmptyStateProps["icon"], React.ReactNode> = {
  globe: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
    </svg>
  ),
  city: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="6" height="20" rx="1" />
      <rect x="14" y="8" width="6" height="14" rx="1" />
      <path d="M7 6h0M7 10h0M7 14h0M17 12h0M17 16h0" />
    </svg>
  ),
  language: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8l6 10" />
      <path d="M13 8l-6 10" />
      <path d="M7 13h4" />
      <path d="M15 4v4" />
      <path d="M13 4h4" />
      <path d="M17 4c0 4-2 7-6 8" />
      <path d="M13 4c2 3 4.5 5 8 6" />
    </svg>
  ),
  tag: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l9 4.5v5a12 12 0 0 1-9 11.5A12 12 0 0 1 3 11.5v-5L12 2z" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  ),
  chart: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="12" width="4" height="8" rx="1" />
      <rect x="10" y="6" width="4" height="14" rx="1" />
      <rect x="17" y="2" width="4" height="18" rx="1" />
    </svg>
  ),
  device: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M12 18h.01" />
    </svg>
  ),
  nfc: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8.5a6 6 0 0 1 6 6" />
      <path d="M6 4a10.5 10.5 0 0 1 10.5 10.5" />
      <path d="M6 12.5a2 2 0 0 1 2 2" />
      <circle cx="6" cy="16" r="1" />
    </svg>
  ),
};

export default function EmptyState({ icon, message, hint }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 16px",
        gap: 10,
        color: "var(--border-hover)",
      }}
    >
      {ICONS[icon]}
      <p style={{ fontSize: 13, color: "var(--txt-muted)", margin: 0, textAlign: "center" }}>{message}</p>
      {hint && (
        <p style={{ fontSize: 11, color: "var(--border-hover)", margin: 0, textAlign: "center" }}>{hint}</p>
      )}
    </div>
  );
}
