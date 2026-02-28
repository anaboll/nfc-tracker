"use client";

/* ------------------------------------------------------------------ */
/*  DashboardFilterBar — time range presets, source filter, chips     */
/*  Extracted from src/app/dashboard/page.tsx                         */
/* ------------------------------------------------------------------ */

import React from "react";
import { useDashboardFilters } from "@/contexts/DashboardFilterContext";
import FilterChipsBar from "@/components/dashboard/FilterChipsBar";
import ComparisonToggle from "@/components/dashboard/ComparisonToggle";
import type { ComparisonMode } from "@/components/dashboard/ComparisonToggle";
import type { ClientFull, CampaignFull, TagFull, ChipItem } from "@/types/dashboard";

interface Props {
  clients: ClientFull[];
  campaigns: CampaignFull[];
  tags: TagFull[];
  fetchStats: (opts?: { from?: string; to?: string; source?: "all" | "nfc" | "qr"; tagIds?: string[] }) => Promise<void>;
  fetchScans: (opts?: { source?: "all" | "nfc" | "qr"; nfcId?: string | null; page?: number }) => void;
  setLoading: (v: boolean) => void;
  onResetFilters: () => void;
  comparisonEnabled?: boolean;
  comparisonMode?: ComparisonMode;
  onComparisonChange?: (enabled: boolean, mode: ComparisonMode) => void;
}

