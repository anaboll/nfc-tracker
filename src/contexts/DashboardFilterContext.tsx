"use client";

/* ------------------------------------------------------------------ */
/*  DashboardFilterContext                                              */
/*  Holds all filter/UI state for the admin dashboard.                 */
/*  Extracted from src/app/dashboard/page.tsx                          */
/* ------------------------------------------------------------------ */

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/* ---- Types ---- */

export type RangePreset = "today" | "week" | "24h" | "7d" | "30d" | "month" | "custom";

export interface DashboardFilterContextValue {
  /* ---- date/time range ---- */
  dateFrom: string;        setDateFrom: (v: string) => void;
  dateTo: string;          setDateTo: (v: string) => void;
  timeFrom: string;        setTimeFrom: (v: string) => void;
  timeTo: string;          setTimeTo: (v: string) => void;
  rangePreset: RangePreset; setRangePreset: (v: RangePreset) => void;
  weekOffset: number;      setWeekOffset: (v: number) => void;

  /* ---- custom range popover ---- */
  showCustomPopover: boolean; setShowCustomPopover: (v: boolean) => void;
  draftFrom: string;       setDraftFrom: (v: string) => void;
  draftTimeFrom: string;   setDraftTimeFrom: (v: string) => void;
  draftTo: string;         setDraftTo: (v: string) => void;
  draftTimeTo: string;     setDraftTimeTo: (v: string) => void;
  customPopoverRef: React.RefObject<HTMLDivElement>;

  /* ---- entity filters ---- */
  selectedClientId: string | null;     setSelectedClientId: (v: string | null) => void;
  selectedCampaignId: string | null;   setSelectedCampaignId: (v: string | null) => void;
  tagFilter: string;                   setTagFilter: (v: string) => void;
  selectedTagIds: string[];            setSelectedTagIds: (v: string[]) => void;
  actionsMode: "NA" | "ALL" | "SELECTED"; setActionsMode: (v: "NA" | "ALL" | "SELECTED") => void;

  /* ---- scan filters ---- */
  scanSourceFilter: "all" | "nfc" | "qr"; setScanSourceFilter: (v: "all" | "nfc" | "qr") => void;
  scanNfcFilter: string | null;           setScanNfcFilter: (v: string | null) => void;
  scanPage: number;                       setScanPage: (v: number) => void;
  scanSortBy: string;                     setScanSortBy: (v: string) => void;
  scanSortDir: "asc" | "desc";            setScanSortDir: (v: "asc" | "desc") => void;

  /* ---- search fields ---- */
  tagSearch: string;       setTagSearch: (v: string) => void;
  clientSearch: string;    setClientSearch: (v: string) => void;
  campaignSearch: string;  setCampaignSearch: (v: string) => void;

  /* ---- campaign dropdown ---- */
  showCampaignDropdown: boolean; setShowCampaignDropdown: (v: boolean) => void;
  campaignDropdownRef: React.RefObject<HTMLDivElement>;
  campaignDropdownPortalRef: React.RefObject<HTMLDivElement>;
  campaignDropdownPos: { top: number; left: number; width: number } | null;
  setCampaignDropdownPos: (v: { top: number; left: number; width: number } | null) => void;

  /* ---- chips overflow ---- */
  showChipsOverflow: boolean;
  setShowChipsOverflow: (v: boolean | ((prev: boolean) => boolean)) => void;
  chipsOverflowRef: React.RefObject<HTMLDivElement>;

  /* ---- geo/lang pagination ---- */
  countriesPage: number; setCountriesPage: (v: number) => void;
  citiesPage: number;    setCitiesPage: (v: number) => void;
  languagesPage: number; setLanguagesPage: (v: number) => void;

  /* ---- view mode ---- */
  viewMode: "cards" | "table"; setViewMode: (v: "cards" | "table") => void;

  /* ---- mobile sidebar ---- */
  sidebarOpen: boolean; setSidebarOpen: (v: boolean) => void;

  /* ---- hourly chart mode ---- */
  hourlyMode: "bars" | "heatmap"; setHourlyMode: (v: "bars" | "heatmap") => void;
  hourlyDataMode: "both" | "all" | "unique"; setHourlyDataMode: (v: "both" | "all" | "unique") => void;

