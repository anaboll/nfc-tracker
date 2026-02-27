"use client";

/* ------------------------------------------------------------------ */
/*  ViewerDashboard — panel klienta (non-admin)                        */
/*  Reuses extracted card/chart components from admin dashboard         */
/* ------------------------------------------------------------------ */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import type { StatsData, ClientInfo, HourlyData, KPI } from "@/types/dashboard";
import { computeDelta } from "@/lib/periodComparison";
import { formatDate, formatWeekRange, timeAgo, buildHourlyData, buildHeatmapData, buildHeatmapUniqueData } from "@/lib/dashboardHelpers";
import { ViewerDashboardSkeleton } from "@/components/ui/Skeleton";

/* ---- Extracted card / chart components ---- */
import DevicesCard from "@/components/dashboard/cards/DevicesCard";
import TopTagsCard from "@/components/dashboard/cards/TopTagsCard";
import CountriesCard from "@/components/dashboard/cards/CountriesCard";
import CitiesCard from "@/components/dashboard/cards/CitiesCard";
import LanguagesCard from "@/components/dashboard/cards/LanguagesCard";
import NfcChipsCard from "@/components/dashboard/cards/NfcChipsCard";
import HourlyChart from "@/components/dashboard/charts/HourlyChart";
import WeeklyChart from "@/components/dashboard/charts/WeeklyChart";
import ViewerDateRangePicker from "@/components/dashboard/ViewerDateRangePicker";
import ComparisonToggle from "@/components/dashboard/ComparisonToggle";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { getPreviousPeriod } from "@/lib/periodComparison";

/* ------------------------------------------------------------------ */
/*  Tag type used by viewer (subset — API returns more than TagFull)    */
/* ------------------------------------------------------------------ */

