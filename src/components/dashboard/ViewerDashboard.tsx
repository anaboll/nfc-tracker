"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { getCountryFlag } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types (subset matching /api/stats response)                        */
/* ------------------------------------------------------------------ */

interface KPI {
  totalScans: number;
  uniqueUsers: number;
  lastScan: string | null;
  avgScansPerUser: number;
}

interface Devices {
  iOS: number;
  Android: number;
  Desktop: number;
  total: number;
}

interface TopTag {
  tagId: string;
  tagName: string;
  count: number;
  uniqueUsers: number;
  percent: number;
}

interface CountryData {
  country: string;
  count: number;
  uniqueUsers: number;
  percent: number;
}

interface WeekDay {
  day: string;
  date: string;
  count: number;
  uniqueUsers: number;
}

interface HourlyRaw {
  t: string;
  ip: string;
}

interface StatsData {
  kpi: KPI;
  devices: Devices;
  topTags: TopTag[];
  topCountries: CountryData[];
  weeklyTrend: { data: WeekDay[]; weekStart: string; weekEnd: string };
  hourlyRaw: HourlyRaw[];
}

interface HourlyBucket {
  hour: number;
  count: number;
  uniqueUsers: number;
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
/*  Device config                                                      */
/* ------------------------------------------------------------------ */

const DEVICE_CONFIG = [
  { key: "iOS" as const, label: "iOS", color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  { key: "Android" as const, label: "Android", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  { key: "Desktop" as const, label: "Desktop", color: "#94A3B8", bg: "rgba(139,149,168,0.1)" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface Props {
  session: Session;
}

/** Default sections shown when viewerSections is null (all) */
const ALL_SECTIONS = ["kpi", "vcards", "tags", "hourly", "weekly", "geo", "devices"];

export default function ViewerDashboard({ session }: Props) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingToken, setGeneratingToken] = useState<string | null>(null);
  const [visibleSections, setVisibleSections] = useState<string[]>(ALL_SECTIONS);

  /* -- Fetch data -- */
  const fetchAll = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedClientId) params.set("clientId", selectedClientId);

      const [statsRes, tagsRes, clientsRes, meRes] = await Promise.all([
        fetch(`/api/stats?${params.toString()}`),
        fetch("/api/tags"),
        fetch("/api/clients"),
        fetch("/api/users/me"),
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
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.viewerSections && Array.isArray(meData.viewerSections)) {
          setVisibleSections(meData.viewerSections);
        }
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

  /** Check if a section is visible */
  const show = (key: string) => visibleSections.includes(key);

  /* -- Process hourly data -- */
  const hourly: HourlyBucket[] = useMemo(() => {
    const raw = stats?.hourlyRaw ?? [];
    if (raw.length === 0) return [];
    const buckets = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0, uniqueUsers: 0 }));
    const ipSets: Set<string>[] = Array.from({ length: 24 }, () => new Set());
    for (const entry of raw) {
      const h = new Date(entry.t).getHours();
      buckets[h].count++;
      ipSets[h].add(entry.ip);
    }
    for (let i = 0; i < 24; i++) {
      buckets[i].uniqueUsers = ipSets[i].size;
    }
    return buckets;
  }, [stats?.hourlyRaw]);

