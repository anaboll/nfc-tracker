"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { StatsData } from "@/types/dashboard";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PanelFilters {
  from: string;
  to: string;
  clientId: string;
  campaignId: string;
  tagId: string;
}

interface ClientOption {
  id: string;
  name: string;
}

interface CampaignOption {
  id: string;
  name: string;
  clientId: string;
}

interface TagOption {
  id: string;
  name: string;
  clientId: string | null;
}

interface DailyPoint {
  date: string;
  label: string;
  count: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function buildDailyData(hourlyRaw: { t: string; ip: string }[]): DailyPoint[] {
  const dayMap = new Map<string, number>();
  for (const { t } of hourlyRaw) {
    const d = t.slice(0, 10);
    dayMap.set(d, (dayMap.get(d) || 0) + 1);
  }
  return Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({
      date,
      label: new Date(date).toLocaleDateString("pl-PL", { day: "numeric", month: "short" }),
      count,
    }));
}

function buildHourlyAgg(hourlyRaw: { t: string; ip: string }[]): number[] {
  const hours = new Array(24).fill(0);
  for (const { t } of hourlyRaw) hours[new Date(t).getHours()]++;
  return hours;
}

function fmtNum(n: number): string {
  return n.toLocaleString("pl-PL");
}

/* ------------------------------------------------------------------ */
/*  Solo hourly chart for one period                                   */
/* ------------------------------------------------------------------ */