interface ViewerTag {
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
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Default sections shown when viewerSections is null (all) */
const ALL_SECTIONS = ["kpi", "vcards", "tags", "hourly", "weekly", "geo", "cities", "languages", "devices", "nfcChips"];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface Props {
  session: Session;
}

export default function ViewerDashboard({ session }: Props) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [tags, setTags] = useState<ViewerTag[]>([]);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingToken, setGeneratingToken] = useState<string | null>(null);
  const [visibleSections, setVisibleSections] = useState<string[]>(ALL_SECTIONS);

  /* -- Date range state -- */
  const [dateFrom, setDateFrom] = useState<string | null>(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [dateTo, setDateTo] = useState<string | null>(null);

  /* -- Hourly chart state -- */
  const [hourlyMode, setHourlyMode] = useState<"bars" | "heatmap">("bars");
  const [hourlyDataMode, setHourlyDataMode] = useState<"both" | "all" | "unique">("both");

  /* -- Period comparison state -- */
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const [previousStats, setPreviousStats] = useState<StatsData | null>(null);

  /* -- Date change handler -- */
  const handleDateChange = useCallback((from: string | null, to: string | null) => {
    setDateFrom(from);
    setDateTo(to);
  }, []);

  /* -- Fetch data -- */
  const fetchAll = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedClientId) params.set("clientId", selectedClientId);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const fetches: Promise<Response>[] = [
        fetch(`/api/stats?${params.toString()}`),
        fetch("/api/tags"),
        fetch("/api/clients"),
        fetch("/api/users/me"),
      ];

      // Comparison: fetch previous period stats in parallel
      let prevFetchIdx = -1;
      if (comparisonEnabled && dateFrom) {
        const periods = getPreviousPeriod(dateFrom, dateTo);
        if (periods) {
          const prevParams = new URLSearchParams();
          prevParams.set("from", periods.previous.from);
          prevParams.set("to", periods.previous.to);
          if (selectedClientId) prevParams.set("clientId", selectedClientId);
          prevFetchIdx = fetches.length;
          fetches.push(fetch(`/api/stats?${prevParams.toString()}`));
        }
      }

      const results = await Promise.all(fetches);

      const [statsRes, tagsRes, clientsRes, meRes] = results;

      if (statsRes.ok) setStats(await statsRes.json());
      if (tagsRes.ok) {
        const allTags: ViewerTag[] = await tagsRes.json();
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

      // Previous period stats
      if (prevFetchIdx >= 0 && results[prevFetchIdx]?.ok) {
        setPreviousStats(await results[prevFetchIdx].json());
      } else {
        setPreviousStats(null);
      }
    } catch (e) {
      console.error("Viewer dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [selectedClientId, dateFrom, dateTo, comparisonEnabled]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /** Check if a section is visible */
  const show = (key: string) => visibleSections.includes(key);

  /* -- Process hourly data using shared helpers -- */
  const hourly: HourlyData[] = useMemo(
    () => buildHourlyData(stats?.hourlyRaw ?? []),
    [stats?.hourlyRaw],
  );

  const heatmapData = useMemo(
    () => buildHeatmapData(stats?.hourlyRaw ?? []),
    [stats?.hourlyRaw],
  );
  const heatmapMax = useMemo(
    () => Math.max(...heatmapData.flat(), 0),
    [heatmapData],
  );
  const heatmapUniqueData = useMemo(
    () => buildHeatmapUniqueData(stats?.hourlyRaw ?? []),
    [stats?.hourlyRaw],
  );
  const heatmapUniqueMax = useMemo(
    () => Math.max(...heatmapUniqueData.flat(), 0),
    [heatmapUniqueData],
  );

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

  /* -- Weekly chart computed -- */
  const maxWeeklyCount = useMemo(
    () => Math.max(...(stats?.weeklyTrend?.data?.map((d) => d.count) ?? [0]), 1),
    [stats?.weeklyTrend],
  );

  if (loading) {
    return (
      <div className="viewer-dashboard">
        <header className="viewer-header">
          <div className="viewer-header-left">
            <h1 className="viewer-logo">
              <span style={{ color: "var(--accent)" }}>Twoje</span>NFC
            </h1>
          </div>
        </header>
        <main className="viewer-main">
          <ViewerDashboardSkeleton />
        </main>
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
          <ThemeToggle />
          <a href="/dashboard/settings" className="viewer-settings-btn" title="Ustawienia">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </a>
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

        {/* Date range picker + comparison toggle */}
        <div className="viewer-filter-row">
          <ViewerDateRangePicker onChange={handleDateChange} />
          <ComparisonToggle
            enabled={comparisonEnabled}
            onChange={setComparisonEnabled}
            disabled={!dateFrom}
          />
        </div>

        {/* KPI Strip */}
        {show("kpi") && stats?.kpi && (
          <ViewerKpiStrip
            kpi={stats.kpi}
            previousKpi={previousStats?.kpi ?? null}
            showComparison={comparisonEnabled}
          />
        )}

        {/* Analytics cards — single 2-column grid, items auto-flow into pairs */}
        <div className="viewer-analytics-grid">
          {show("hourly") && (
            <HourlyChart
              hourly={hourly}
              hourlyMode={hourlyMode}
              setHourlyMode={setHourlyMode}
              hourlyDataMode={hourlyDataMode}
              setHourlyDataMode={setHourlyDataMode}
              heatmapData={heatmapData}
              heatmapMax={heatmapMax}
              heatmapUniqueData={heatmapUniqueData}
              heatmapUniqueMax={heatmapUniqueMax}
            />
          )}

          {show("weekly") && (
            <WeeklyChart
              weekly={stats?.weeklyTrend}
              maxWeeklyCount={maxWeeklyCount}
              formatWeekRange={formatWeekRange}
            />
          )}

          {show("geo") && (
            <CountriesCard topCountries={stats?.topCountries ?? []} />
          )}

          {show("cities") && (
            <CitiesCard topCities={stats?.topCities ?? []} />
          )}

          {show("languages") && (
            <LanguagesCard topLanguages={stats?.topLanguages ?? []} />
          )}

          {show("devices") && (
            <DevicesCard devices={stats?.devices} />
          )}

          {show("tags") && (stats?.topTags?.length ?? 0) > 1 && (
            <TopTagsCard topTags={stats?.topTags?.slice(0, 6) ?? []} />
          )}

          {show("nfcChips") && (stats?.nfcChips?.length ?? 0) > 0 && (
            <NfcChipsCard nfcChips={stats?.nfcChips ?? []} />
          )}
        </div>

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
      </main>

      {/* Footer */}
      <footer className="viewer-footer">
        TwojeNFC &middot; Panel klienta
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ViewerKpiStrip — with optional comparison deltas                    */
/* ------------------------------------------------------------------ */

function ViewerKpiStrip({ kpi, previousKpi, showComparison }: {
  kpi: KPI;
  previousKpi: KPI | null;
  showComparison: boolean;
}) {
  const showDelta = showComparison && previousKpi;

  const items = [
    { value: kpi.totalScans.toLocaleString("pl-PL"), label: "Wszystkie skany", accent: true, deltaKey: "totalScans" as const },
    { value: kpi.uniqueUsers.toLocaleString("pl-PL"), label: "Unikalni uzytkownicy", accent: false, deltaKey: "uniqueUsers" as const },
    { value: kpi.avgScansPerUser.toFixed(1), label: "Skany / uzytkownik", accent: false, deltaKey: "avgScansPerUser" as const },
    { value: timeAgo(kpi.lastScan), label: "Ostatni skan", small: true, deltaKey: null },
  ];

  return (
    <div className="viewer-kpi-strip">
      {items.map((item, i) => {
        const delta = showDelta && item.deltaKey
          ? computeDelta(kpi[item.deltaKey], previousKpi[item.deltaKey])
          : null;
        return (
          <div key={i} className="viewer-kpi-card">
            <div className={`viewer-kpi-accent ${item.accent ? "viewer-kpi-accent--primary" : ""}`} />
            <div className={`viewer-kpi-value ${"small" in item && item.small ? "viewer-kpi-value--small" : ""}`}>
              {item.value}
            </div>
            <div className="viewer-kpi-label">{item.label}</div>
            {delta && (
              <span className={`kpi-delta kpi-delta--${delta.direction}`}>
                {delta.direction === "up" ? "\u2191" : delta.direction === "down" ? "\u2193" : "\u2192"}
                {" "}{Math.abs(delta.changePercent)}%
                <span className="kpi-delta-prev">vs {delta.prevValue.toLocaleString("pl-PL")}</span>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