  /* -- Generate edit token for a vCard tag -- */
  const handleEditVcard = async (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    if (tag?.editToken && tag.editTokenExp && new Date(tag.editTokenExp) > new Date()) {
      const baseUrl = window.location.origin;
      window.location.href = `${baseUrl}/vcard/${tagId}/edit?token=${tag.editToken}&from=dashboard`;
      return;
    }

    setGeneratingToken(tagId);
    try {
      const res = await fetch("/api/tags/edit-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId, expiresInDays: 30 }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const editUrl = data.editUrl + (data.editUrl.includes("?") ? "&" : "?") + "from=dashboard";
      window.location.href = editUrl;
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
    if (!d) return "\u2014";
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

  /* -- Computed values -- */
  const devices = stats?.devices;
  const deviceTotal = devices ? (devices.iOS + devices.Android + devices.Desktop) || 1 : 1;
  const topCountries = stats?.topCountries?.slice(0, 8) ?? [];
  const topTags = stats?.topTags?.slice(0, 6) ?? [];
  const maxHourly = Math.max(...hourly.map((h) => h.count), 1);

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
        {show("kpi") && stats?.kpi && (
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
        {show("vcards") && vcardTags.length > 0 && (
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
                      {tag._count.scans} skan{tag._count.scans === 1 ? "" : "ow"}
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
        {show("tags") && otherTags.length > 0 && (
          <section className="viewer-section">
            <h2 className="viewer-section-title">Inne akcje</h2>
            <div className="viewer-tags-list">
              {otherTags.map((tag) => (
                <div key={tag.id} className="viewer-tag-row">
                  <span className="viewer-tag-type-badge" data-type={tag.tagType}>
                    {tag.tagType === "url" ? "URL" : tag.tagType === "multilink" ? "Multi" : tag.tagType === "video" ? "Video" : tag.tagType}
                  </span>
                  <span className="viewer-tag-name">{tag.name}</span>
                  <span className="viewer-tag-scans">{tag._count.scans} skan{tag._count.scans === 1 ? "" : "ow"}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Two-column grid: charts side by side */}
        <div className="viewer-charts-grid">
          {/* Hourly activity chart */}
          {show("hourly") && hourly.length > 0 && (
            <section className="viewer-section viewer-section--chart">
              <h2 className="viewer-section-title">Aktywnosc godzinowa</h2>
              <div className="viewer-hourly-chart">
                {hourly.map((h) => (
                  <div key={h.hour} className="viewer-hourly-col" title={`${h.hour}:00 — ${h.count} skanow, ${h.uniqueUsers} unikalnych`}>
                    <div className="viewer-hourly-count">{h.count > 0 ? h.count : ""}</div>
                    <div className="viewer-hourly-bar-wrap">
                      <div
                        className="viewer-hourly-bar"
                        style={{ height: `${Math.max((h.count / maxHourly) * 100, h.count > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    <div className="viewer-hourly-label">{h.hour % 3 === 0 ? `${h.hour}` : ""}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Weekly trend chart */}
          {show("weekly") && stats?.weeklyTrend && stats.weeklyTrend.data.length > 0 && (
            <section className="viewer-section viewer-section--chart">
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
        </div>

        {/* Bottom row: countries + devices side by side */}
        <div className="viewer-charts-grid">
          {/* Top countries */}
          {show("geo") && topCountries.length > 0 && (
            <section className="viewer-section viewer-section--chart">
              <h2 className="viewer-section-title">Kraje</h2>
              <div className="viewer-countries-list">
                {topCountries.map((c, i) => (
                  <div key={i} className="viewer-country-row">
                    <span className="viewer-country-flag">{getCountryFlag(c.country)}</span>
                    <span className="viewer-country-name">{c.country || "Nieznany"}</span>
                    <span className="viewer-country-bar-wrap">
                      <span
                        className="viewer-country-bar"
                        style={{ width: `${Math.max(c.percent, 2)}%` }}
                      />
                    </span>
                    <span className="viewer-country-count">{c.count}</span>
                    <span className="viewer-country-percent">{c.percent.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Devices breakdown */}
          {show("devices") && devices && deviceTotal > 0 && (
            <section className="viewer-section viewer-section--chart">
              <h2 className="viewer-section-title">Urzadzenia</h2>
              <div className="viewer-devices">
                {DEVICE_CONFIG.map((d) => {
                  const value = devices[d.key] ?? 0;
                  const pct = ((value / deviceTotal) * 100);
                  return (
                    <div key={d.key} className="viewer-device-row">
                      <div className="viewer-device-header">
                        <span className="viewer-device-badge" style={{ background: d.bg, color: d.color }}>
                          {d.label}
                        </span>
                        <span className="viewer-device-value">{value}</span>
                        <span className="viewer-device-percent">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="viewer-device-bar-wrap">
                        <div
                          className="viewer-device-bar"
                          style={{ width: `${Math.max(pct, 1)}%`, background: d.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Top tags (if > 1 tag) */}
              {topTags.length > 1 && (
                <>
                  <h2 className="viewer-section-title" style={{ marginTop: 28 }}>Top tagi</h2>
                  <div className="viewer-top-tags">
                    {topTags.map((t, i) => (
                      <div key={i} className="viewer-top-tag-row">
                        <span className="viewer-top-tag-rank">{i + 1}</span>
                        <span className="viewer-top-tag-name">{t.tagName}</span>
                        <span className="viewer-top-tag-count">{t.count}</span>
                        <span className="viewer-top-tag-percent">{t.percent.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="viewer-footer">
        TwojeNFC &middot; Panel klienta
      </footer>
    </div>
  );
}
