"use client";

/* ------------------------------------------------------------------ */
/*  DashboardHeader — sticky top header                                */
/*  Extracted from src/app/dashboard/page.tsx                          */
/* ------------------------------------------------------------------ */

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useDashboardFilters } from "@/contexts/DashboardFilterContext";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface Props {
  isAdmin: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onOpenUsersPanel: () => void;
}

export default function DashboardHeader({ isAdmin, refreshing, onRefresh, onOpenUsersPanel }: Props) {
  const { setSidebarOpen } = useDashboardFilters();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "color-mix(in srgb, var(--bg) 88%, transparent)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 1px 0 var(--border)",
        padding: "12px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Mobile hamburger */}
          <button
            className="sidebar-hamburger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Otworz filtry"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          {/* logo */}
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
            <span style={{ color: "var(--accent)" }}>Twoje</span>
            <span style={{ color: "var(--txt)" }}>NFC</span>
          </span>
        </div>

        {/* actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href="/dashboard/porownanie"
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--txt-sec)",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 6,
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--accent)";
              e.currentTarget.style.borderColor = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--txt-sec)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Porównaj
          </Link>
          <ThemeToggle />
          <button
            onClick={onRefresh}
            disabled={refreshing}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--txt)",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              opacity: refreshing ? 0.6 : 1,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--txt)")}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                animation: refreshing ? "spin 0.8s linear infinite" : "none",
              }}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            {refreshing ? "Odswiezanie..." : "Odswiez"}
          </button>

          {isAdmin && (
            <button
              onClick={onOpenUsersPanel}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--txt-sec)",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "color 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--txt-sec)";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Uzytkownicy
            </button>
          )}

          {isAdmin && (
            <Link
              href="/dashboard/status"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--txt-sec)",
                borderRadius: 8,
                padding: "8px",
                cursor: "pointer",
                transition: "color 0.2s",
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--txt-sec)"; }}
              title="Status serwera"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="8" rx="1.5" />
                <rect x="2" y="13" width="20" height="8" rx="1.5" />
                <circle cx="6" cy="7" r="0.5" fill="currentColor" />
                <circle cx="6" cy="17" r="0.5" fill="currentColor" />
                <line x1="10" y1="7" x2="18" y2="7" />
                <line x1="10" y1="17" x2="18" y2="17" />
              </svg>
            </Link>
          )}

          <Link
            href="/dashboard/settings"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--txt-sec)",
              borderRadius: 8,
              padding: "8px",
              cursor: "pointer",
              transition: "color 0.2s",
              display: "flex",
              alignItems: "center",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--txt-sec)"; }}
            title="Ustawienia"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--txt-sec)",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--error)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--txt-sec)";
            }}
          >
            Wyloguj
          </button>
        </div>
      </div>
    </header>
  );
}
