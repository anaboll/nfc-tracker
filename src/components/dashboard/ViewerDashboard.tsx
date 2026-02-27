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
  { key: "iOS" as const, label: "iOS", color: "#38BDF8" },
  { key: "Android" as const, label: "Android", color: "#10b981" },
  { key: "Desktop" as const, label: "Desktop", color: "#94A3B8" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface Props {
  session: Session;
}

/** Default sections shown when viewerSections is null (all) */
const ALL_SECTIONS = ["kpi", "vcards", "tags", "hourly", "weekly", "geo", "devices"];
const COUNTRIES_PER_PAGE = 5;

export default function ViewerDashboard({ session }: Props) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingToken, setGeneratingToken] = useState<string | null>(null);
  const [visibleSections, setVisibleSections] = useState<string[]>(ALL_SECTIONS);
  const [countriesPage, setCountriesPage] = useState(1);

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
  const topCountries = stats?.topCountries ?? [];
  const topTags = stats?.topTags?.slice(0, 6) ?? [];
  const maxHourly = Math.max(...hourly.map((h) => h.count), 1);
  const pagedCountries = topCountries.slice((countriesPage - 1) * COUNTRIES_PER_PAGE, countriesPage * COUNTRIES_PER_PAGE);

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
            {[
              { value: stats.kpi.totalScans.toLocaleString("pl-PL"), label: "Wszystkie skany", accent: true },
              { value: stats.kpi.uniqueUsers.toLocaleString("pl-PL"), label: "Unikalni uzytkownicy" },
              { value: stats.kpi.avgScansPerUser.toFixed(1), label: "Skany / uzytkownik" },
              { value: formatDate(stats.kpi.lastScan), label: "Ostatni skan", small: true },
            ].map((kpi, i) => (
              <div key={i} className="viewer-kpi-card">
                <div className={`viewer-kpi-accent ${kpi.accent ? "viewer-kpi-accent--primary" : ""}`} />
                <div className={`viewer-kpi-value ${kpi.small ? "viewer-kpi-value--small" : ""}`}>
                  {kpi.value}
                </div>
                <div className="viewer-kpi-label">{kpi.label}</div>
              </div>
            ))}
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
                      href={`/vcard/${tag.id}?from=dashboard`}
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
          {show("hourly") && (
            <div className="card viewer-card">
              <h3 className="viewer-card-title">Aktywnosc godzinowa</h3>
              {hourly.length === 0 ? (
                <p className="viewer-empty">Brak danych</p>
              ) : (
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
              )}
            </div>
          )}

          {/* Weekly trend chart */}
          {show("weekly") && (
            <div className="card viewer-card">
              <h3 className="viewer-card-title">Ten tydzien</h3>
              {!stats?.weeklyTrend || stats.weeklyTrend.data.length === 0 ? (
                <p className="viewer-empty">Brak danych</p>
              ) : (
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
              )}
            </div>
          )}
        </div>

        {/* Bottom row: countries + devices side by side */}
        <div className="viewer-charts-grid">
          {/* Top countries */}
          {show("geo") && (
            <div className="card viewer-card">
              <h3 className="viewer-card-title">Kraje</h3>
              {topCountries.length === 0 ? (
                <p className="viewer-empty">Brak danych</p>
              ) : (
                <>
                  {pagedCountries.map((c, i, arr) => (
                    <div
                      key={c.country}
                      className="viewer-country-row-v2"
                      style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(148,163,184,0.08)" : "none" }}
                    >
                      <div className="viewer-country-left">
                        <span className="viewer-country-flag-v2">{getCountryFlag(c.country)}</span>
                        <span className="viewer-country-name-v2">{c.country || "Nieznany"}</span>
                      </div>
                      <div className="viewer-country-right">
                        <div className="viewer-country-stat">
                          <span className="viewer-country-stat-value">{c.count}</span>
                          <span className="viewer-country-stat-label">sk.</span>
                        </div>
                        <div className="viewer-country-divider" />
                        <div className="viewer-country-stat">
                          <span className="viewer-country-stat-value viewer-country-stat-value--accent">{c.uniqueUsers}</span>
                          <span className="viewer-country-stat-label">unik.</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {topCountries.length > COUNTRIES_PER_PAGE && (
                    <div className="viewer-pagination">
                      <span className="viewer-pagination-info">
                        {Math.min(countriesPage * COUNTRIES_PER_PAGE, topCountries.length)}/{topCountries.length}
                      </span>
                      <div className="viewer-pagination-btns">
                        <button
                          disabled={countriesPage <= 1}
                          onClick={() => setCountriesPage(p => p - 1)}
                          className="viewer-pagination-btn"
                        >
                          &larr; Poprz.
                        </button>
                        <button
                          disabled={countriesPage * COUNTRIES_PER_PAGE >= topCountries.length}
                          onClick={() => setCountriesPage(p => p + 1)}
                          className="viewer-pagination-btn"
                        >
                          Nast. &rarr;
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Devices breakdown + Top tags */}
          {show("devices") && (
            <div className="card viewer-card">
              <h3 className="viewer-card-title">Urzadzenia</h3>
              {!devices || deviceTotal <= 0 ? (
                <p className="viewer-empty">Brak danych</p>
              ) : (
                <>
                  {DEVICE_CONFIG.map((d) => {
                    const value = devices[d.key] ?? 0;
                    const pct = ((value / deviceTotal) * 100);
                    return (
                      <div key={d.key} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 12 }}>
                          <span style={{ color: "#F1F5F9", fontWeight: 500 }}>{d.label}</span>
                          <span style={{ color: "#94A3B8", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                            {value} <span style={{ color: "#64748B" }}>({pct.toFixed(0)}%)</span>
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${pct}%`, background: d.color }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(148,163,184,0.06)" }}>
                    <span style={{ fontSize: 11, color: "#64748B", fontFamily: "var(--font-mono)" }}>
                      Razem: {devices.total.toLocaleString("pl-PL")}
                    </span>
                  </div>
                </>
              )}

              {/* Top tags (if > 1 tag) */}
              {topTags.length > 1 && (
                <>
                  <h3 className="viewer-card-title" style={{ marginTop: 24 }}>Najczesciej skanowane</h3>
                  {topTags.map((t, i) => (
                    <div
                      key={t.tagId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        borderBottom: i < topTags.length - 1 ? "1px solid rgba(148,163,184,0.04)" : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 500, color: "#64748B",
                          fontFamily: "var(--font-mono)", width: 16, textAlign: "right", flexShrink: 0,
                        }}>
                          {i + 1}
                        </span>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: "#F1F5F9" }}>{t.tagName}</p>
                          <p style={{ fontSize: 10, color: "#64748B", fontFamily: "var(--font-mono)" }}>{t.tagId}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", display: "flex", gap: 14, alignItems: "baseline" }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#F1F5F9", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                          {t.count}
                        </span>
                        <span style={{ fontSize: 11, color: "#64748B" }}>|</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#38BDF8", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                          {t.uniqueUsers}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
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