  /* ---- scan table ---- */
  showScanTable: boolean; setShowScanTable: (v: boolean) => void;
  showGuestsTable: boolean; setShowGuestsTable: (v: boolean) => void;

  /* ---- actions ---- */
  applyPreset: (preset: RangePreset) => void;
  /** Resets ALL filters back to defaults — does NOT fetch data. */
  resetFilterState: () => void;

  /* ---- refs ---- */
  filtersRestoredRef: React.MutableRefObject<boolean>;
  scanTableRef: React.RefObject<HTMLElement>;
}

const DashboardFilterContext = createContext<DashboardFilterContextValue | null>(null);

export function useDashboardFilters(): DashboardFilterContextValue {
  const ctx = useContext(DashboardFilterContext);
  if (!ctx) throw new Error("useDashboardFilters must be used within DashboardFilterProvider");
  return ctx;
}

/* ---- Provider ---- */

export function DashboardFilterProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  /* ---- date/time range ---- */
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [rangePreset, setRangePreset] = useState<RangePreset>("custom");
  const [weekOffset, setWeekOffset] = useState(0);

  /* ---- custom range popover ---- */
  const [showCustomPopover, setShowCustomPopover] = useState(false);
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTimeFrom, setDraftTimeFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [draftTimeTo, setDraftTimeTo] = useState("");
  const customPopoverRef = useRef<HTMLDivElement>(null);

  /* ---- entity filters ---- */
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [actionsMode, setActionsMode] = useState<"NA" | "ALL" | "SELECTED">("NA");

  /* ---- scan filters ---- */
  const [scanSourceFilter, setScanSourceFilter] = useState<"all" | "nfc" | "qr">("all");
  const [scanNfcFilter, setScanNfcFilter] = useState<string | null>(null);
  const [scanPage, setScanPage] = useState(1);
  const [scanSortBy, setScanSortBy] = useState("timestamp");
  const [scanSortDir, setScanSortDir] = useState<"asc" | "desc">("desc");

  /* ---- search fields ---- */
  const [tagSearch, setTagSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [campaignSearch, setCampaignSearch] = useState("");

  /* ---- campaign dropdown ---- */
  const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);
  const campaignDropdownRef = useRef<HTMLDivElement>(null);
  const campaignDropdownPortalRef = useRef<HTMLDivElement>(null);
  const [campaignDropdownPos, setCampaignDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  /* ---- chips overflow ---- */
  const [showChipsOverflow, setShowChipsOverflow] = useState(false);
  const chipsOverflowRef = useRef<HTMLDivElement>(null);

  /* ---- geo/lang pagination ---- */
  const [countriesPage, setCountriesPage] = useState(1);
  const [citiesPage, setCitiesPage] = useState(1);
  const [languagesPage, setLanguagesPage] = useState(1);

  /* ---- view mode ---- */
  const [viewMode, setViewMode] = useState<"cards" | "table">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("actionsViewMode");
      if (saved === "cards" || saved === "table") return saved;
    }
    return "cards";
  });

  /* ---- mobile sidebar ---- */
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ---- hourly chart mode ---- */
  const [hourlyMode, setHourlyMode] = useState<"bars" | "heatmap">("bars");
  const [hourlyDataMode, setHourlyDataMode] = useState<"both" | "all" | "unique">("both");

  /* ---- scan/guests table ---- */
  const [showScanTable, setShowScanTable] = useState(false);
  const [showGuestsTable, setShowGuestsTable] = useState(false);

  /* ---- refs ---- */
  const filtersRestoredRef = useRef(false);
  const scanTableRef = useRef<HTMLElement>(null);

  /* ---- applyPreset ---- */
  const applyPreset = useCallback((preset: RangePreset) => {
    setRangePreset(preset);
    if (preset === "custom") return;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const toTimeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    let from: Date;
    if (preset === "today") {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (preset === "week") {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff, 0, 1, 0);
    } else if (preset === "24h") {
      from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (preset === "7d") {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (preset === "30d") {
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else { // month
      from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    }
    setDateFrom(toDateStr(from));
    setTimeFrom(preset === "month" ? "00:00" : preset === "today" ? "00:00" : preset === "week" ? "00:01" : toTimeStr(from));
    setDateTo(toDateStr(now));
    setTimeTo(toTimeStr(now));
  }, []);

  /* ---- resetFilterState (just resets state, no fetch) ---- */
  const resetFilterState = useCallback(() => {
    setDateFrom("");
    setDateTo("");
    setTimeFrom("");
    setTimeTo("");
    setTagFilter("");
    setSelectedClientId(null);
    setSelectedCampaignId(null);
    setWeekOffset(0);
    setScanSourceFilter("all");
    setScanNfcFilter(null);
    setSelectedTagIds([]);
    setTagSearch("");
    setClientSearch("");
    setCampaignSearch("");
    setShowCampaignDropdown(false);
    setShowChipsOverflow(false);
    setRangePreset("custom");
    router.replace("/dashboard", { scroll: false });
  }, [router]);

  /* ---- restore filters from URL/localStorage on mount ---- */
  useEffect(() => {
    if (filtersRestoredRef.current) return;
    filtersRestoredRef.current = true;
    const urlClient = searchParams.get("client");
    const urlCampaign = searchParams.get("campaign");
    const urlFrom = searchParams.get("from");
    const urlTo = searchParams.get("to");
    const urlTag = searchParams.get("tag");
    const urlTags = searchParams.get("tags");
    const urlRange = searchParams.get("range") as RangePreset | null;
    const hasUrlParams = urlClient || urlCampaign || urlFrom || urlTo || urlTag || urlTags || urlRange;
    if (hasUrlParams) {
      if (urlClient) setSelectedClientId(urlClient);
      if (urlCampaign) {
        setSelectedCampaignId(urlCampaign);
        if (urlTags) {
          const ids = urlTags.split(",").filter(Boolean);
          setSelectedTagIds(ids);
          setActionsMode(ids.length > 0 ? "SELECTED" : "ALL");
        } else {
          setActionsMode("ALL");
        }
      }
      if (urlTag) setTagFilter(urlTag);
      if (urlRange && urlRange !== "custom") {
        setTimeout(() => applyPreset(urlRange), 0);
      } else {
        if (urlRange === "custom" || !urlRange) setRangePreset("custom");
        if (urlFrom) {
          const [d, t] = urlFrom.split("T");
          setDateFrom(d || "");
          if (t) setTimeFrom(t);
        }
        if (urlTo) {
          const [d, t] = urlTo.split("T");
          setDateTo(d || "");
          if (t) setTimeTo(t);
        }
      }
    } else {
      try {
        const saved = localStorage.getItem("nfc_filters");
        if (saved) {
          const f = JSON.parse(saved);
          if (f.clientId) setSelectedClientId(f.clientId);
          if (f.campaignId) {
            setSelectedCampaignId(f.campaignId);
            if (Array.isArray(f.selectedTagIds) && f.selectedTagIds.length > 0) {
              setSelectedTagIds(f.selectedTagIds);
              setActionsMode("SELECTED");
            } else {
              setActionsMode("ALL");
            }
          }
          if (f.tagFilter) setTagFilter(f.tagFilter);
          if (f.rangePreset && f.rangePreset !== "custom") {
            setTimeout(() => applyPreset(f.rangePreset), 0);
          } else {
            if (f.dateFrom) setDateFrom(f.dateFrom);
            if (f.dateTo) setDateTo(f.dateTo);
            if (f.timeFrom) setTimeFrom(f.timeFrom);
            if (f.timeTo) setTimeTo(f.timeTo);
          }
        } else {
          // No saved filters — default to "7d"
          setTimeout(() => applyPreset("7d"), 0);
        }
      } catch {
        setTimeout(() => applyPreset("7d"), 0);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- sync filters to URL + localStorage ---- */
  useEffect(() => {
    if (!filtersRestoredRef.current) return;
    const params = new URLSearchParams();
    if (selectedClientId) params.set("client", selectedClientId);
    if (selectedCampaignId) params.set("campaign", selectedCampaignId);
    if (tagFilter) params.set("tag", tagFilter);
    if (selectedTagIds.length > 0) params.set("tags", selectedTagIds.join(","));
    if (rangePreset !== "custom") {
      params.set("range", rangePreset);
      if (dateFrom) params.set("from", timeFrom ? `${dateFrom}T${timeFrom}` : dateFrom);
      if (dateTo) params.set("to", timeTo ? `${dateTo}T${timeTo}` : dateTo);
    } else {
      if (dateFrom) params.set("from", timeFrom ? `${dateFrom}T${timeFrom}` : dateFrom);
      if (dateTo) params.set("to", timeTo ? `${dateTo}T${timeTo}` : dateTo);
    }
    const qs = params.toString();
    router.replace(qs ? `/dashboard?${qs}` : "/dashboard", { scroll: false });
    try {
      localStorage.setItem("nfc_filters", JSON.stringify({
        clientId: selectedClientId,
        campaignId: selectedCampaignId,
        tagFilter,
        selectedTagIds,
        rangePreset,
        dateFrom,
        dateTo,
        timeFrom,
        timeTo,
      }));
    } catch { /* ignore */ }
  }, [selectedClientId, selectedCampaignId, tagFilter, selectedTagIds, rangePreset, dateFrom, dateTo, timeFrom, timeTo, router]);

  /* ---- persist view mode ---- */
  useEffect(() => {
    localStorage.setItem("actionsViewMode", viewMode);
  }, [viewMode]);

  /* ---- close custom range popover on outside click ---- */
  useEffect(() => {
    if (!showCustomPopover) return;
    const handler = (e: MouseEvent) => {
      if (customPopoverRef.current && !customPopoverRef.current.contains(e.target as Node)) {
        setShowCustomPopover(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showCustomPopover]);

  /* ---- chips overflow outside-click ---- */
  useEffect(() => {
    if (!showChipsOverflow) return;
    const handler = (e: MouseEvent) => {
      if (chipsOverflowRef.current && !chipsOverflowRef.current.contains(e.target as Node)) {
        setShowChipsOverflow(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showChipsOverflow]);

  /* ---- context value ---- */
  const value: DashboardFilterContextValue = {
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    timeFrom, setTimeFrom,
    timeTo, setTimeTo,
    rangePreset, setRangePreset,
    weekOffset, setWeekOffset,
    showCustomPopover, setShowCustomPopover,
    draftFrom, setDraftFrom,
    draftTimeFrom, setDraftTimeFrom,
    draftTo, setDraftTo,
    draftTimeTo, setDraftTimeTo,
    customPopoverRef,
    selectedClientId, setSelectedClientId,
    selectedCampaignId, setSelectedCampaignId,
    tagFilter, setTagFilter,
    selectedTagIds, setSelectedTagIds,
    actionsMode, setActionsMode,
    scanSourceFilter, setScanSourceFilter,
    scanNfcFilter, setScanNfcFilter,
    scanPage, setScanPage,
    scanSortBy, setScanSortBy,
    scanSortDir, setScanSortDir,
    tagSearch, setTagSearch,
    clientSearch, setClientSearch,
    campaignSearch, setCampaignSearch,
    showCampaignDropdown, setShowCampaignDropdown,
    campaignDropdownRef,
    campaignDropdownPortalRef,
    campaignDropdownPos, setCampaignDropdownPos,
    showChipsOverflow, setShowChipsOverflow,
    chipsOverflowRef,
    countriesPage, setCountriesPage,
    citiesPage, setCitiesPage,
    languagesPage, setLanguagesPage,
    viewMode, setViewMode,
    sidebarOpen, setSidebarOpen,
    hourlyMode, setHourlyMode,
    hourlyDataMode, setHourlyDataMode,
    showScanTable, setShowScanTable,
    showGuestsTable, setShowGuestsTable,
    applyPreset,
    resetFilterState,
    filtersRestoredRef,
    scanTableRef,
  };

  return (
    <DashboardFilterContext.Provider value={value}>
      {children}
    </DashboardFilterContext.Provider>
  );
}