function SoloHourlyChart({ hours, variant }: { hours: number[]; variant: "a" | "b" }) {
  const maxH = Math.max(...hours, 1);
  return (
    <div className="comp-hourly-wrap">
      <div className="comp-hourly-chart">
        {hours.map((val, h) => (
          <div key={h} className="comp-hourly-col" title={`${h}:00 — ${val}`}>
            <div className="comp-hourly-bars">
              <div
                className={`comp-hourly-bar comp-hourly-bar--${variant}`}
                style={{ height: `${(val / maxH) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="comp-hourly-labels">
        {hours.map((_, h) => (
          <div key={h} className="comp-hourly-label-slot">
            <span className="comp-hourly-label">{h}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Single stats panel (used for both A and B) — no daily trend here   */
/* ------------------------------------------------------------------ */

function StatsPanel({ stats, variant }: { stats: StatsData; variant: "a" | "b" }) {
  const hourly = buildHourlyAgg(stats.hourlyRaw);
  const deviceTypes = ["iOS", "Android", "Desktop"] as const;
  const deviceEmoji: Record<string, string> = { iOS: "🍎", Android: "🤖", Desktop: "🖥️" };
  const daily = buildDailyData(stats.hourlyRaw);
  const avgDaily = daily.length > 0 ? Math.round(stats.kpi.totalScans / daily.length) : 0;

  return (
    <>
      {/* KPI mini-cards */}
      <div className="comp-panel-kpi-grid">
        {[
          { label: "Skany", val: stats.kpi.totalScans },
          { label: "Unikalni", val: stats.kpi.uniqueUsers },
          { label: "Śr/os.", val: stats.kpi.avgScansPerUser },
          { label: "Śr/dzień", val: avgDaily },
        ].map((kpi, i) => (
          <div key={i} className={`comp-panel-kpi comp-panel-kpi--${variant}`}>
            <div className="comp-panel-kpi-label">{kpi.label}</div>
            <div className="comp-panel-kpi-val">
              {typeof kpi.val === "number" && kpi.val % 1 !== 0 ? kpi.val.toFixed(1) : fmtNum(kpi.val)}
            </div>
          </div>
        ))}
      </div>

      {/* Devices */}
      <div className="comp-panel-section">
        <h4 className="comp-panel-section-title">Urządzenia</h4>
        {deviceTypes.map((dev) => {
          const val = stats.devices[dev] || 0;
          const pct = stats.devices.total > 0 ? ((val / stats.devices.total) * 100).toFixed(1) : "0";
          const maxVal = Math.max(...deviceTypes.map((d) => stats.devices[d] || 0), 1);
          return (
            <div key={dev} className="comp-device-solo-row">
              <span className="comp-device-solo-label">{deviceEmoji[dev]} {dev}</span>
              <div className="comp-device-solo-bar-wrap">
                <div className={`comp-device-solo-bar comp-device-solo-bar--${variant}`} style={{ width: `${(val / maxVal) * 100}%` }}>
                  {fmtNum(val)}
                </div>
              </div>
              <span className="comp-device-solo-pct">{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* Hourly */}
      <div className="comp-panel-section">
        <h4 className="comp-panel-section-title">Aktywność godzinowa</h4>
        <SoloHourlyChart hours={hourly} variant={variant} />
      </div>

      {/* Cities */}
      <div className="comp-panel-section">
        <h4 className="comp-panel-section-title">Top miasta</h4>
        <div className="comp-cities-list">
          {stats.topCities.slice(0, 6).map((c, i) => {
            const maxC = stats.topCities[0]?.count || 1;
            return (
              <div key={i} className="comp-city-row">
                <span className="comp-city-rank">{i + 1}</span>
                <span className="comp-city-name">{c.city}</span>
                <div className="comp-city-bar-wrap">
                  <div className={`comp-city-bar comp-city-bar--${variant}`} style={{ width: `${(c.count / maxC) * 100}%` }} />
                </div>
                <span className="comp-city-count">{fmtNum(c.count)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Languages */}
      <div className="comp-panel-section">
        <h4 className="comp-panel-section-title">Języki</h4>
        {stats.topLanguages.slice(0, 5).map((l) => {
          const maxL = stats.topLanguages[0]?.count || 1;
          return (
            <div key={l.lang} className="comp-device-solo-row">
              <span className="comp-device-solo-label">{l.lang.toUpperCase()}</span>
              <div className="comp-device-solo-bar-wrap">
                <div className={`comp-device-solo-bar comp-device-solo-bar--${variant}`} style={{ width: `${(l.count / maxL) * 100}%` }}>
                  {fmtNum(l.count)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function ComparisonPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Shared: clients, campaigns & tags for dropdowns
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);

  // Panel A state
  const [filtersA, setFiltersA] = useState<PanelFilters>({
    from: "2026-01-01", to: "2026-01-31", clientId: "", campaignId: "", tagId: "",
  });
  const [statsA, setStatsA] = useState<StatsData | null>(null);
  const [loadingA, setLoadingA] = useState(false);

  // Panel B state — same defaults as A
  const [filtersB, setFiltersB] = useState<PanelFilters>({
    from: "2026-01-01", to: "2026-01-31", clientId: "", campaignId: "", tagId: "",
  });
  const [statsB, setStatsB] = useState<StatsData | null>(null);
  const [loadingB, setLoadingB] = useState(false);

  // Mobile tab
  const [mobileTab, setMobileTab] = useState<"a" | "b">("a");

  // Auth
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Load clients, campaigns & tags
  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([fetch("/api/clients"), fetch("/api/campaigns"), fetch("/api/tags")])
      .then(async ([clRes, cRes, tRes]) => {
        if (clRes.ok) {
          const cl = await clRes.json();
          setClients(cl.map((x: { id: string; name: string }) => ({ id: x.id, name: x.name })));
        }
        if (cRes.ok) {
          const c = await cRes.json();
          setCampaigns(c.map((x: { id: string; name: string; clientId: string }) => ({ id: x.id, name: x.name, clientId: x.clientId })));
        }
        if (tRes.ok) {
          const t = await tRes.json();
          setTags(t.map((x: { id: string; name: string; clientId: string | null }) => ({ id: x.id, name: x.name, clientId: x.clientId })));
        }
      })
      .catch(console.error);
  }, [status]);

  // Fetch stats for a panel
  const fetchPanel = useCallback(async (filters: PanelFilters, setStats: (s: StatsData) => void, setLoading: (b: boolean) => void) => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (filters.from) p.set("from", filters.from);
      if (filters.to) p.set("to", filters.to);
      if (filters.clientId) p.set("clientId", filters.clientId);
      if (filters.campaignId) p.set("campaignId", filters.campaignId);
      if (filters.tagId) p.set("tags", filters.tagId);
      const res = await fetch(`/api/stats?${p.toString()}`);
      if (res.ok) setStats(await res.json());
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (status === "authenticated") {
      fetchPanel(filtersA, setStatsA, setLoadingA);
      fetchPanel(filtersB, setStatsB, setLoadingB);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (status === "loading") return <div style={{ minHeight: "100vh", background: "var(--bg)" }} />;

  const hasComparison = statsA && statsB;

  // Build daily data for both periods (for the combined chart)
  const dailyA = statsA ? buildDailyData(statsA.hourlyRaw) : [];
  const dailyB = statsB ? buildDailyData(statsB.hourlyRaw) : [];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--txt)" }}>
      {/* Header */}
      <header className="comp-header">
        <div className="comp-header-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/dashboard"
              style={{ color: "var(--txt-sec)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Dashboard
            </Link>
            <span style={{ color: "var(--txt-muted)" }}>/</span>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
              <span style={{ color: "var(--accent)" }}>Porównywarka</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="comp-main">
        {/* Mobile tab toggle */}
        <div className="comp-mobile-tabs">
          <button
            className={`comp-mobile-tab ${mobileTab === "a" ? "comp-mobile-tab--active-a" : ""}`}
            onClick={() => setMobileTab("a")}
          >
            ● Okres A
          </button>
          <button
            className={`comp-mobile-tab ${mobileTab === "b" ? "comp-mobile-tab--active-b" : ""}`}
            onClick={() => setMobileTab("b")}
          >
            ● Okres B
          </button>
        </div>

        {/* ══ FILTER PANELS (side by side) ══ */}
        <div className="comp-split">
          {/* ─── Filter A ─── */}
          <div className={`comp-split-col ${mobileTab === "b" ? "comp-split-col--hidden" : ""}`}>
            <div className="comp-filter-panel comp-filter-panel--a">
              <div className="comp-filter-header">
                <span className="comp-filter-badge comp-filter-badge--a">A</span>
                <span className="comp-filter-title">Okres A</span>
              </div>
              <div className="comp-filter-row">
                <label className="comp-filter-label">Od</label>
                <input type="date" className="comp-filter-input comp-filter-date" value={filtersA.from} onChange={(e) => setFiltersA((f) => ({ ...f, from: e.target.value }))} />
              </div>
              <div className="comp-filter-row">
                <label className="comp-filter-label">Do</label>
                <input type="date" className="comp-filter-input comp-filter-date" value={filtersA.to} onChange={(e) => setFiltersA((f) => ({ ...f, to: e.target.value }))} />
              </div>
              <div className="comp-filter-row">
                <label className="comp-filter-label">Klient</label>
                <select className="comp-filter-input" value={filtersA.clientId} onChange={(e) => setFiltersA((f) => ({ ...f, clientId: e.target.value, campaignId: "", tagId: "" }))}>
                  <option value="">Wszyscy klienci</option>
                  {clients.map((cl) => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                </select>
              </div>
              <div className="comp-filter-row">
                <label className="comp-filter-label">Kampania</label>
                <select className="comp-filter-input" value={filtersA.campaignId} onChange={(e) => setFiltersA((f) => ({ ...f, campaignId: e.target.value }))}>
                  <option value="">Wszystkie</option>
                  {(filtersA.clientId ? campaigns.filter((c) => c.clientId === filtersA.clientId) : campaigns).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="comp-filter-row">
                <label className="comp-filter-label">Tag</label>
                <select className="comp-filter-input" value={filtersA.tagId} onChange={(e) => setFiltersA((f) => ({ ...f, tagId: e.target.value }))}>
                  <option value="">Wszystkie</option>
                  {(filtersA.clientId ? tags.filter((t) => t.clientId === filtersA.clientId) : tags).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <button className="comp-filter-btn comp-filter-btn--a" onClick={() => fetchPanel(filtersA, setStatsA, setLoadingA)} disabled={loadingA}>
                {loadingA ? "Ładowanie..." : "Załaduj A"}
              </button>
            </div>
          </div>
          {/* ─── Filter B ─── */}
          <div className={`comp-split-col ${mobileTab === "a" ? "comp-split-col--hidden" : ""}`}>
            <div className="comp-filter-panel comp-filter-panel--b">
              <div className="comp-filter-header">
                <span className="comp-filter-badge comp-filter-badge--b">B</span>
                <span className="comp-filter-title">Okres B</span>
              </div>
              <div className="comp-filter-row">
                <label className="comp-filter-label">Od</label>
                <input type="date" className="comp-filter-input comp-filter-date" value={filtersB.from} onChange={(e) => setFiltersB((f) => ({ ...f, from: e.target.value }))} />
              </div>
              <div className="comp-filter-row">
                <label className="comp-filter-label">Do</label>
                <input type="date" className="comp-filter-input comp-filter-date" value={filtersB.to} onChange={(e) => setFiltersB((f) => ({ ...f, to: e.target.value }))} />
              </div>
              <div className="comp-filter-row">
                <label className="comp-filter-label">Klient</label>
                <select className="comp-filter-input" value={filtersB.clientId} onChange={(e) => setFiltersB((f) => ({ ...f, clientId: e.target.value, campaignId: "", tagId: "" }))}>
                  <option value="">Wszyscy klienci</option>
                  {clients.map((cl) => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                </select>
              </div>
              <div className="comp-filter-row">
                <label className="comp-filter-label">Kampania</label>
                <select className="comp-filter-input" value={filtersB.campaignId} onChange={(e) => setFiltersB((f) => ({ ...f, campaignId: e.target.value }))}>
                  <option value="">Wszystkie</option>
                  {(filtersB.clientId ? campaigns.filter((c) => c.clientId === filtersB.clientId) : campaigns).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="comp-filter-row">
                <label className="comp-filter-label">Tag</label>
                <select className="comp-filter-input" value={filtersB.tagId} onChange={(e) => setFiltersB((f) => ({ ...f, tagId: e.target.value }))}>
                  <option value="">Wszystkie</option>
                  {(filtersB.clientId ? tags.filter((t) => t.clientId === filtersB.clientId) : tags).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <button className="comp-filter-btn comp-filter-btn--b" onClick={() => fetchPanel(filtersB, setStatsB, setLoadingB)} disabled={loadingB}>
                {loadingB ? "Ładowanie..." : "Załaduj B"}
              </button>
            </div>
          </div>
        </div>

        {/* ══ DAILY TRENDS (split — each period its own chart) ══ */}
        {hasComparison && (
          <div className="comp-split" style={{ marginTop: 8 }}>
            <div className={`comp-split-col ${mobileTab === "b" ? "comp-split-col--hidden" : ""}`}>
              <div className="comp-panel comp-panel--a comp-animate">
                <h4 className="comp-panel-section-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
                  Dzienny trend — Okres A
                </h4>
                {(() => {
                  const maxDaily = Math.max(...dailyA.map((d) => d.count), 1);
                  return (
                    <div className="comp-daily-wrap">
                      <div className="comp-daily-chart">
                        {dailyA.map((d, i) => (
                          <div key={i} className="comp-daily-bar-group" title={`${d.label}: ${d.count}`}>
                            <div className="comp-daily-bars">
                              <div className="comp-daily-bar comp-daily-bar--a" style={{ height: `${(d.count / maxDaily) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="comp-daily-labels">
                        {dailyA.map((d, i) => (
                          <div key={i} className="comp-daily-label-slot">
                            <span className="comp-daily-label">{d.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className={`comp-split-col ${mobileTab === "a" ? "comp-split-col--hidden" : ""}`}>
              <div className="comp-panel comp-panel--b comp-animate" style={{ animationDelay: "80ms" }}>
                <h4 className="comp-panel-section-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />
                  Dzienny trend — Okres B
                </h4>
                {(() => {
                  const maxDaily = Math.max(...dailyB.map((d) => d.count), 1);
                  return (
                    <div className="comp-daily-wrap">
                      <div className="comp-daily-chart">
                        {dailyB.map((d, i) => (
                          <div key={i} className="comp-daily-bar-group" title={`${d.label}: ${d.count}`}>
                            <div className="comp-daily-bars">
                              <div className="comp-daily-bar comp-daily-bar--b" style={{ height: `${(d.count / maxDaily) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="comp-daily-labels">
                        {dailyB.map((d, i) => (
                          <div key={i} className="comp-daily-label-slot">
                            <span className="comp-daily-label">{d.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ══ SUMMARY — date range + scan counts ══ */}
        {hasComparison && (
          <section className="comp-summary comp-animate" style={{ animationDelay: "100ms" }}>
            <div className="comp-summary-card">
              <div className="comp-summary-icon" style={{ background: "var(--accent)" }}>A</div>
              <div>
                <div className="comp-summary-title">{filtersA.from} → {filtersA.to}</div>
                <div className="comp-summary-stat">
                  {fmtNum(statsA.kpi.totalScans)} skanów • {fmtNum(statsA.kpi.uniqueUsers)} unikalnych
                </div>
              </div>
            </div>
            <div className="comp-summary-card">
              <div className="comp-summary-icon" style={{ background: "var(--success)" }}>B</div>
              <div>
                <div className="comp-summary-title">{filtersB.from} → {filtersB.to}</div>
                <div className="comp-summary-stat">
                  {fmtNum(statsB.kpi.totalScans)} skanów • {fmtNum(statsB.kpi.uniqueUsers)} unikalnych
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ══ KPI COMPARISON ══ */}
        {hasComparison && (
          <section className="comp-section comp-animate" style={{ animationDelay: "160ms" }}>
            <h2 className="comp-section-title">Porównanie KPI</h2>
            <div className="comp-kpi-grid">
              {[
                { label: "Skany", a: statsA.kpi.totalScans, b: statsB.kpi.totalScans },
                { label: "Unikalni", a: statsA.kpi.uniqueUsers, b: statsB.kpi.uniqueUsers },
                { label: "Śr/os.", a: statsA.kpi.avgScansPerUser, b: statsB.kpi.avgScansPerUser },
              ].map(({ label, a, b }, i) => {
                const sum = a + b || 1;
                const diff = a - b;
                const diffAbs = Math.abs(diff);
                const isFloat = typeof a === "number" && a % 1 !== 0;
                return (
                  <div key={i} className="comp-kpi-card comp-animate" style={{ animationDelay: `${160 + i * 60}ms` }}>
                    <div className="comp-kpi-label">{label}</div>
                    <div className="comp-kpi-values">
                      <span className="comp-kpi-val comp-kpi-val--a">
                        {isFloat ? a.toFixed(1) : fmtNum(a)}
                      </span>
                      <span className="comp-kpi-vs">vs</span>
                      <span className="comp-kpi-val comp-kpi-val--b">
                        {isFloat ? b.toFixed(1) : fmtNum(b)}
                      </span>
                    </div>
                    <div className="comp-kpi-ratio">
                      <div className="comp-kpi-ratio-a" style={{ width: `${(a / sum) * 100}%` }} />
                      <div className="comp-kpi-ratio-b" style={{ width: `${(b / sum) * 100}%` }} />
                    </div>
                    <div style={{ textAlign: "center", marginTop: 6, fontSize: 11, color: "var(--txt-muted)" }}>
                      {diff === 0 ? (
                        <span>Bez zmian</span>
                      ) : (
                        <span>
                          <span style={{ color: diff > 0 ? "var(--accent)" : "var(--success)", fontWeight: 600 }}>
                            {diff > 0 ? "A" : "B"}
                          </span>
                          {" ma "}
                          <span style={{ fontWeight: 600 }}>
                            {isFloat ? diffAbs.toFixed(1) : fmtNum(diffAbs)}
                          </span>
                          {" więcej"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ══ DETAILED STATS (side by side) ══ */}
        <div className="comp-split">
          {/* ─── Stats A ─── */}
          <div className={`comp-split-col ${mobileTab === "b" ? "comp-split-col--hidden" : ""}`}>
            {loadingA && (
              <div className="comp-panel-section" style={{ textAlign: "center", padding: 40, color: "var(--txt-muted)" }}>
                Ładowanie...
              </div>
            )}
            {!loadingA && statsA && <StatsPanel stats={statsA} variant="a" />}
          </div>
          {/* ─── Stats B ─── */}
          <div className={`comp-split-col ${mobileTab === "a" ? "comp-split-col--hidden" : ""}`}>
            {loadingB && (
              <div className="comp-panel-section" style={{ textAlign: "center", padding: 40, color: "var(--txt-muted)" }}>
                Ładowanie...
              </div>
            )}
            {!loadingB && statsB && <StatsPanel stats={statsB} variant="b" />}
          </div>
        </div>
      </main>
    </div>
  );
}
