"use client";

/* ------------------------------------------------------------------ */
/*  DashboardHeader — sticky top header                                */
/*  Extracted from src/app/dashboard/page.tsx                          */
/* ------------------------------------------------------------------ */

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
        background: "rgba(8,11,20,0.88)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 1px 0 rgba(148,163,184,0.06)",
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
            <span style={{ color: "#38BDF8" }}>Twoje</span>
            <span style={{ color: "#F1F5F9" }}>NFC</span>
          </span>
        </div>

        {/* actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ThemeToggle />
          <button
            onClick={onRefresh}
            disabled={refreshing}
            style={{
              background: "transparent",
              border: "none",
              color: "#F1F5F9",
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
            onMouseEnter={(e) => (e.currentTarget.style.color = "#38BDF8")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#F1F5F9")}
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
                color: "#94A3B8",
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
                e.currentTarget.style.color = "#60a5fa";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#94A3B8";
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

          <a
            href="/dashboard/settings"
            style={{
              background: "transparent",
              border: "none",
              color: "#94A3B8",
              borderRadius: 8,
              padding: "8px",
              cursor: "pointer",
              transition: "color 0.2s",
              display: "flex",
              alignItems: "center",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#38BDF8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#94A3B8"; }}
            title="Ustawienia"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </a>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={{
              background: "transparent",
              border: "none",
              color: "#94A3B8",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#f87171";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#94A3B8";
            }}
          >
            Wyloguj
          </button>
        </div>
      </div>
    </header>
  );
}