export default function DashboardFilterBar({
  clients, campaigns, tags,
  fetchStats, fetchScans, setLoading,
  onResetFilters,
  comparisonEnabled = false,
  comparisonMode = "off",
  onComparisonChange,
}: Props) {
  const {
    dateFrom, setDateFrom, dateTo, setDateTo,
    timeFrom, setTimeFrom, timeTo, setTimeTo,
    rangePreset, setRangePreset,
    showCustomPopover, setShowCustomPopover,
    draftFrom, setDraftFrom, draftTimeFrom, setDraftTimeFrom,
    draftTo, setDraftTo, draftTimeTo, setDraftTimeTo,
    customPopoverRef,
    scanSourceFilter, setScanSourceFilter,
    selectedClientId, setSelectedClientId,
    selectedCampaignId, setSelectedCampaignId,
    selectedTagIds, setSelectedTagIds,
    tagFilter, setTagFilter,
    scanNfcFilter, setScanNfcFilter,
    showChipsOverflow, setShowChipsOverflow, chipsOverflowRef,
    showScanTable,
    applyPreset,
  } = useDashboardFilters();

  const handleFilter = async () => {
    setLoading(true);
    await fetchStats();
    setLoading(false);
  };

  return (
    <>
      {/* ---- Filter Bar — time range + source pills ---- */}
      <section
        className="dash-filter-bar"
        style={{ marginBottom: 16, padding: "10px 0", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", borderBottom: "1px solid var(--border)", position: "relative" }}
      >
        {/* Time range preset pills */}
        <div className="dash-time-pills-wrap" style={{ position: "relative", minWidth: 0 }}>
          <div className="dash-time-pills" style={{ display: "flex", gap: 0, background: "var(--bg)", borderRadius: 8, padding: 2, border: "1px solid var(--border)" }}>
            {(["today", "week", "24h", "7d", "30d", "month", "custom"] as const).map((p) => {
              const labels: Record<string, string> = { "today": "Dziś", "week": "Tydzień", "24h": "24h", "7d": "7 dni", "30d": "30 dni", "month": "Miesiąc", "custom": "Zakres ▾" };
              const active = rangePreset === p;
              return (
                <button key={p}
                  onClick={() => {
                    if (p === "custom") {
                      // Pre-fill drafts: use current range or fallback to last 30 days
                      const now = new Date();
                      const ago30 = new Date(now.getTime() - 30 * 86400000);
                      const pad2 = (n: number) => String(n).padStart(2, "0");
                      const toDS = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
                      setDraftFrom(dateFrom || toDS(ago30));
                      setDraftTimeFrom(timeFrom || "00:00");
                      setDraftTo(dateTo || toDS(now));
                      setDraftTimeTo(timeTo || "23:59");
                      setRangePreset("custom");
                      setShowCustomPopover(true);
                    } else {
                      setShowCustomPopover(false);
                      applyPreset(p);
                      setTimeout(() => handleFilter(), 0);
                    }
                  }}
                  style={{
                    padding: "5px 14px", borderRadius: 6, fontSize: 11, fontWeight: active ? 600 : 500, cursor: "pointer",
                    border: "none",
                    background: active ? "var(--surface-2)" : "transparent",
                    color: active ? "var(--txt)" : "var(--txt-muted)",
                    transition: "color 0.15s, background 0.15s",
                  }}
                >{labels[p]}</button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="dash-filter-divider" style={{ width: 1, height: 20, background: "var(--border-hover)", flexShrink: 0 }} />

        {/* Source filter — Wszystkie / NFC / QR */}
        <div className="dash-source-pills" style={{ display: "flex", gap: 0, background: "var(--bg)", borderRadius: 8, padding: 2, border: "1px solid var(--border)", flexShrink: 0 }}>
          {(["all", "nfc", "qr"] as const).map(src => (
            <button key={src} type="button"
              onClick={() => { setScanSourceFilter(src); fetchScans({ source: src, page: 1 }); fetchStats({ source: src }); }}
              style={{
                padding: "4px 10px", fontSize: 11, fontWeight: scanSourceFilter === src ? 600 : 500, border: "none",
                borderRadius: 6,
                cursor: "pointer",
                background: scanSourceFilter === src ? "var(--surface-2)" : "transparent",
                color: scanSourceFilter === src ? "var(--txt)" : "var(--txt-muted)",
                transition: "color 0.15s, background 0.15s",
              }}
            >{src === "all" ? "Wszystkie" : src.toUpperCase()}</button>
          ))}
        </div>

        {/* Comparison toggle */}
        {onComparisonChange && (
          <>
            <div className="dash-filter-divider" style={{ width: 1, height: 20, background: "var(--border-hover)", flexShrink: 0 }} />
            <ComparisonToggle
              enabled={comparisonEnabled}
              mode={comparisonMode}
              onChange={onComparisonChange}
            />
          </>
        )}

        {/* Custom range popover — inside filter bar (position: relative) */}
        {showCustomPopover && (
          <>
            <div className="dash-custom-backdrop" onClick={() => setShowCustomPopover(false)} />
            <div ref={customPopoverRef} className="dash-custom-popover">
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-muted)", textTransform: "uppercase", letterSpacing: 0.8 }}>Niestandardowy zakres</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "var(--txt-sec)", fontWeight: 500 }}>Od</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input type="date" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)}
                    className="dash-custom-date-input"
                    style={{ flex: 1, minWidth: 0, colorScheme: "dark" }} />
                  <input type="time" value={draftTimeFrom} onChange={(e) => setDraftTimeFrom(e.target.value)} placeholder="00:00"
                    style={{ width: 80, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--txt)", borderRadius: 8, padding: "0.5rem 0.4rem", fontSize: "0.875rem", outline: "none", colorScheme: "dark" }} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 11, color: "var(--txt-sec)", fontWeight: 500 }}>Do</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input type="date" value={draftTo} onChange={(e) => setDraftTo(e.target.value)}
                    className="dash-custom-date-input"
                    style={{ flex: 1, minWidth: 0, colorScheme: "dark" }} />
                  <input type="time" value={draftTimeTo} onChange={(e) => setDraftTimeTo(e.target.value)} placeholder="23:59"
                    style={{ width: 80, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--txt)", borderRadius: 8, padding: "0.5rem 0.4rem", fontSize: "0.875rem", outline: "none", colorScheme: "dark" }} />
                </div>
              </div>
              <div className="dash-custom-actions" style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setShowCustomPopover(false)} className="dash-custom-cancel">Anuluj</button>
                <button
                  onClick={async () => {
                    setDateFrom(draftFrom); setTimeFrom(draftTimeFrom);
                    setDateTo(draftTo); setTimeTo(draftTimeTo);
                    setShowCustomPopover(false);
                    const fromStr = draftTimeFrom ? `${draftFrom}T${draftTimeFrom}` : draftFrom;
                    const toStr = draftTimeTo ? `${draftTo}T${draftTimeTo}` : draftTo;
                    setLoading(true);
                    await fetchStats({ from: fromStr || undefined, to: toStr || undefined });
                    setLoading(false);
                  }}
                  className="btn-primary dash-custom-apply"
                >Zastosuj</button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ---- Active Filter Chips ---- */}
      <ActiveFilterChips
        clients={clients}
        campaigns={campaigns}
        tags={tags}
        fetchStats={fetchStats}
        fetchScans={fetchScans}
        onReset={onResetFilters}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  ActiveFilterChips — sub-component for chips bar                   */
/* ------------------------------------------------------------------ */

function ActiveFilterChips({
  clients, campaigns, tags, fetchStats, fetchScans, onReset,
}: {
  clients: ClientFull[];
  campaigns: CampaignFull[];
  tags: TagFull[];
  fetchStats: (opts?: { source?: "all" | "nfc" | "qr"; tagIds?: string[]; from?: string; to?: string }) => void;
  fetchScans: (opts?: { source?: "all" | "nfc" | "qr"; nfcId?: string | null; page?: number }) => void;
  onReset: () => void;
}) {
  const {
    dateFrom, setDateFrom, dateTo, setDateTo,
    timeFrom, setTimeFrom, timeTo, setTimeTo,
    rangePreset, setRangePreset,
    selectedClientId, setSelectedClientId,
    selectedCampaignId, setSelectedCampaignId,
    selectedTagIds, setSelectedTagIds,
    tagFilter, setTagFilter,
    scanSourceFilter, setScanSourceFilter,
    scanNfcFilter, setScanNfcFilter,
    showChipsOverflow, setShowChipsOverflow, chipsOverflowRef,
    showScanTable,
  } = useDashboardFilters();

  // ---- shared chip style helpers ----
  const cs = (color: string, bg: string, bdr: string): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
    color, background: bg, border: `1px solid ${bdr}`, whiteSpace: "nowrap",
  });
  const xb = (onClick: () => void, color: string) => (
    <button onClick={onClick} style={{ background: "none", border: "none", color, cursor: "pointer", fontSize: 12, padding: 0, lineHeight: 1, opacity: 0.7, flexShrink: 0 }}>×</button>
  );

  // ---- build ordered, deduplicated chip list ----
  const chips: ChipItem[] = [];

  // 1. Time range — show chip for ANY active preset (custom or named)
  const presetLabels: Record<string, string> = { "today": "Dziś", "week": "Tydzień", "24h": "24h", "7d": "7 dni", "30d": "30 dni", "month": "Miesiąc" };
  const hasCustomDate = rangePreset === "custom" && (dateFrom || dateTo);
  const hasNamedPreset = rangePreset !== "custom" && rangePreset in presetLabels;

  if (hasCustomDate) {
    chips.push({
      key: "timeRange",
      node: (
        <span style={cs("#38BDF8", "rgba(0,200,160,0.1)", "rgba(0,200,160,0.3)")}>
          📅 {dateFrom ? dateFrom.slice(5) : "…"}{timeFrom ? ` ${timeFrom}` : ""} → {dateTo ? dateTo.slice(5) : "…"}{timeTo ? ` ${timeTo}` : ""}
          {xb(() => { setDateFrom(""); setDateTo(""); setTimeFrom(""); setTimeTo(""); }, "#38BDF8")}
        </span>
      ),
    });
  } else if (hasNamedPreset) {
    chips.push({
      key: "timeRange",
      node: (
        <span style={cs("#38BDF8", "rgba(0,200,160,0.1)", "rgba(0,200,160,0.3)")}>
          📅 {presetLabels[rangePreset]}
          {xb(() => {
            setDateFrom("");
            setDateTo("");
            setTimeFrom("");
            setTimeTo("");
            setRangePreset("custom");
            // Pass explicit empty from/to to override stale context values
            fetchStats({ from: "", to: "" });
            fetchScans({ page: 1 });
          }, "#38BDF8")}
        </span>
      ),
    });
  }

  // 2. Client
  if (selectedClientId) {
    const cl = clients.find(c => c.id === selectedClientId);
    if (cl) chips.push({
      key: `client:${cl.id}`,
      node: (
        <span style={cs(cl.color || "#7dd3fc", `${cl.color || "#38BDF8"}18`, `${cl.color || "#38BDF8"}40`)}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: cl.color || "#38BDF8", display: "inline-block", flexShrink: 0 }} />
          {cl.name}
          {xb(() => { setSelectedClientId(null); setSelectedCampaignId(null); setSelectedTagIds([]); }, cl.color || "#7dd3fc")}
        </span>
      ),
    });
  }

  // 3. Campaign
  if (selectedCampaignId) {
    const cp = campaigns.find(c => c.id === selectedCampaignId);
    if (cp) chips.push({
      key: `campaign:${cp.id}`,
      node: (
        <span style={cs("#60a5fa", "rgba(96,165,250,0.1)", "rgba(96,165,250,0.3)")}>
          📁 {cp.name}
          {xb(() => { setSelectedCampaignId(null); setSelectedTagIds([]); }, "#60a5fa")}
        </span>
      ),
    });
  }

  // 4. Selected actions (multi)
  const seenTagIds = new Set<string>();
  for (const tid of selectedTagIds) {
    if (seenTagIds.has(tid)) continue;
    seenTagIds.add(tid);
    const t = tags.find(x => x.id === tid);
    if (!t) continue;
    chips.push({
      key: `action:${tid}`,
      node: (
        <span style={cs("#7dd3fc", "rgba(0,200,160,0.1)", "rgba(0,200,160,0.3)")}>
          {t.name}
          {xb(() => {
            const next = selectedTagIds.filter(id => id !== tid);
            setSelectedTagIds(next);
            fetchStats({ tagIds: next });
            if (showScanTable) fetchScans();
          }, "#7dd3fc")}
        </span>
      ),
    });
  }

  // 5. Single tagFilter (drill-down from scan table)
  if (tagFilter && !seenTagIds.has(tagFilter)) {
    const t = tags.find(x => x.id === tagFilter);
    chips.push({
      key: `action:${tagFilter}`,
      node: (
        <span style={cs("#7dd3fc", "rgba(0,200,160,0.1)", "rgba(0,200,160,0.3)")}>
          {t?.name ?? tagFilter}
          {xb(() => setTagFilter(""), "#7dd3fc")}
        </span>
      ),
    });
  }

  // 6. Source filter
  if (scanSourceFilter !== "all") {
    const col = scanSourceFilter === "qr" ? "#10b981" : "#7dd3fc";
    chips.push({
      key: `source:${scanSourceFilter}`,
      node: (
        <span style={cs(col, scanSourceFilter === "qr" ? "rgba(16,185,129,0.1)" : "rgba(0,200,160,0.1)", scanSourceFilter === "qr" ? "rgba(16,185,129,0.3)" : "rgba(0,200,160,0.3)")}>
          {scanSourceFilter.toUpperCase()}
          {xb(() => { setScanSourceFilter("all"); fetchStats({ source: "all" }); fetchScans({ source: "all" }); }, col)}
        </span>
      ),
    });
  }

  // 7. NFC chip filter
  if (scanNfcFilter) {
    chips.push({
      key: `nfc:${scanNfcFilter}`,
      node: (
        <span style={cs("#a78bfa", "rgba(139,92,246,0.1)", "rgba(139,92,246,0.3)")}>
          NFC: {scanNfcFilter}
          {xb(() => { setScanNfcFilter(null); fetchScans({ nfcId: null, page: 1 }); }, "#a78bfa")}
        </span>
      ),
    });
  }

  if (chips.length === 0) return null;

  return (
    <FilterChipsBar
      chips={chips}
      onReset={onReset}
      showOverflow={showChipsOverflow}
      setShowOverflow={setShowChipsOverflow}
      overflowRef={chipsOverflowRef}
    />
  );
}
