"use client";

import React, { useState, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";

/* ------------------------------------------------------------------ */
/*  Types (minimal subset for viewer)                                  */
/* ------------------------------------------------------------------ */

interface KPI {
  totalScans: number;
  uniqueUsers: number;
  lastScan: string | null;
  avgScansPerUser: number;
}

interface WeekDay {
  day: string;
  date: string;
  count: number;
  uniqueUsers: number;
}

interface StatsData {
  kpi: KPI;
  weeklyTrend: { data: WeekDay[]; weekStart: string; weekEnd: string };
}

interface ClientInfo {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface TagItem {
  id: string;
  name: string;
  tagType: string;
  isActive: boolean;
  clientId: string | null;
  client: ClientInfo | null;
  editToken?: string | null;
  editTokenExp?: string | null;
  _count: { scans: number };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface Props {
  session: Session;
}

export default function ViewerDashboard({ session }: Props) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingToken, setGeneratingToken] = useState<string | null>(null);

  /* -- Fetch data -- */
  const fetchAll = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedClientId) params.set("clientId", selectedClientId);

      const [statsRes, tagsRes, clientsRes] = await Promise.all([
        fetch(`/api/stats?${params.toString()}`),
        fetch("/api/tags"),
        fetch("/api/clients"),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (tagsRes.ok) {
        const allTags: TagItem[] = await tagsRes.json();
        setTags(allTags);
      }
      if (clientsRes.ok) {
        const allClients: ClientInfo[] = await clientsRes.json();
        setClients(allClients);
      }
    } catch (e) {
      console.error("Viewer dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [selectedClientId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* -- Generate edit token for a vCard tag -- */
  const handleEditVcard = async (tagId: string) => {
    // Check if tag already has valid token
    const tag = tags.find((t) => t.id === tagId);
    if (tag?.editToken && tag.editTokenExp && new Date(tag.editTokenExp) > new Date()) {
      const baseUrl = window.location.origin;
      window.open(`${baseUrl}/vcard/${tagId}/edit?token=${tag.editToken}`, "_blank");
      return;
    }

    // Generate new token
    setGeneratingToken(tagId);
    try {
      const res = await fetch("/api/tags/edit-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId, expiresInDays: 30 }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      window.open(data.editUrl, "_blank");
      // Refresh tags to get updated token
      const tagsRes = await fetch("/api/tags");
      if (tagsRes.ok) setTags(await tagsRes.json());
    } catch (e) {
      console.error("Edit token generation failed:", e);
    } finally {
      setGeneratingToken(null);
    }
  };

  /* -- Filter tags by client -- */
  const filteredTags = selectedClientId
    ? tags.filter((t) => t.clientId === selectedClientId)
    : tags;

  const vcardTags = filteredTags.filter((t) => t.tagType === "vcard");
  const otherTags = filteredTags.filter((t) => t.tagType !== "vcard");

  /* -- Formatters -- */
  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pl-PL", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const DAY_NAMES: Record<string, string> = {
    Mon: "Pn", Tue: "Wt", Wed: "Sr", Thu: "Cz", Fri: "Pt", Sat: "So", Sun: "Nd",
  };

  if (loading) {
    return (
      <div className="viewer-dashboard">
        <div className="viewer-loading">
          <div className="viewer-loading-spinner" />
          Ladowanie danych...
        </div>
      </div>
    );
  }

  return (
    <div className="viewer-dashboard">
      {/* Header */}
      <header className="viewer-header">
        <div className="viewer-header-left">
          <h1 className="viewer-logo">
            <span style={{ color: "var(--accent)" }}>Twoje</span>NFC
          </h1>
        </div>
        <div className="viewer-header-right">
          <span className="viewer-user-email">{session.user?.email}</span>
          <button className="viewer-logout-btn" onClick={() => signOut({ callbackUrl: "/login" })}>
            Wyloguj
          </button>
        </div>
      </header>

      <main className="viewer-main">
        {/* Client selector (if multiple clients) */}
        {clients.length > 1 && (
          <div className="viewer-client-selector">
            <button
              className={`viewer-client-chip ${!selectedClientId ? "viewer-client-chip--active" : ""}`}
              onClick={() => setSelectedClientId(null)}
            >
              Wszystko
            </button>
            {clients.map((c) => (
              <button
                key={c.id}
                className={`viewer-client-chip ${selectedClientId === c.id ? "viewer-client-chip--active" : ""}`}
                onClick={() => setSelectedClientId(c.id)}
                style={selectedClientId === c.id && c.color ? { borderColor: c.color, color: c.color } : undefined}
              >
                {c.color && (
                  <span className="viewer-client-dot" style={{ background: c.color }} />
                )}
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* KPI Strip */}
        {stats?.kpi && (
          <div className="viewer-kpi-strip">
            <div className="viewer-kpi-card">
              <div className="viewer-kpi-value">{stats.kpi.totalScans}</div>
              <div className="viewer-kpi-label">Skany</div>
            </div>
            <div className="viewer-kpi-card">
              <div className="viewer-kpi-value">{stats.kpi.uniqueUsers}</div>
              <div className="viewer-kpi-label">Unikalni</div>
            </div>
            <div className="viewer-kpi-card">
              <div className="viewer-kpi-value">{stats.kpi.avgScansPerUser.toFixed(1)}</div>
              <div className="viewer-kpi-label">Skany/uzytkownik</div>
            </div>
            <div className="viewer-kpi-card">
              <div className="viewer-kpi-value viewer-kpi-value--small">{formatDate(stats.kpi.lastScan)}</div>
              <div className="viewer-kpi-label">Ostatni skan</div>
            </div>
          </div>
        )}

        {/* My vCards */}
        {vcardTags.length > 0 && (
          <section className="viewer-section">
            <h2 className="viewer-section-title">Moje wizytowki</h2>
            <div className="viewer-vcards-grid">
              {vcardTags.map((tag) => (
                <div key={tag.id} className="viewer-vcard-card">
                  <div className="viewer-vcard-info">
                    <div className="viewer-vcard-name">{tag.name}</div>
                    {tag.client && (
                      <span className="viewer-vcard-client" style={tag.client.color ? { color: tag.client.color } : undefined}>
                        {tag.client.name}
                      </span>
                    )}
                    <div className="viewer-vcard-stats">
                      {tag._count.scans} skano&apos;w
                      {!tag.isActive && <span className="viewer-vcard-inactive"> (nieaktywny)</span>}
                    </div>
                  </div>
                  <div className="viewer-vcard-actions">
                    <a
                      href={`/vcard/${tag.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="viewer-vcard-btn viewer-vcard-btn--secondary"
                    >
                      Podglad
                    </a>
                    <button
                      className="viewer-vcard-btn viewer-vcard-btn--primary"
                      onClick={() => handleEditVcard(tag.id)}
                      disabled={generatingToken === tag.id}
                    >
                      {generatingToken === tag.id ? "..." : "Edytuj"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Other tags (read-only) */}
        {otherTags.length > 0 && (
          <section className="viewer-section">
            <h2 className="viewer-section-title">Inne akcje</h2>
            <div className="viewer-tags-list">
              {otherTags.map((tag) => (
                <div key={tag.id} className="viewer-tag-row">
                  <span className="viewer-tag-type-badge" data-type={tag.tagType}>
                    {tag.tagType === "url" ? "URL" : tag.tagType === "multilink" ? "Multi" : tag.tagType === "video" ? "Video" : tag.tagType}
                  </span>
                  <span className="viewer-tag-name">{tag.name}</span>
                  <span className="viewer-tag-scans">{tag._count.scans} skano&apos;w</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Weekly trend chart */}
        {stats?.weeklyTrend && stats.weeklyTrend.data.length > 0 && (
          <section className="viewer-section">
            <h2 className="viewer-section-title">Ten tydzien</h2>
            <div className="viewer-weekly-chart">
              {(() => {
                const maxCount = Math.max(...stats.weeklyTrend.data.map((d) => d.count), 1);
                return stats.weeklyTrend.data.map((day, i) => (
                  <div key={i} className="viewer-weekly-bar-col">
                    <div className="viewer-weekly-count">{day.count}</div>
                    <div className="viewer-weekly-bar-wrap">
                      <div
                        className="viewer-weekly-bar"
                        style={{ height: `${Math.max((day.count / maxCount) * 100, 2)}%` }}
                      />
                    </div>
                    <div className="viewer-weekly-day">{DAY_NAMES[day.day] || day.day}</div>
                  </div>
                ));
              })()}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="viewer-footer">
        TwojeNFC &middot; Panel klienta
      </footer>
    </div>
  );
}
