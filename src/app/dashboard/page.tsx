"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import ReactDOM from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { getCountryFlag } from "@/lib/utils";
import { ActionEditor } from "@/components/actions/ActionEditor";
import { ActionsTable, CtxMenuPortal } from "@/components/actions/ActionsTable";
import { UsersPanel } from "@/components/users/UsersPanel";
import { useToast } from "@/components/ui/Toast";
import ViewerDashboard from "@/components/dashboard/ViewerDashboard";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
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

interface Country {
  country: string;
  count: number;
  uniqueUsers: number;
  percent: number;
}

interface City {
  city: string;
  country: string;
  count: number;
  uniqueUsers: number;
}

interface Language {
  lang: string;
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

interface WeeklyTrend {
  data: WeekDay[];
  weekStart: string;
  weekEnd: string;
}

interface NfcChip {
  nfcId: string;
  count: number;
}

interface HourlyData {
  hour: number;
  count: number;
  uniqueUsers: number;
}

interface HourlyRawEntry {
  t: string;
  ip: string;
}

interface StatsData {
  kpi: KPI;
  devices: Devices;
  topTags: TopTag[];
  topCountries: Country[];
  topCities: City[];
  topLanguages: Language[];
  nfcChips: NfcChip[];
  weeklyTrend: WeeklyTrend;
  hourlyRaw: HourlyRawEntry[];
  allTags: { id: string; name: string }[];
}

interface CampaignInfo {
  id: string;
  name: string;
}

interface CampaignFull extends CampaignInfo {
  description: string | null;
  clientId: string;
  client: ClientInfo;
  isActive: boolean;
  tagCount: number;
  scanCount: number;
}

interface ScanRow {
  seq: number;
  id: string;
  tagId: string;
  tagName: string;
  tagType: string;
  timestamp: string;
  nfcId: string | null;
  deviceType: string;
  country: string | null;
  city: string | null;
  region: string | null;
  browserLang: string | null;
  isReturning: boolean;
  eventSource: string | null;
  guestKey: string | null;
  ipHash: string | null;
}

interface ScansResponse {
  rows: ScanRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface TagLink {
  label: string;
  url: string;
  icon: string;
}

interface VCardData {
  firstName: string;
  lastName: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  tiktok?: string;
  youtube?: string;
  whatsapp?: string;
  telegram?: string;
  note?: string;
}

interface LinkClickStat {
  linkUrl: string;
  linkLabel: string | null;
  linkIcon: string | null;
  clicks: number;
  percent: number;
}

interface LinkClickData {
  tagId: string;
  total: number;
  links: LinkClickStat[];
}

interface VideoStats {
  tagId: string;
  plays: number;
  pauses: number;
  completions: number;
  progress25: number;
  progress50: number;
  progress75: number;
  progress100: number;
  avgWatchTime: number | null;
  maxWatchTime: number | null;
}

interface ClientInfo {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface ClientFull extends ClientInfo {
  description: string | null;
  isActive: boolean;
  tagCount: number;
  scanCount: number;
}

interface TagFull {
  id: string;
  name: string;
  targetUrl: string;
  description: string | null;
  videoFile: string | null;
  isActive: boolean;
  tagType: string;
  links: TagLink[] | null;
  clientId: string | null;
  client: ClientInfo | null;
  campaignId: string | null;
  campaign: CampaignInfo | null;
  _count: { scans: number };
}

/* ------------------------------------------------------------------ */
/*  FilterChipsBar — measures real overflow, shows +N only when needed */
/* ------------------------------------------------------------------ */

interface ChipItem { key: string; node: React.ReactNode; }

interface FilterChipsBarProps {
  chips: ChipItem[];
  onReset: () => void;
  showOverflow: boolean;
  setShowOverflow: (v: boolean | ((prev: boolean) => boolean)) => void;
  overflowRef: React.RefObject<HTMLDivElement>;
}

function FilterChipsBar({ chips, onReset, showOverflow, setShowOverflow, overflowRef }: FilterChipsBarProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cutAtRef = useRef<number>(chips.length);
  const [cutAt, setCutAtState] = useState<number>(chips.length);

  // Stable setter that avoids re-render when value hasn't changed
  const setCutAt = (n: number) => {
    if (cutAtRef.current !== n) {
      cutAtRef.current = n;
      setCutAtState(n);
    }
  };

  // Stable chip identity key — changes only when the set of chip keys changes
  const chipsKey = chips.map(c => c.key).join(",");

  // Measure layout: find how many chips fit in row 1
  useEffect(() => {
    function measure() {
      const els = chipRefs.current;
      const total = chips.length;
      if (!els.length || !els[0]) { setCutAt(total); return; }

      const firstTop = els[0].getBoundingClientRect().top;

      let cut = total;
      for (let i = 1; i < total; i++) {
        const el = els[i];
        if (!el) continue;
        if (el.getBoundingClientRect().top > firstTop + 4) { cut = i; break; }
      }
      setCutAt(cut);
    }

    // Measure after first paint
    const raf = requestAnimationFrame(measure);

    // Watch for container width changes (resize) — covers all future layout changes
    const ro = new ResizeObserver(measure);
    if (rowRef.current) ro.observe(rowRef.current);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chipsKey]); // re-run only when chip set changes (stable string key)

  const visibleChips = cutAt < chips.length ? chips.slice(0, cutAt) : chips;
  const overflowChips = cutAt < chips.length ? chips.slice(cutAt) : [];

  if (chips.length === 0) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, padding: "8px 12px", borderRadius: 10, background: "#151D35", border: "1px solid rgba(148,163,184,0.08)", minWidth: 0 }}>
      <span style={{ fontSize: 10, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, flexShrink: 0 }}>Filtry:</span>

      {/* Chip row — flex-wrap:wrap so all chips are rendered; we measure which ones overflow */}
      <div ref={rowRef} style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: 1, minWidth: 0, overflow: "hidden", maxHeight: 32 }}>
        {chips.map((ch, i) => (
          <div
            key={ch.key}
            ref={el => { chipRefs.current[i] = el; }}
            style={{ display: "inline-flex", flexShrink: 0 }}
          >
            {ch.node}
          </div>
        ))}
      </div>

      {/* +N overflow button — only rendered when cutAt < chips.length */}
      {overflowChips.length > 0 && (
        <div ref={overflowRef} style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
          <button
            onClick={() => setShowOverflow(v => !v)}
            style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 20, background: "rgba(139,149,168,0.12)", border: "1px solid #363b48", fontSize: 11, color: "#94A3B8", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
          >+{overflowChips.length}</button>
          {showOverflow && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 400,
              background: "#161a22", border: "1px solid #363b48", borderRadius: 10,
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)", padding: "10px",
              display: "flex", flexDirection: "column", gap: 6, minWidth: 200, maxWidth: 280,
            }}>
              <div style={{ fontSize: 10, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>
                Pozostałe filtry ({overflowChips.length})
              </div>
              {overflowChips.map(ch => (
                <React.Fragment key={`ov:${ch.key}`}>{ch.node}</React.Fragment>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Wyczyść — always last */}
      <button
        onClick={onReset}
        style={{ marginLeft: overflowChips.length === 0 ? "auto" : 0, flexShrink: 0, background: "transparent", border: "none", fontSize: 10, color: "#3d4250", cursor: "pointer", padding: "2px 6px", borderRadius: 4 }}
        onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
        onMouseLeave={e => (e.currentTarget.style.color = "#3d4250")}
      >Wyczyść ×</button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton loader                                                    */
/* ------------------------------------------------------------------ */

function DashboardSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: "#0B0F1A" }}>
      {/* fake header */}
      <div style={{ height: 56, background: "#151D35", borderBottom: "1px solid rgba(148,163,184,0.08)", display: "flex", alignItems: "center", padding: "0 24px", gap: 12 }}>
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 10 }} />
        <div className="skeleton skeleton-text" style={{ width: 100, height: 20, marginBottom: 0 }} />
      </div>
      {/* fake content */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 24px 64px", display: "flex", gap: 20 }}>
        {/* sidebar skeleton */}
        <div style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="skeleton skeleton-card" style={{ height: 160 }} />
          <div className="skeleton skeleton-card" style={{ height: 120 }} />
          <div className="skeleton skeleton-card" style={{ height: 80 }} />
        </div>
        {/* main skeleton */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* KPI row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[1,2,3,4].map(i => (
              <div key={i} className="skeleton skeleton-card" style={{ height: 100 }} />
            ))}
          </div>
          {/* chart area */}
          <div className="skeleton skeleton-card" style={{ height: 240 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="skeleton skeleton-card" style={{ height: 180 }} />
            <div className="skeleton skeleton-card" style={{ height: 180 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DashboardWrapper() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardPage />
    </Suspense>
  );
}

function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const isAdmin = session?.user?.role === "admin";

  /* ---- state ---- */
  const [stats, setStats] = useState<StatsData | null>(null);
  const [tags, setTags] = useState<TagFull[]>([]);
  const [clients, setClients] = useState<ClientFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // client management
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null); // null = all clients
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientDesc, setNewClientDesc] = useState("");
  const [newClientColor, setNewClientColor] = useState("#38BDF8");
  const [clientCreating, setClientCreating] = useState(false);

  // campaigns
  const [campaigns, setCampaigns] = useState<CampaignFull[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignDesc, setNewCampaignDesc] = useState("");
  const [campaignCreating, setCampaignCreating] = useState(false);

  // filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [rangePreset, setRangePreset] = useState<"today" | "week" | "24h" | "7d" | "30d" | "month" | "custom">("custom");
  const [weekOffset, setWeekOffset] = useState(0);
  // custom range popover
  const [showCustomPopover, setShowCustomPopover] = useState(false);
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTimeFrom, setDraftTimeFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [draftTimeTo, setDraftTimeTo] = useState("");
  const customPopoverRef = useRef<HTMLDivElement>(null);
  const filtersRestoredRef = useRef(false);
  const scanTableRef = useRef<HTMLElement>(null);

  // new-tag drawer
  const [showNewTagDrawer, setShowNewTagDrawer] = useState(false);
  const [drawerIsClosing, setDrawerIsClosing] = useState(false);

  // change‑password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  // users panel
  const [usersPanelOpen, setUsersPanelOpen] = useState(false);

  // create tag
  const [newTagId, setNewTagId] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [newTagClient, setNewTagClient] = useState("");
  const [newTagCampaign, setNewTagCampaign] = useState("");
  const [newTagUrl, setNewTagUrl] = useState("");
  const [newTagDesc, setNewTagDesc] = useState("");
  const [newTagType, setNewTagType] = useState("url");
  const [newTagChannel, setNewTagChannel] = useState<"nfc" | "qr">("nfc");
  const [newTagLinks, setNewTagLinks] = useState<TagLink[]>([{ label: "", url: "", icon: "link" }]);
  const [newVCard, setNewVCard] = useState<VCardData>({ firstName: "", lastName: "" });
  const [tagCreating, setTagCreating] = useState(false);
  const [tagCreateError, setTagCreateError] = useState("");
  const [tagCreateSuccess, setTagCreateSuccess] = useState("");
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const [lastCreatedChannel, setLastCreatedChannel] = useState<"nfc" | "qr">("nfc");
  // copy-link toast
  const [copyToast, setCopyToast] = useState(false);
  const copyToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // per-card copy feedback
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);
  const copiedCardTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // hourly chart mode
  const [hourlyMode, setHourlyMode] = useState<"bars" | "heatmap">("bars");
  const [hourlyDataMode, setHourlyDataMode] = useState<"both" | "all" | "unique">("both");

  // geo pagination
  const [countriesPage, setCountriesPage] = useState(1);
  const [citiesPage, setCitiesPage] = useState(1);
  const [languagesPage, setLanguagesPage] = useState(1);

  // raw scan table
  const [scanData, setScanData] = useState<ScansResponse | null>(null);
  const [scanPage, setScanPage] = useState(1);
  const [scanSortBy, setScanSortBy] = useState("timestamp");
  const [scanSortDir, setScanSortDir] = useState<"asc" | "desc">("desc");
  const [scanNfcFilter, setScanNfcFilter] = useState<string | null>(null);
  const [scanSourceFilter, setScanSourceFilter] = useState<"all" | "nfc" | "qr">("all");
  // Multi-select tag filter (empty = all tags in current campaign/client scope)
  // actionsMode: "NA" = campaign not selected (filter locked); "ALL" = campaign selected, all its actions; "SELECTED" = specific actions chosen
  const [actionsMode, setActionsMode] = useState<"NA" | "ALL" | "SELECTED">("NA");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [scanLoading, setScanLoading] = useState(false);
  const [showScanTable, setShowScanTable] = useState(false);
  // Guest modal state
  const [guestModal, setGuestModal] = useState<{ ipHash: string; guestKey: string } | null>(null);
  const [guestScans, setGuestScans] = useState<ScanRow[]>([]);
  const [guestLoading, setGuestLoading] = useState(false);
  // Top Goście section
  const [showGuestsTable, setShowGuestsTable] = useState(false);
  const [guestsData, setGuestsData] = useState<{ rank: number; ipHash: string; guestKey: string; scanCount: number; uniqueActions: number; lastSeen: string; deviceType: string; city: string | null; country: string | null; source: string }[]>([]);
  const [guestsTotal, setGuestsTotal] = useState(0);
  const [guestsLoading, setGuestsLoading] = useState(false);
  // actions search (inline list, no dropdown)
  const [tagSearch, setTagSearch] = useState("");
  // client inline list search
  const [clientSearch, setClientSearch] = useState("");
  // campaign combobox
  const [campaignSearch, setCampaignSearch] = useState("");
  const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);
  const campaignDropdownRef = useRef<HTMLDivElement>(null);
  const campaignDropdownPortalRef = useRef<HTMLDivElement>(null);
  const [campaignDropdownPos, setCampaignDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  // chips overflow popover
  const [showChipsOverflow, setShowChipsOverflow] = useState(false);
  const chipsOverflowRef = useRef<HTMLDivElement>(null);

  // editing
  const [editingAction, setEditingAction] = useState<TagFull | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editType, setEditType] = useState("url");
  const [editTagLinks, setEditTagLinks] = useState<TagLink[]>([]);
  const [editVCard, setEditVCard] = useState<VCardData>({ firstName: "", lastName: "" });
  const [editChannel, setEditChannel] = useState<"nfc" | "qr">("nfc");

  // inline link editing for multilink tags
  const [editingLinksTagId, setEditingLinksTagId] = useState<string | null>(null);
  const [editLinks, setEditLinks] = useState<TagLink[]>([]);
  const [editLinksSaving, setEditLinksSaving] = useState(false);

  // reset stats
  const [resetAllConfirm, setResetAllConfirm] = useState(false);
  const [resetTagConfirm, setResetTagConfirm] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  // upload
  const [uploadingTagId, setUploadingTagId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState("");

  // context menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const openCardMenu = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (openMenuId === id) {
      setOpenMenuId(null);
      setMenuRect(null);
    } else {
      setMenuRect((e.currentTarget as HTMLButtonElement).getBoundingClientRect());
      setOpenMenuId(id);
    }
  };

  const closeCardMenu = () => {
    setOpenMenuId(null);
    setMenuRect(null);
  };

  // view mode: cards | table
  const [viewMode, setViewMode] = useState<"cards" | "table">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("actionsViewMode");
      if (saved === "cards" || saved === "table") return saved;
    }
    return "cards";
  });

  // link click stats
  const [linkClickStats, setLinkClickStats] = useState<Record<string, LinkClickData>>({});
  const [expandedLinkStats, setExpandedLinkStats] = useState<string | null>(null);

  // video stats
  const [videoStats, setVideoStats] = useState<Record<string, VideoStats>>({});
  const [expandedVideoStats, setExpandedVideoStats] = useState<string | null>(null);

  // video retention chart (shown in analytics section when video campaign selected)
  const [selectedVideoRetention, setSelectedVideoRetention] = useState<VideoStats | null>(null);

  // management panel
  const [manageLoading, setManageLoading] = useState(false);
  const [manageMsg, setManageMsg] = useState("");
  // cascade delete confirmations (2-step)
  const [cascadeDeleteCampaignId, setCascadeDeleteCampaignId] = useState<string | null>(null);
  const [cascadeDeleteCampaignPreview, setCascadeDeleteCampaignPreview] = useState<{ campaignName: string; tagsCount: number; tagNames: string[]; scanCount: number; clickCount: number; eventCount: number } | null>(null);
  const [cascadeDeleteClientId, setCascadeDeleteClientId] = useState<string | null>(null);
  const [cascadeDeleteClientPreview, setCascadeDeleteClientPreview] = useState<{ clientName: string; campaignsCount: number; campaignNames: string[]; tagsCount: number; tagNames: string[]; scanCount: number; clickCount: number; eventCount: number } | null>(null);
  const [resetClientStatsId, setResetClientStatsId] = useState<string | null>(null);
  // reassign tag
  const [reassignTagId, setReassignTagId] = useState<string | null>(null);
  const [reassignCampaignId, setReassignCampaignId] = useState("");
  // clone tag
  const [cloneSourceTag, setCloneSourceTag] = useState<string | null>(null);
  const [cloneNewId, setCloneNewId] = useState("");
  const [cloneTargetClient, setCloneTargetClient] = useState("");
  const [cloneTargetCampaign, setCloneTargetCampaign] = useState("");
  // manage filter
  const [manageCampaignFilter, setManageCampaignFilter] = useState<string | null>(null);

  // bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);
  const [bulkMoveCampaignId, setBulkMoveCampaignId] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState("");

  /* ---- fetch helpers ---- */

  const fetchStats = useCallback(async (opts?: { wo?: number; source?: "all" | "nfc" | "qr"; tagIds?: string[]; from?: string; to?: string }) => {
    try {
      setFetchError("");
      const params = new URLSearchParams();
      const effectiveFrom = opts?.from !== undefined ? opts.from : (dateFrom ? (timeFrom ? `${dateFrom}T${timeFrom}` : dateFrom) : "");
      const effectiveTo = opts?.to !== undefined ? opts.to : (dateTo ? (timeTo ? `${dateTo}T${timeTo}` : dateTo) : "");
      if (effectiveFrom) params.set("from", effectiveFrom);
      if (effectiveTo) params.set("to", effectiveTo);
      // Multi-tag filter takes precedence over single tagFilter
      const effectiveTagIds = opts?.tagIds !== undefined ? opts.tagIds : selectedTagIds;
      if (effectiveTagIds.length > 0) {
        params.set("tags", effectiveTagIds.join(","));
      } else if (tagFilter) {
        params.set("tag", tagFilter);
      }
      if (selectedClientId) params.set("clientId", selectedClientId);
      if (selectedCampaignId) params.set("campaignId", selectedCampaignId);
      params.set("weekOffset", String(opts?.wo ?? weekOffset));
      // Use opts.source if provided (avoids stale closure after setScanSourceFilter)
      const effectiveSource = opts?.source !== undefined ? opts.source : scanSourceFilter;
      if (effectiveSource !== "all") params.set("source", effectiveSource);
      const res = await fetch(`/api/stats?${params.toString()}`);
      if (res.ok) {
        const data: StatsData = await res.json();
        setStats(data);
      } else {
        const errText = await res.text();
        setFetchError(`Stats API error ${res.status}: ${errText.substring(0, 200)}`);
        console.error("Stats API error:", res.status, errText);
      }
    } catch (e) {
      setFetchError(`Blad polaczenia: ${e}`);
      console.error("Stats fetch failed:", e);
    }
  }, [dateFrom, dateTo, timeFrom, timeTo, tagFilter, weekOffset, selectedClientId, selectedCampaignId, scanSourceFilter, selectedTagIds]);

  const fetchScans = useCallback(async (opts?: { page?: number; sortBy?: string; sortDir?: "asc" | "desc"; nfcId?: string | null; source?: "all" | "nfc" | "qr" }) => {
    setScanLoading(true);
    try {
      const p = opts?.page ?? scanPage;
      const sb = opts?.sortBy ?? scanSortBy;
      const sd = opts?.sortDir ?? scanSortDir;
      const nfc = opts?.nfcId !== undefined ? opts.nfcId : scanNfcFilter;
      const src = opts?.source !== undefined ? opts.source : scanSourceFilter;
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("limit", "50");
      params.set("sortBy", sb);
      params.set("sortDir", sd);
      if (selectedTagIds.length > 0) {
        params.set("tags", selectedTagIds.join(","));
      } else if (tagFilter) {
        params.set("tagId", tagFilter);
      }
      if (selectedCampaignId) params.set("campaignId", selectedCampaignId);
      if (selectedClientId) params.set("clientId", selectedClientId);
      if (nfc) params.set("nfcId", nfc);
      if (src !== "all") params.set("source", src);
      if (dateFrom) params.set("from", timeFrom ? `${dateFrom}T${timeFrom}` : dateFrom);
      if (dateTo) params.set("to", timeTo ? `${dateTo}T${timeTo}` : dateTo);
      const res = await fetch(`/api/scans?${params.toString()}`);
      if (res.ok) {
        setScanData(await res.json());
      }
    } catch (e) { console.error("Scans fetch failed:", e); }
    finally { setScanLoading(false); }
  }, [scanPage, scanSortBy, scanSortDir, scanNfcFilter, scanSourceFilter, tagFilter, selectedTagIds, selectedClientId, selectedCampaignId, dateFrom, dateTo, timeFrom, timeTo]);

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch("/api/tags");
      if (res.ok) {
        const data: TagFull[] = await res.json();
        setTags(data);
      }
    } catch (e) {
      console.error("Tags fetch failed:", e);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data: ClientFull[] = await res.json();
        setClients(data);
      }
    } catch (e) {
      console.error("Clients fetch failed:", e);
    }
  }, []);

  const fetchCampaigns = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedClientId) params.set("clientId", selectedClientId);
      const res = await fetch(`/api/campaigns?${params.toString()}`);
      if (res.ok) {
        const data: CampaignFull[] = await res.json();
        setCampaigns(data);
      }
    } catch (e) {
      console.error("Campaigns fetch failed:", e);
    }
  }, [selectedClientId]);

  const fetchLinkClicks = useCallback(async (tagId: string) => {
    try {
      const res = await fetch(`/api/link-click?tagId=${encodeURIComponent(tagId)}`);
      if (res.ok) {
        const data: LinkClickData = await res.json();
        setLinkClickStats(prev => ({ ...prev, [tagId]: data }));
      }
    } catch (e) {
      console.error("LinkClick fetch failed:", e);
    }
  }, []);

  const toggleLinkStats = useCallback((tagId: string) => {
    if (expandedLinkStats === tagId) {
      setExpandedLinkStats(null);
    } else {
      setExpandedLinkStats(tagId);
      if (!linkClickStats[tagId]) {
        fetchLinkClicks(tagId);
      }
    }
  }, [expandedLinkStats, linkClickStats, fetchLinkClicks]);

  const fetchVideoStats = useCallback(async (tagId: string) => {
    try {
      const res = await fetch(`/api/video-event?tagId=${encodeURIComponent(tagId)}`);
      if (res.ok) {
        const data: VideoStats = await res.json();
        setVideoStats(prev => ({ ...prev, [tagId]: data }));
      }
    } catch (e) {
      console.error("VideoStats fetch failed:", e);
    }
  }, []);

  const toggleVideoStats = useCallback((tagId: string) => {
    if (expandedVideoStats === tagId) {
      setExpandedVideoStats(null);
    } else {
      setExpandedVideoStats(tagId);
      if (!videoStats[tagId]) {
        fetchVideoStats(tagId);
      }
    }
  }, [expandedVideoStats, videoStats, fetchVideoStats]);

  const formatWatchTime = (seconds: number | null) => {
    if (seconds == null) return "---";
    if (seconds < 60) return `${seconds}s`;
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}m ${sec}s`;
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchTags(), fetchClients(), fetchCampaigns()]);
    setLoading(false);
  }, [fetchStats, fetchTags, fetchClients, fetchCampaigns]);

  /* ---- auto-load video retention when a single video tag is active ---- */
  useEffect(() => {
    // Determine the single active video tag:
    // priority 1 — tagFilter (dropdown), priority 2 — exactly 1 selectedTagId that is video
    let videoTagId: string | null = null;
    if (tagFilter) {
      const t = tags.find(x => x.id === tagFilter);
      if (t?.tagType === "video") videoTagId = tagFilter;
    } else if (selectedTagIds.length === 1) {
      const t = tags.find(x => x.id === selectedTagIds[0]);
      if (t?.tagType === "video") videoTagId = selectedTagIds[0];
    }
    if (videoTagId) {
      fetch(`/api/video-event?tagId=${encodeURIComponent(videoTagId)}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setSelectedVideoRetention(data); })
        .catch(() => {});
    } else {
      setSelectedVideoRetention(null);
    }
  }, [tagFilter, selectedTagIds, tags]);

  /* ---- restore filters from URL params (priority) or localStorage on mount ---- */
  useEffect(() => {
    if (filtersRestoredRef.current) return;
    filtersRestoredRef.current = true;
    const urlClient = searchParams.get("client");
    const urlCampaign = searchParams.get("campaign");
    const urlFrom = searchParams.get("from");
    const urlTo = searchParams.get("to");
    const urlTag = searchParams.get("tag");
    const urlTags = searchParams.get("tags");
    const urlRange = searchParams.get("range") as "today" | "week" | "24h" | "7d" | "30d" | "month" | "custom" | null;
    const hasUrlParams = urlClient || urlCampaign || urlFrom || urlTo || urlTag || urlTags || urlRange;
    if (hasUrlParams) {
      if (urlClient) setSelectedClientId(urlClient);
      if (urlCampaign) {
        setSelectedCampaignId(urlCampaign);
        // Restore action tags only when a campaign is present
        if (urlTags) {
          const ids = urlTags.split(",").filter(Boolean);
          setSelectedTagIds(ids);
          setActionsMode(ids.length > 0 ? "SELECTED" : "ALL");
        } else {
          setActionsMode("ALL");
        }
      }
      // urlTags without urlCampaign is intentionally ignored (actionsMode stays "NA")
      if (urlTag) setTagFilter(urlTag);
      if (urlRange && urlRange !== "custom") {
        // Re-apply preset on load (recomputes from/to to "now minus X")
        // We call applyPreset after mount via a tiny timeout so state is ready
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
            // Restore action tags only when a campaign is present
            if (Array.isArray(f.selectedTagIds) && f.selectedTagIds.length > 0) {
              setSelectedTagIds(f.selectedTagIds);
              setActionsMode("SELECTED");
            } else {
              setActionsMode("ALL");
            }
          }
          // f.selectedTagIds without f.campaignId is intentionally ignored
          if (f.tagFilter) setTagFilter(f.tagFilter);
          if (f.rangePreset && f.rangePreset !== "custom") {
            setTimeout(() => applyPreset(f.rangePreset), 0);
          } else {
            if (f.dateFrom) setDateFrom(f.dateFrom);
            if (f.dateTo) setDateTo(f.dateTo);
            if (f.timeFrom) setTimeFrom(f.timeFrom);
            if (f.timeTo) setTimeTo(f.timeTo);
          }
        }
      } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- sync filters to URL params and localStorage when they change ---- */
  useEffect(() => {
    if (!filtersRestoredRef.current) return;
    // Build new URL query string
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
    // Also keep localStorage in sync
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

  /* ---- initial load ---- */

  useEffect(() => {
    if (status === "authenticated") {
      loadAll();
      if (session?.user?.mustChangePass) {
        setShowPasswordModal(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  /* ---- refresh campaigns when client changes ---- */
  const clientInitRef = useRef(false);
  useEffect(() => {
    if (!clientInitRef.current) { clientInitRef.current = true; return; }
    if (status === "authenticated") {
      setSelectedCampaignId(null); // reset campaign when client changes
      setTagFilter("");            // reset tag filter when client changes
      setSelectedTagIds([]);       // reset multi-tag filter
      setActionsMode("NA");        // actions locked until campaign is chosen
      setTagSearch("");
      fetchCampaigns();
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId]);

  /* ---- refresh stats when campaign changes ---- */
  const campaignInitRef = useRef(false);
  useEffect(() => {
    if (!campaignInitRef.current) { campaignInitRef.current = true; return; }
    if (status === "authenticated") {
      setTagFilter("");      // reset tag filter when campaign changes
      setSelectedTagIds([]); // reset multi-tag filter
      setTagSearch("");
      // Cascade actionsMode: NA when campaign cleared, ALL when campaign chosen
      setActionsMode(selectedCampaignId ? "ALL" : "NA");
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampaignId]);

  /* ---- persist view mode ---- */
  useEffect(() => {
    localStorage.setItem("actionsViewMode", viewMode);
  }, [viewMode]);

  /* ---- close context menu on outside click ---- */
  useEffect(() => {
    if (!openMenuId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenuId]);

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

  /* ---- handlers ---- */

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchTags(), fetchClients(), fetchCampaigns(), fetchScans()]);
    setRefreshing(false);
  };

  /* client CRUD */
  const handleCreateClient = async () => {
    if (!newClientName.trim()) return;
    setClientCreating(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClientName, description: newClientDesc, color: newClientColor }),
      });
      if (res.ok) {
        setNewClientName("");
        setNewClientDesc("");
        setNewClientColor("#38BDF8");
        setShowAddClient(false);
        await fetchClients();
      }
    } catch { /* ignore */ }
    finally { setClientCreating(false); }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm("Usunac klienta? Tagi zostana odpiete (nie usuniete).")) return;
    try {
      await fetch(`/api/clients?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (selectedClientId === id) setSelectedClientId(null);
      await fetchClients();
      await fetchTags();
      await fetchCampaigns();
    } catch { /* ignore */ }
  };

  /* campaign CRUD */
  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim() || !selectedClientId) return;
    setCampaignCreating(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCampaignName, description: newCampaignDesc, clientId: selectedClientId }),
      });
      if (res.ok) {
        setNewCampaignName("");
        setNewCampaignDesc("");
        setShowAddCampaign(false);
        await fetchCampaigns();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(`Blad tworzenia kampanii: ${errData.error || res.status}`);
        console.error("Campaign create error:", res.status, errData);
      }
    } catch (e) { console.error("Campaign create fetch error:", e); toast.error("Blad polaczenia"); }
    finally { setCampaignCreating(false); }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Usunac kampanie? Akcje zostana odpiete (nie usuniete).")) return;
    try {
      await fetch(`/api/campaigns?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (selectedCampaignId === id) setSelectedCampaignId(null);
      await fetchCampaigns();
      await fetchTags();
    } catch { /* ignore */ }
  };

  const handleFilter = async () => {
    setLoading(true);
    await fetchStats();
    setLoading(false);
  };

  /* ---- copy-link helper ---- */
  const handleCopyLink = (tagId: string) => {
    const url = `${window.location.origin}/s/${tagId}`;
    const done = () => {
      if (copyToastTimer.current) clearTimeout(copyToastTimer.current);
      setCopyToast(true);
      copyToastTimer.current = setTimeout(() => setCopyToast(false), 2000);
      // per-card visual feedback
      if (copiedCardTimer.current) clearTimeout(copiedCardTimer.current);
      setCopiedCardId(tagId);
      copiedCardTimer.current = setTimeout(() => setCopiedCardId(null), 1500);
    };
    navigator.clipboard.writeText(url).then(done).catch(() => {
      // Fallback for browsers that block clipboard API
      const el = document.createElement("textarea");
      el.value = url;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      done();
    });
  };

  /* ---- range preset helper ---- */
  const applyPreset = useCallback((preset: "today" | "week" | "24h" | "7d" | "30d" | "month" | "custom") => {
    setRangePreset(preset);
    if (preset === "custom") return; // keep existing Od/Do inputs as-is
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const toTimeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    let from: Date;
    if (preset === "today") {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (preset === "week") {
      // ISO week: Monday 00:01 → now
      const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      const diff = day === 0 ? 6 : day - 1; // days since last Monday
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

  const handleResetFilters = async () => {
    // Reset all filter state first, then let fetchStats read the cleared values.
    // Previously this called /api/stats directly and bypassed fetchStats(), causing
    // stale clientId/campaignId params to leak into the reset request.
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
    // Clear URL params
    router.replace("/dashboard", { scroll: false });
    setLoading(true);
    try {
      // Call the API directly with a clean slate (all filters cleared above).
      // We cannot call fetchStats() here because React state updates are async
      // and fetchStats reads from state — use a direct fetch with no params instead.
      const res = await fetch("/api/stats?weekOffset=0");
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleWeekChange = async (direction: number) => {
    const next = weekOffset + direction;
    setWeekOffset(next);
    await fetchStats({ wo: next });
  };

  /* password change */
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (newPassword.length < 8) {
      setPasswordError("Haslo musi miec minimum 8 znakow");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Hasla nie sa identyczne");
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        setPasswordError(data.error || "Blad zmiany hasla");
      } else {
        setShowPasswordModal(false);
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordError("Wystapil blad polaczenia");
    } finally {
      setPasswordSaving(false);
    }
  };

  /* icon options for multilink */
  const iconOptions = [
    { value: "instagram", label: "Instagram" },
    { value: "whatsapp", label: "WhatsApp" },
    { value: "facebook", label: "Facebook" },
    { value: "youtube", label: "YouTube" },
    { value: "tiktok", label: "TikTok" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Telefon" },
    { value: "website", label: "Strona WWW" },
    { value: "telegram", label: "Telegram" },
    { value: "link", label: "Link" },
  ];

  /* tag CRUD */
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setTagCreateError("");
    setTagCreateSuccess("");
    if (!newTagId || !newTagName) {
      setTagCreateError("ID i nazwa akcji sa wymagane");
      return;
    }
    if (!newTagClient) {
      setTagCreateError("Wybor klienta jest wymagany przed utworzeniem akcji");
      return;
    }
    if (!newTagCampaign) {
      setTagCreateError("Wybor kampanii jest wymagany przed utworzeniem akcji");
      return;
    }
    if ((newTagType === "url" || newTagType === "google-review") && !newTagUrl) {
      setTagCreateError("Docelowy URL jest wymagany");
      return;
    }
    if (newTagType === "vcard" && !newVCard.firstName && !newVCard.lastName) {
      setTagCreateError("Imie lub nazwisko jest wymagane");
      return;
    }
    if (newTagType === "multilink" && newTagLinks.every(l => !l.url)) {
      setTagCreateError("Dodaj przynajmniej jeden link");
      return;
    }
    setTagCreating(true);
    try {
      const body: Record<string, unknown> = {
        id: newTagId,
        name: newTagName,
        description: newTagDesc || undefined,
        tagType: newTagType,
        clientId: newTagClient,
        campaignId: newTagCampaign,
      };
      if (newTagType === "url" || newTagType === "google-review") {
        body.targetUrl = newTagUrl;
      } else if (newTagType === "multilink") {
        body.targetUrl = "#multilink";
        body.links = newTagLinks.filter(l => l.url.trim() !== "");
      } else if (newTagType === "video") {
        body.targetUrl = "#video";
      } else if (newTagType === "vcard") {
        body.targetUrl = `/vcard/${newTagId.toLowerCase().replace(/[^a-z0-9-]/g, "-")}`;
        body.links = newVCard;
      }
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        setTagCreateError(data.error || "Blad tworzenia akcji");
      } else {
        const createdId = newTagId;
        const createdChannel = newTagChannel;
        setTagCreateSuccess("Akcja utworzona pomyslnie!");
        setLastCreatedId(createdId);
        setLastCreatedChannel(createdChannel);
        await fetchTags();
        await fetchStats();
        // Close drawer first, reset form state after the drawer is gone to avoid
        // validation messages flashing before unmount.
        setDrawerIsClosing(true);
        setTimeout(() => {
          setShowNewTagDrawer(false);
          setDrawerIsClosing(false);
          setTimeout(() => {
            setNewTagId("");
            setNewTagName("");
            setNewTagUrl("");
            setNewTagDesc("");
            setNewTagType("url");
            setNewTagChannel("nfc");
            setNewTagClient("");
            setNewTagCampaign("");
            setNewTagLinks([{ label: "", url: "", icon: "link" }]);
            setNewVCard({ firstName: "", lastName: "" });
            setTagCreateSuccess("");
            setTagCreateError("");
          }, 300);
        }, 2500);
      }
    } catch {
      setTagCreateError("Blad polaczenia");
    } finally {
      setTagCreating(false);
    }
  };

  const handleToggleActive = async (tag: TagFull) => {
    try {
      await fetch("/api/tags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tag.id, isActive: !tag.isActive }),
      });
      await fetchTags();
    } catch { /* ignore */ }
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm(`Czy na pewno chcesz usunac akcje "${id}" i wszystkie jej skany?`)) return;
    try {
      await fetch(`/api/tags?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setEditingAction(null);
      await fetchTags();
      await fetchStats();
    } catch { /* ignore */ }
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const body: Record<string, unknown> = {
        id,
        name: editName,
        description: editDesc,
        tagType: editType,
      };
      if (editType === "url" || editType === "google-review") {
        body.targetUrl = editUrl;
      } else if (editType === "video") {
        body.targetUrl = `/watch/${id}`;
      } else if (editType === "multilink") {
        body.targetUrl = `/link/${id}`;
        body.links = editTagLinks.filter(l => l.url.trim() !== "");
      } else if (editType === "vcard") {
        body.targetUrl = `/vcard/${id}`;
        body.links = editVCard;
      }
      await fetch("/api/tags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setEditingAction(null);
      await fetchTags();
    } catch { /* ignore */ }
  };

  const startEdit = (tag: TagFull) => {
    setEditingAction(tag);
    setEditName(tag.name);
    setEditUrl(tag.targetUrl);
    setEditDesc(tag.description || "");
    setEditType(tag.tagType);
    setEditChannel("nfc"); // default; channel is not persisted in DB
    if (tag.tagType === "vcard" && tag.links) {
      setEditVCard(tag.links as unknown as VCardData);
      setEditTagLinks([{ label: "", url: "", icon: "link" }]);
    } else {
      setEditTagLinks(tag.links ? [...(tag.links as unknown as TagLink[]).map(l => ({ ...l }))] : [{ label: "", url: "", icon: "link" }]);
      setEditVCard({ firstName: "", lastName: "" });
    }
  };

  /* remove video from tag */
  const handleRemoveVideo = async (tagId: string) => {
    if (!confirm("Czy na pewno chcesz usunac video z tej akcji?")) return;
    try {
      await fetch("/api/tags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tagId, videoFile: null }),
      });
      await fetchTags();
    } catch { /* ignore */ }
  };

  /* video upload */
  const handleVideoUpload = async (tagId: string, file: File) => {
    setUploadingTagId(tagId);
    setUploadProgress("Wysylanie...");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("tagId", tagId);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json();
        setUploadProgress(`Blad: ${data.error}`);
      } else {
        setUploadProgress("Gotowe!");
        await fetchTags();
        setTimeout(() => setUploadProgress(""), 2000);
      }
    } catch {
      setUploadProgress("Blad polaczenia");
    } finally {
      setTimeout(() => setUploadingTagId(null), 2200);
    }
  };

  /* inline link editor save */
  const handleSaveLinks = async (tagId: string) => {
    setEditLinksSaving(true);
    try {
      await fetch("/api/tags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tagId,
          links: editLinks.filter(l => l.url.trim() !== ""),
        }),
      });
      setEditingLinksTagId(null);
      await fetchTags();
    } catch { /* ignore */ }
    finally { setEditLinksSaving(false); }
  };

  const startEditLinks = (tag: TagFull) => {
    setEditingLinksTagId(tag.id);
    setEditLinks(tag.links ? [...tag.links.map(l => ({ ...l }))] : [{ label: "", url: "", icon: "link" }]);
  };

  /* reset stats */
  const handleResetStats = async (tagId?: string) => {
    setResetting(true);
    try {
      await fetch("/api/stats/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tagId ? { tagId } : {}),
      });
      setResetAllConfirm(false);
      setResetTagConfirm(null);
      // Clear scan table data so it doesn't show stale rows
      setScanData(null);
      setShowScanTable(false);
      setScanNfcFilter(null);
      await fetchStats();
      await fetchTags();
    } catch { /* ignore */ }
    finally { setResetting(false); }
  };

  /* ---- management panel handlers ---- */

  const handleCascadeDeleteCampaignPreview = async (campaignId: string) => {
    setManageLoading(true);
    setManageMsg("");
    try {
      const res = await fetch("/api/manage/cascade-delete-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      });
      if (res.ok) {
        const data = await res.json();
        setCascadeDeleteCampaignId(campaignId);
        setCascadeDeleteCampaignPreview(data);
      } else {
        setManageMsg("Blad pobierania podgladu kampanii");
      }
    } catch { setManageMsg("Blad polaczenia"); }
    finally { setManageLoading(false); }
  };

  const handleCascadeDeleteCampaign = async () => {
    if (!cascadeDeleteCampaignId) return;
    setManageLoading(true);
    setManageMsg("");
    try {
      const res = await fetch("/api/manage/cascade-delete-campaign", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: cascadeDeleteCampaignId }),
      });
      if (res.ok) {
        const data = await res.json();
        setManageMsg(`Usunieto kampanie "${data.campaignName}": ${data.deletedTags} akcji, ${data.deletedScans} skanow, ${data.deletedClicks} klikniec, ${data.deletedVideoEvents} eventow video`);
        setCascadeDeleteCampaignId(null);
        setCascadeDeleteCampaignPreview(null);
        await Promise.all([fetchClients(), fetchCampaigns(), fetchTags(), fetchStats()]);
      } else {
        setManageMsg("Blad usuwania kampanii");
      }
    } catch { setManageMsg("Blad polaczenia"); }
    finally { setManageLoading(false); }
  };

  const handleCascadeDeleteClientPreview = async (clientId: string) => {
    setManageLoading(true);
    setManageMsg("");
    try {
      const res = await fetch("/api/manage/cascade-delete-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      if (res.ok) {
        const data = await res.json();
        setCascadeDeleteClientId(clientId);
        setCascadeDeleteClientPreview(data);
      } else {
        setManageMsg("Blad pobierania podgladu klienta");
      }
    } catch { setManageMsg("Blad polaczenia"); }
    finally { setManageLoading(false); }
  };

  const handleCascadeDeleteClient = async () => {
    if (!cascadeDeleteClientId) return;
    setManageLoading(true);
    setManageMsg("");
    try {
      const res = await fetch("/api/manage/cascade-delete-client", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: cascadeDeleteClientId }),
      });
      if (res.ok) {
        const data = await res.json();
        setManageMsg(`Usunieto klienta "${data.clientName}": ${data.deletedCampaigns} kampanii, ${data.deletedTags} akcji, ${data.deletedScans} skanow`);
        setCascadeDeleteClientId(null);
        setCascadeDeleteClientPreview(null);
        setSelectedClientId(null);
        setSelectedCampaignId(null);
        await Promise.all([fetchClients(), fetchCampaigns(), fetchTags(), fetchStats()]);
      } else {
        setManageMsg("Blad usuwania klienta");
      }
    } catch { setManageMsg("Blad polaczenia"); }
    finally { setManageLoading(false); }
  };

  const handleResetClientStats = async (clientId: string) => {
    setManageLoading(true);
    setManageMsg("");
    try {
      const res = await fetch("/api/manage/reset-client-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      if (res.ok) {
        const data = await res.json();
        setManageMsg(`Zresetowano statystyki klienta "${data.clientName}": ${data.deletedScans} skanow, ${data.deletedClicks} klikniec, ${data.deletedVideoEvents} eventow (${data.tagsAffected} akcji zachowanych)`);
        setResetClientStatsId(null);
        setScanData(null);
        setShowScanTable(false);
        await Promise.all([fetchClients(), fetchTags(), fetchStats()]);
      } else {
        setManageMsg("Blad resetowania statystyk");
      }
    } catch { setManageMsg("Blad polaczenia"); }
    finally { setManageLoading(false); }
  };

  const handleReassignTag = async () => {
    if (!reassignTagId) return;
    setManageLoading(true);
    setManageMsg("");
    try {
      const res = await fetch("/api/manage/tag-operations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId: reassignTagId, newCampaignId: reassignCampaignId || null }),
      });
      if (res.ok) {
        const data = await res.json();
        setManageMsg(`Przeniesiono akcje "${data.tag.name}" do ${data.tag.campaignId ? "nowej kampanii" : "bez kampanii"}`);
        setReassignTagId(null);
        setReassignCampaignId("");
        await Promise.all([fetchCampaigns(), fetchTags(), fetchStats()]);
      } else {
        const err = await res.json();
        setManageMsg(err.error || "Blad przenoszenia akcji");
      }
    } catch { setManageMsg("Blad polaczenia"); }
    finally { setManageLoading(false); }
  };

  const handleCloneTag = async () => {
    if (!cloneSourceTag || !cloneNewId) return;
    setManageLoading(true);
    setManageMsg("");
    try {
      const res = await fetch("/api/manage/tag-operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceTagId: cloneSourceTag,
          newId: cloneNewId,
          targetClientId: cloneTargetClient || undefined,
          targetCampaignId: cloneTargetCampaign || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setManageMsg(`Sklonowano akcje jako "${data.clonedTag.name}" (ID: ${data.clonedTag.id})`);
        setCloneSourceTag(null);
        setCloneNewId("");
        setCloneTargetClient("");
        setCloneTargetCampaign("");
        await fetchTags();
      } else {
        const err = await res.json();
        setManageMsg(err.error || "Blad klonowania akcji");
      }
    } catch { setManageMsg("Blad polaczenia"); }
    finally { setManageLoading(false); }
  };

  /* ---- bulk handlers ---- */

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Czy na pewno chcesz usunąć ${selectedIds.length} akcji i wszystkie ich dane?`)) return;
    setBulkLoading(true);
    setBulkMsg("");
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/tags?id=${encodeURIComponent(id)}`, { method: "DELETE" })
        )
      );
      setSelectedIds([]);
      await Promise.all([fetchTags(), fetchStats()]);
    } catch { setBulkMsg("Błąd usuwania"); }
    finally { setBulkLoading(false); }
  };

  const handleBulkMove = async () => {
    if (!selectedIds.length) return;
    setBulkLoading(true);
    setBulkMsg("");
    try {
      const results = await Promise.all(
        selectedIds.map((id) =>
          fetch("/api/manage/tag-operations", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tagId: id, newCampaignId: bulkMoveCampaignId || null }),
          })
        )
      );
      const failed = results.filter((r) => !r.ok).length;
      if (failed) setBulkMsg(`Przeniesiono ${selectedIds.length - failed}/${selectedIds.length} akcji`);
      setSelectedIds([]);
      setShowBulkMoveModal(false);
      setBulkMoveCampaignId("");
      await Promise.all([fetchCampaigns(), fetchTags(), fetchStats()]);
    } catch { setBulkMsg("Błąd przenoszenia"); }
    finally { setBulkLoading(false); }
  };

  const handleBulkClone = async () => {
    if (!selectedIds.length) return;
    setBulkLoading(true);
    setBulkMsg("");
    try {
      let ok = 0;
      for (const id of selectedIds) {
        const newId = `${id}-kopia-${Date.now().toString(36)}`;
        const res = await fetch("/api/manage/tag-operations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceTagId: id, newId }),
        });
        if (res.ok) ok++;
      }
      setBulkMsg(`Zduplikowano ${ok}/${selectedIds.length} akcji`);
      setSelectedIds([]);
      await fetchTags();
    } catch { setBulkMsg("Błąd duplikowania"); }
    finally { setBulkLoading(false); }
  };

  /* tag type label helper */
  const getTagTypeLabel = (type: string) => {
    switch (type) {
      case "url": return "URL";
      case "video": return "Video";
      case "multilink": return "Multi-link";
      case "vcard": return "Wizytówka";
      case "google-review": return "Recenzja Google";
      default: return "URL";
    }
  };

  const getTagTypeColor = (type: string) => {
    switch (type) {
      case "url": return { bg: "rgba(124,58,237,0.15)", color: "#7dd3fc" };
      case "video": return { bg: "rgba(16,185,129,0.15)", color: "#10b981" };
      case "multilink": return { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" };
      case "vcard": return { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" };
      case "google-review": return { bg: "rgba(234,67,53,0.15)", color: "#ea4335" };
      default: return { bg: "rgba(124,58,237,0.15)", color: "#7dd3fc" };
    }
  };

  /* ---- formatting helpers ---- */

  const formatDate = (iso: string | null) => {
    if (!iso) return "---";
    const d = new Date(iso);
    return d.toLocaleString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatWeekRange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const fmt = (d: Date) =>
      d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" });
    return `${fmt(s)} - ${fmt(e)}`;
  };

  /* ---- loading / auth guard ---- */

  if (status === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B0F1A",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              border: "3px solid rgba(148,163,184,0.15)",
              borderTopColor: "#38BDF8",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#94A3B8" }}>Ladowanie...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }

  /* ---- Viewer (non-admin) gets simplified dashboard ---- */
  if (session && !isAdmin) {
    return <ViewerDashboard session={session} />;
  }

  /* ---- computed data ---- */

  // Filter tags by selected client and/or campaign
  const filteredTags = tags.filter(t => {
    if (selectedCampaignId && t.campaignId !== selectedCampaignId) return false;
    if (selectedClientId && !selectedCampaignId && t.clientId !== selectedClientId) return false;
    return true;
  });
  // If no filters, show all
  const displayTags = (selectedClientId || selectedCampaignId) ? filteredTags : tags;

  // Filter campaigns by selected client
  const filteredCampaigns = selectedClientId
    ? campaigns.filter(c => c.clientId === selectedClientId)
    : campaigns;

  const kpi = stats?.kpi;
  const devices = stats?.devices;
  const topTags = stats?.topTags ?? [];
  const topCountries = stats?.topCountries ?? [];
  const topCities = stats?.topCities ?? [];
  const topLanguages = stats?.topLanguages ?? [];
  const weekly = stats?.weeklyTrend;
  // Build hourly distribution from raw timestamps + ipHash (client-side timezone!)
  const hourly: HourlyData[] = (() => {
    const raw = stats?.hourlyRaw ?? [];
    if (raw.length === 0) return [];
    const buckets = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0, uniqueUsers: 0 }));
    const ipSets: Set<string>[] = Array.from({ length: 24 }, () => new Set());
    for (const entry of raw) {
      const h = new Date(entry.t).getHours(); // browser local timezone
      buckets[h].count++;
      ipSets[h].add(entry.ip);
    }
    for (let i = 0; i < 24; i++) {
      buckets[i].uniqueUsers = ipSets[i].size;
    }
    return buckets;
  })();

  // Build heatmap data: dayOfWeek (0=Pon..6=Nd) × hour (0-23) → count
  const heatmapData: number[][] = (() => {
    const raw = stats?.hourlyRaw ?? [];
    // 7 rows (days) × 24 cols (hours)
    const grid = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
    for (const entry of raw) {
      const d = new Date(entry.t);
      const h = d.getHours();
      let dow = d.getDay(); // 0=Sun, 1=Mon..6=Sat
      dow = dow === 0 ? 6 : dow - 1; // convert to 0=Mon..6=Sun
      grid[dow][h]++;
    }
    return grid;
  })();
  const heatmapMax = Math.max(...heatmapData.flat(), 1);

  // Build unique heatmap data: dayOfWeek × hour → unique IPs
  const heatmapUniqueData: number[][] = (() => {
    const raw = stats?.hourlyRaw ?? [];
    const ipSets = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => new Set<string>()));
    for (const entry of raw) {
      const d = new Date(entry.t);
      const h = d.getHours();
      let dow = d.getDay();
      dow = dow === 0 ? 6 : dow - 1;
      ipSets[dow][h].add(entry.ip);
    }
    return ipSets.map(row => row.map(s => s.size));
  })();
  const heatmapUniqueMax = Math.max(...heatmapUniqueData.flat(), 1);
  const allTagsFilter = stats?.allTags ?? [];

  const maxWeeklyCount = weekly
    ? Math.max(...weekly.data.map((d) => d.count), 1)
    : 1;

  const deviceTotal = devices?.total || 1;
  const iosPercent = devices ? Math.round((devices.iOS / deviceTotal) * 100) : 0;
  const androidPercent = devices ? Math.round((devices.Android / deviceTotal) * 100) : 0;
  const desktopPercent = devices ? Math.round((devices.Desktop / deviceTotal) * 100) : 0;

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F1A" }}>
      {/* ---- Spinner keyframes ---- */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .anim-fade { animation: fadeIn 0.35s ease forwards; }
        @keyframes drawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .drawer-panel { animation: drawerIn 0.25s cubic-bezier(0.32,0,0.67,0) forwards; }
        @keyframes menuIn { from { opacity: 0; transform: scale(0.95) translateY(-4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .ctx-menu { animation: menuIn 0.12s ease forwards; transform-origin: top right; }
      `}</style>

      {/* ============================================================ */}
      {/*  STICKY HEADER                                               */}
      {/* ============================================================ */}

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
          {/* logo */}
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
            <span style={{ color: "#38BDF8" }}>Twoje</span>
            <span style={{ color: "#F1F5F9" }}>NFC</span>
          </span>

          {/* actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={handleRefresh}
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

            {session?.user?.role === "admin" && (
              <button
                onClick={() => setUsersPanelOpen(true)}
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

      {/* ============================================================ */}
      {/*  MAIN CONTENT                                                */}
      {/* ============================================================ */}

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 24px 64px" }}>
        {/* ================================================================ */}
        {/*  TWO-COLUMN LAYOUT: sidebar (260px) + scrollable content        */}
        {/* ================================================================ */}
        <style>{`
          @media (max-width: 700px) {
            .nfc-layout { flex-direction: column !important; }
            .nfc-sidebar { width: 100% !important; position: static !important; max-height: none !important; overflow: visible !important; flex-direction: row !important; flex-wrap: wrap !important; }
            .nfc-sidebar > div { flex: 1 1 calc(50% - 6px); min-width: 140px; }
          }
          /* Sidebar scrollbar — only appears when content overflows; thin and unobtrusive */
          .nfc-sidebar { scrollbar-width: thin; scrollbar-color: rgba(148,163,184,0.15) transparent; }
          .nfc-sidebar::-webkit-scrollbar { width: 4px; }
          .nfc-sidebar::-webkit-scrollbar-track { background: transparent; }
          .nfc-sidebar::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.15); border-radius: 4px; }
          .nfc-sidebar::-webkit-scrollbar-thumb:hover { background: #363b48; }
        `}</style>
        <div className="nfc-layout" style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

          {/* ============================================================ */}
          {/*  LEFT SIDEBAR — Filtry: Klienci, Kampanie, Akcje             */}
          {/* ============================================================ */}
          <aside
            className="nfc-sidebar"
            onScroll={() => {
            }}
            style={{
              width: 260,
              flexShrink: 0,
              position: "sticky",
              top: 76,
              maxHeight: "calc(100vh - 96px)",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {/* -- Klienci block -- */}
            <div style={{ padding: "0 0 12px", borderBottom: "1px solid rgba(148,163,184,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 1 }}>Klient</span>
                {isAdmin && <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {selectedClientId && (
                    <button
                      onClick={() => handleDeleteClient(selectedClientId)}
                      title="Usuń klienta"
                      style={{ background: "transparent", border: "none", color: "#3d4250", cursor: "pointer", fontSize: 13, padding: "0 2px", lineHeight: 1, transition: "color 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                      onMouseLeave={e => e.currentTarget.style.color = "#3d4250"}
                    >🗑</button>
                  )}
                  <button
                    onClick={() => setShowAddClient(!showAddClient)}
                    title="Dodaj klienta"
                    style={{ background: "transparent", border: "1px dashed #3d4250", color: "#64748B", borderRadius: 6, width: 22, height: 22, fontSize: 16, lineHeight: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.2s, color 0.2s", flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#38BDF8"; e.currentTarget.style.color = "#7dd3fc"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#3d4250"; e.currentTarget.style.color = "#64748B"; }}
                  >+</button>
                </div>}
              </div>

              {/* -- Klienci — always-visible inline list -- */}
              {/* search bar */}
              <div style={{ display: "flex", alignItems: "center", background: "transparent", border: "none", borderBottom: "1px solid rgba(148,163,184,0.08)", borderRadius: 0, padding: "6px 0", marginBottom: 6 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3d4250" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginRight: 6 }}>
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  placeholder="Szukaj klienta…"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 12, color: "#c8d0de", caretColor: "#7dd3fc" }}
                />
                {clientSearch && (
                  <button onClick={() => setClientSearch("")} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
                )}
              </div>
              <div style={{ marginLeft: -4, marginRight: -4 }}>
                {/* "Wszyscy klienci" row */}
                <button
                  onClick={() => { setSelectedClientId(null); setSelectedCampaignId(null); setSelectedTagIds([]); setActionsMode("NA"); fetchStats({ tagIds: [] }); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%",
                    padding: "7px 8px", borderRadius: 7, border: "none", cursor: "pointer", textAlign: "left",
                    background: !selectedClientId ? "rgba(0,200,160,0.1)" : "transparent",
                    color: !selectedClientId ? "#7dd3fc" : "#94A3B8",
                    fontSize: 12, fontWeight: !selectedClientId ? 600 : 400,
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => { if (selectedClientId) e.currentTarget.style.background = "#1C2541"; }}
                  onMouseLeave={e => { if (selectedClientId) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{
                    width: 14, height: 14, borderRadius: 3, border: `1px solid ${!selectedClientId ? "#7dd3fc" : "#363b48"}`,
                    background: !selectedClientId ? "rgba(56,189,248,0.12)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {!selectedClientId && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#7dd3fc" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </span>
                  Wszyscy klienci
                </button>
                {/* per-client rows */}
                {clients
                  .filter(c => !clientSearch || c.name.toLowerCase().includes(clientSearch.toLowerCase()))
                  .map(c => {
                    const sel = selectedClientId === c.id;
                    const dotColor = c.color || "#38BDF8";
                    return (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedClientId(c.id); setSelectedCampaignId(null); setSelectedTagIds([]); setActionsMode("NA"); fetchStats({ tagIds: [] }); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, width: "100%",
                          padding: "7px 8px", borderRadius: 7, border: "none", cursor: "pointer", textAlign: "left",
                          background: sel ? `${dotColor}18` : "transparent",
                          color: sel ? dotColor : "#c8d0de",
                          fontSize: 12, fontWeight: sel ? 600 : 400,
                          transition: "background 0.12s",
                        }}
                        onMouseEnter={e => { if (!sel) e.currentTarget.style.background = "#1C2541"; }}
                        onMouseLeave={e => { if (!sel) e.currentTarget.style.background = "transparent"; }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                        {c.scanCount > 0 && <span style={{ fontSize: 10, color: "#3d4250", flexShrink: 0 }}>{c.scanCount}</span>}
                      </button>
                    );
                  })}
                {clients.filter(c => !clientSearch || c.name.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 && (
                  <div style={{ padding: "8px 4px", fontSize: 11, color: "#3d4250" }}>Brak wyników</div>
                )}
              </div>

              {/* Add client inline form */}
              {showAddClient && (
                <div style={{ marginTop: 8, padding: "10px", background: "#1C2541", borderRadius: 8, border: "1px solid rgba(148,163,184,0.08)", display: "flex", flexDirection: "column", gap: 8 }}>
                  <input className="input-field" value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Nazwa klienta" style={{ fontSize: 12, padding: "6px 10px" }} />
                  <input className="input-field" value={newClientDesc} onChange={e => setNewClientDesc(e.target.value)} placeholder="Opis (opcjonalnie)" style={{ fontSize: 12, padding: "6px 10px" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="color" value={newClientColor} onChange={e => setNewClientColor(e.target.value)} style={{ width: 32, height: 28, border: "1px solid rgba(148,163,184,0.08)", borderRadius: 4, background: "#1C2541", cursor: "pointer", flexShrink: 0 }} />
                    <button className="btn-primary" onClick={handleCreateClient} disabled={clientCreating} style={{ flex: 1, padding: "6px 0", fontSize: 12 }}>{clientCreating ? "..." : "Dodaj"}</button>
                    <button onClick={() => setShowAddClient(false)} style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: "#94A3B8", borderRadius: 6, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}>✕</button>
                  </div>
                </div>
              )}
            </div>

            {/* -- Kampanie block — always-visible list (no dropdown) -- */}
            <div style={{ padding: "0 0 12px", borderBottom: "1px solid rgba(148,163,184,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 1 }}>Kampania</span>
                {isAdmin && selectedClientId && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {selectedCampaignId && (
                      <button
                        onClick={() => handleDeleteCampaign(selectedCampaignId)}
                        title="Usuń kampanię"
                        style={{ background: "transparent", border: "none", color: "#3d4250", cursor: "pointer", fontSize: 13, padding: "0 2px", lineHeight: 1, transition: "color 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                        onMouseLeave={e => e.currentTarget.style.color = "#3d4250"}
                      >🗑</button>
                    )}
                    <button
                      onClick={() => setShowAddCampaign(!showAddCampaign)}
                      title="Dodaj kampanię"
                      style={{ background: "transparent", border: "1px dashed #3d4250", color: "#64748B", borderRadius: 6, width: 22, height: 22, fontSize: 16, lineHeight: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.2s, color 0.2s", flexShrink: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#60a5fa"; e.currentTarget.style.color = "#60a5fa"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#3d4250"; e.currentTarget.style.color = "#64748B"; }}
                    >+</button>
                  </div>
                )}
              </div>

              {!selectedClientId ? (
                /* placeholder when no client chosen */
                <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 4px" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3d4250" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span style={{ fontSize: 11, color: "#3d4250", lineHeight: 1.4 }}>Wybierz klienta, aby zobaczyć kampanie</span>
                </div>
              ) : (
                /* always-visible campaign list */
                <div style={{ marginLeft: -4, marginRight: -4 }}>
                  {/* "Wszystkie kampanie" row */}
                  <button
                    onClick={() => { setSelectedCampaignId(null); setSelectedTagIds([]); setActionsMode("NA"); fetchStats({ tagIds: [] }); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, width: "100%",
                      padding: "6px 8px", borderRadius: 7, fontSize: 12,
                      fontWeight: !selectedCampaignId ? 600 : 400,
                      background: !selectedCampaignId ? "rgba(96,165,250,0.12)" : "transparent",
                      color: !selectedCampaignId ? "#60a5fa" : "#94A3B8",
                      border: "none", cursor: "pointer", textAlign: "left",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={e => { if (selectedCampaignId) e.currentTarget.style.background = "#1C2541"; }}
                    onMouseLeave={e => { if (selectedCampaignId) e.currentTarget.style.background = "transparent"; }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ flexShrink: 0, opacity: 0.6 }}>
                      <path d="M3 6h18M3 12h18M3 18h18"/>
                    </svg>
                    <span style={{ flex: 1 }}>Wszystkie kampanie</span>
                    {!selectedCampaignId && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>

                  {/* per-campaign rows */}
                  {filteredCampaigns.length === 0 ? (
                    <div style={{ padding: "10px 8px", fontSize: 11, color: "#3d4250", lineHeight: 1.5 }}>
                      Brak kampanii dla tego klienta
                    </div>
                  ) : (
                    filteredCampaigns.map(c => {
                      const sel = selectedCampaignId === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCampaignId(c.id);
                            setSelectedTagIds([]);
                            setActionsMode("ALL");
                            fetchStats({ tagIds: [] });
                          }}
                          style={{
                            display: "flex", alignItems: "center", gap: 8, width: "100%",
                            padding: "6px 8px", borderRadius: 7, fontSize: 12,
                            fontWeight: sel ? 600 : 400,
                            background: sel ? "rgba(96,165,250,0.12)" : "transparent",
                            color: sel ? "#60a5fa" : "#c8d0de",
                            border: "none", cursor: "pointer", textAlign: "left",
                            transition: "background 0.12s",
                          }}
                          onMouseEnter={e => { if (!sel) e.currentTarget.style.background = "#1C2541"; }}
                          onMouseLeave={e => { if (!sel) e.currentTarget.style.background = "transparent"; }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ flexShrink: 0, opacity: sel ? 1 : 0.5 }}>
                            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                          </svg>
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                          {c.scanCount > 0 && (
                            <span style={{ fontSize: 10, color: sel ? "#60a5fa" : "#3d4250", flexShrink: 0, opacity: 0.8 }}>{c.scanCount}</span>
                          )}
                          {sel && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {/* Add campaign inline form */}
              {selectedClientId && showAddCampaign && (
                <div style={{ marginTop: 8, padding: "10px", background: "#1C2541", borderRadius: 8, border: "1px solid rgba(148,163,184,0.08)", display: "flex", flexDirection: "column", gap: 8 }}>
                  <input className="input-field" value={newCampaignName} onChange={e => setNewCampaignName(e.target.value)} placeholder="Nazwa kampanii" style={{ fontSize: 12, padding: "6px 10px" }} />
                  <input className="input-field" value={newCampaignDesc} onChange={e => setNewCampaignDesc(e.target.value)} placeholder="Opis (opcjonalnie)" style={{ fontSize: 12, padding: "6px 10px" }} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn-primary" onClick={handleCreateCampaign} disabled={campaignCreating} style={{ flex: 1, padding: "6px 0", fontSize: 12 }}>{campaignCreating ? "..." : "Dodaj"}</button>
                    <button onClick={() => setShowAddCampaign(false)} style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: "#94A3B8", borderRadius: 6, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}>✕</button>
                  </div>
                </div>
              )}
            </div>

            {/* -- Akcje — always-visible list, only active when campaign is selected -- */}
            <div style={{ padding: "0 0 12px", borderBottom: "1px solid rgba(148,163,184,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 1 }}>Akcje</span>
                  {actionsMode === "SELECTED" && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#7dd3fc", background: "rgba(0,200,160,0.12)", border: "1px solid rgba(0,200,160,0.3)", borderRadius: 10, padding: "1px 6px" }}>
                      {selectedTagIds.length}
                    </span>
                  )}
                </div>
                {actionsMode === "SELECTED" && (
                  <button
                    onClick={() => { setSelectedTagIds([]); setActionsMode("ALL"); fetchStats({ tagIds: [] }); if (showScanTable) fetchScans(); }}
                    style={{ background: "transparent", border: "none", color: "#64748B", fontSize: 10, cursor: "pointer", padding: "1px 4px", transition: "color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                    onMouseLeave={e => e.currentTarget.style.color = "#64748B"}
                    title="Wyczyść filtr akcji"
                  >Wyczyść</button>
                )}
              </div>

              {!selectedCampaignId ? (
                /* — no campaign: placeholder — */
                <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 4px" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3d4250" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span style={{ fontSize: 11, color: "#3d4250", lineHeight: 1.4 }}>Wybierz kampanię, aby zobaczyć akcje</span>
                </div>
              ) : (
                /* — campaign selected: always-visible list — */
                <>
                  {/* search bar */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "transparent", border: "none",
                    borderBottom: "1px solid rgba(148,163,184,0.08)", borderRadius: 0, padding: "6px 0", marginBottom: 6,
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <input
                      value={tagSearch}
                      onChange={e => setTagSearch(e.target.value)}
                      placeholder="Szukaj akcji…"
                      style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 12, color: "#c8d0de", caretColor: "#7dd3fc" }}
                    />
                    {tagSearch && (
                      <button
                        onClick={() => setTagSearch("")}
                        style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1, flexShrink: 0 }}
                      >×</button>
                    )}
                  </div>

                  {/* list */}
                  {filteredTags.length === 0 ? (
                    <div style={{ padding: "10px 4px", fontSize: 11, color: "#3d4250", lineHeight: 1.5 }}>
                      Brak akcji w tej kampanii
                    </div>
                  ) : (
                    <div style={{ marginLeft: -4, marginRight: -4 }}>
                      {/* "Wszystkie akcje" row */}
                      <button
                        onClick={() => { setSelectedTagIds([]); setActionsMode("ALL"); fetchStats({ tagIds: [] }); if (showScanTable) fetchScans(); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, width: "100%",
                          padding: "5px 8px", borderRadius: 7, fontSize: 12,
                          fontWeight: actionsMode === "ALL" ? 600 : 400,
                          background: actionsMode === "ALL" ? "rgba(96,165,250,0.1)" : "transparent",
                          color: actionsMode === "ALL" ? "#60a5fa" : "#94A3B8",
                          border: "none", cursor: "pointer", textAlign: "left",
                          transition: "background 0.12s",
                        }}
                        onMouseEnter={e => { if (actionsMode !== "ALL") e.currentTarget.style.background = "#1C2541"; }}
                        onMouseLeave={e => { if (actionsMode !== "ALL") e.currentTarget.style.background = "transparent"; }}
                      >
                        {/* checkbox-like indicator */}
                        <span style={{
                          width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                          border: `1.5px solid ${actionsMode === "ALL" ? "#60a5fa" : "#363b48"}`,
                          background: actionsMode === "ALL" ? "rgba(96,165,250,0.2)" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {actionsMode === "ALL" && <span style={{ fontSize: 9, color: "#60a5fa", lineHeight: 1 }}>✓</span>}
                        </span>
                        <span style={{ flex: 1 }}>Wszystkie akcje</span>
                      </button>

                      {/* per-tag rows — filtered by search */}
                      {filteredTags
                        .filter(t => !tagSearch || t.name.toLowerCase().includes(tagSearch.toLowerCase()))
                        .map(t => {
                          const sel = selectedTagIds.includes(t.id);
                          return (
                            <button
                              key={t.id}
                              onClick={() => {
                                const next = sel
                                  ? selectedTagIds.filter(id => id !== t.id)
                                  : [...selectedTagIds, t.id];
                                setSelectedTagIds(next);
                                setActionsMode(next.length > 0 ? "SELECTED" : "ALL");
                                fetchStats({ tagIds: next });
                                if (showScanTable) fetchScans();
                              }}
                              style={{
                                display: "flex", alignItems: "center", gap: 8, width: "100%",
                                padding: "5px 8px", borderRadius: 7, fontSize: 12,
                                fontWeight: sel ? 600 : 400,
                                background: sel ? "rgba(0,200,160,0.08)" : "transparent",
                                color: sel ? "#7dd3fc" : "#c8d0de",
                                border: "none", cursor: "pointer", textAlign: "left",
                                transition: "background 0.12s",
                              }}
                              onMouseEnter={e => { if (!sel) e.currentTarget.style.background = "#1C2541"; }}
                              onMouseLeave={e => { if (!sel) e.currentTarget.style.background = sel ? "rgba(0,200,160,0.08)" : "transparent"; }}
                            >
                              <span style={{
                                width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                                border: `1.5px solid ${sel ? "#7dd3fc" : "#363b48"}`,
                                background: sel ? "rgba(0,200,160,0.2)" : "transparent",
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                {sel && <span style={{ fontSize: 9, color: "#7dd3fc", lineHeight: 1 }}>✓</span>}
                              </span>
                              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                              {t._count.scans > 0 && (
                                <span style={{ fontSize: 10, color: sel ? "#7dd3fc" : "#3d4250", flexShrink: 0, opacity: 0.8 }}>{t._count.scans}</span>
                              )}
                            </button>
                          );
                        })}

                      {/* no search results */}
                      {tagSearch && filteredTags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase())).length === 0 && (
                        <div style={{ padding: "10px 8px", fontSize: 11, color: "#3d4250" }}>Brak wyników</div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>

          {/* ============================================================ */}
          {/*  RIGHT CONTENT COLUMN                                        */}
          {/* ============================================================ */}
          <div style={{ flex: 1, minWidth: 0 }}>

        {/* ---- Filter Bar — stała wysokość niezależna od trybu ---- */}
        <section
          style={{ marginBottom: 16, padding: "10px 0", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", borderBottom: "1px solid rgba(148,163,184,0.06)" }}
        >
          {/* Time range preset pills — popover floats, bar height never changes */}
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", gap: 0, background: "#0B0F1A", borderRadius: 8, padding: 2, border: "1px solid rgba(148,163,184,0.08)" }}>
              {(["today", "week", "24h", "7d", "30d", "month", "custom"] as const).map((p) => {
                const labels: Record<string, string> = { "today": "Dziś", "week": "Ten tydz.", "24h": "24h", "7d": "7 dni", "30d": "30 dni", "month": "Ten miesiąc", "custom": "Niestandardowy" };
                const active = rangePreset === p;
                return (
                  <button key={p}
                    onClick={() => {
                      if (p === "custom") {
                        setDraftFrom(dateFrom);
                        setDraftTimeFrom(timeFrom);
                        setDraftTo(dateTo);
                        setDraftTimeTo(timeTo);
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
                      background: active ? "#1C2541" : "transparent",
                      color: active ? "#F1F5F9" : "#64748B",
                      transition: "color 0.15s, background 0.15s",
                    }}
                  >{labels[p]}</button>
                );
              })}
            </div>

            {/* Custom range popover — position:absolute, zero impact on bar height */}
            {showCustomPopover && (
              <div ref={customPopoverRef} style={{
                position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 200,
                background: "#161a22", border: "1px solid #363b48", borderRadius: 8,
                padding: "16px 18px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                display: "flex", flexDirection: "column", gap: 12, minWidth: 320,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.8 }}>Niestandardowy zakres</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>Od</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input type="date" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
                    <input type="time" value={draftTimeFrom} onChange={(e) => setDraftTimeFrom(e.target.value)} placeholder="00:00"
                      style={{ width: 80, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--txt)", borderRadius: 8, padding: "0.5rem 0.4rem", fontSize: "0.875rem", outline: "none" }} />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>Do</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input type="date" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
                    <input type="time" value={draftTimeTo} onChange={(e) => setDraftTimeTo(e.target.value)} placeholder="23:59"
                      style={{ width: 80, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--txt)", borderRadius: 8, padding: "0.5rem 0.4rem", fontSize: "0.875rem", outline: "none" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button onClick={() => setShowCustomPopover(false)}
                    style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: "#94A3B8", borderRadius: 8, padding: "6px 16px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
                  >Anuluj</button>
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
                    className="btn-primary" style={{ padding: "6px 18px", fontSize: 12 }}
                  >Zastosuj</button>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: "rgba(148,163,184,0.15)", flexShrink: 0 }} />

          {/* Source filter — Wszystkie / NFC / QR */}
          <div style={{ display: "flex", gap: 0, background: "#0B0F1A", borderRadius: 8, padding: 2, border: "1px solid rgba(148,163,184,0.08)" }}>
            {(["all", "nfc", "qr"] as const).map(src => (
              <button key={src} type="button"
                onClick={() => { setScanSourceFilter(src); fetchScans({ source: src, page: 1 }); fetchStats({ source: src }); }}
                style={{
                  padding: "4px 10px", fontSize: 11, fontWeight: scanSourceFilter === src ? 600 : 500, border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: scanSourceFilter === src ? "#1C2541" : "transparent",
                  color: scanSourceFilter === src ? "#F1F5F9" : "#64748B",
                  transition: "color 0.15s, background 0.15s",
                }}
              >{src === "all" ? "Wszystkie" : src.toUpperCase()}</button>
            ))}
          </div>
        </section>

        {/* ---- Error display ---- */}
        {fetchError && (
          <div style={{ margin: "20px 0", padding: "16px 20px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: 13, fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>
            {fetchError}
          </div>
        )}

        {/* ---- Loading skeleton ---- */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* KPI skeleton */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              {[1,2,3,4].map(i => (
                <div key={i} className="skeleton" style={{ height: 100, borderRadius: 8 }} />
              ))}
            </div>
            {/* Content skeleton */}
            <div className="skeleton" style={{ height: 200, borderRadius: 8 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="skeleton" style={{ height: 160, borderRadius: 8 }} />
              <div className="skeleton" style={{ height: 160, borderRadius: 8 }} />
            </div>
            <div className="skeleton" style={{ height: 180, borderRadius: 8 }} />
          </div>
        )}

        {!loading && stats && (
          <div className="anim-fade">

            {/* ========================================================== */}
            {/*  0. ACTIVE FILTERS BAR — real-overflow +N via measurement   */}
            {/* ========================================================== */}
            {(() => {
              // ---- shared helpers ----
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

              // 1. Custom date range (only in custom mode with actual values)
              const hasCustomDate = rangePreset === "custom" && (dateFrom || dateTo);
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

              // 4. Selected actions (multi) — one chip per tag, deduplicated by id
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

              // 5. Single tagFilter (drill-down from scan table) — only if not already in selectedTagIds
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

              // 6. Source filter (only when ≠ "all")
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
                  onReset={handleResetFilters}
                  showOverflow={showChipsOverflow}
                  setShowOverflow={setShowChipsOverflow}
                  overflowRef={chipsOverflowRef}
                />
              );
            })()}

            {/* ========================================================== */}
            {/*  1. KPI CARDS                                              */}
            {/* ========================================================== */}

            {/* KPI METRIC STRIP — no cards, just numbers with dividers */}
            <section
              style={{
                display: "flex",
                alignItems: "baseline",
                padding: "20px 0",
                borderBottom: "1px solid rgba(148,163,184,0.08)",
                marginBottom: 28,
                gap: 0,
              }}
            >
              {/* Total Scans */}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748B", marginBottom: 4 }}>
                  Wszystkie skany
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 600, color: "#F1F5F9", letterSpacing: "-0.02em" }}>
                  {kpi?.totalScans.toLocaleString("pl-PL") ?? "0"}
                </p>
                <p style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                  Łącznie zarejestrowanych
                </p>
              </div>

              {/* Unique Users — visually distinct with accent color */}
              <div style={{ flex: 1, borderLeft: "1px solid rgba(148,163,184,0.08)", paddingLeft: 24 }}>
                <p style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748B", marginBottom: 4 }}>
                  Unikalni
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 600, color: "#38BDF8", letterSpacing: "-0.02em" }}>
                  {kpi?.uniqueUsers.toLocaleString("pl-PL") ?? "0"}
                </p>
                <p style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                  Różne urządzenia
                </p>
              </div>

              {/* Last Scan */}
              <div style={{ flex: 1, borderLeft: "1px solid rgba(148,163,184,0.08)", paddingLeft: 24 }}>
                <p style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748B", marginBottom: 4 }}>
                  Ostatni skan
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 600, color: "#F1F5F9" }}>
                  {formatDate(kpi?.lastScan ?? null)}
                </p>
              </div>

              {/* Avg Scans Per User */}
              <div style={{ flex: 1, borderLeft: "1px solid rgba(148,163,184,0.08)", paddingLeft: 24 }}>
                <p style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748B", marginBottom: 4 }}>
                  Śr. skanów / osoba
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 600, color: "#22c55e", letterSpacing: "-0.02em" }}>
                  {kpi?.avgScansPerUser ?? 0}x
                </p>
                <p style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                  {(kpi?.avgScansPerUser ?? 0) <= 1.2 ? "Większość skanuje raz" : "Użytkownicy wracają"}
                </p>
              </div>
            </section>

            {/* ========================================================== */}
            {/*  1b. VIDEO RETENTION CHART (when video campaign selected)  */}
            {/* ========================================================== */}

            {selectedVideoRetention && (
              <section className="card" style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                      Retencja video
                    </h3>
                    <p style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                      Ile % widzow dotarlo do kazdego momentu
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 22, fontWeight: 700, color: "#10b981" }}>{selectedVideoRetention.plays}</p>
                      <p style={{ fontSize: 10, color: "#94A3B8" }}>Odtworzen</p>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 22, fontWeight: 700, color: "#60a5fa" }}>{selectedVideoRetention.completions}</p>
                      <p style={{ fontSize: 10, color: "#94A3B8" }}>Do konca</p>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 22, fontWeight: 700, color: "#7dd3fc" }}>{formatWatchTime(selectedVideoRetention.avgWatchTime)}</p>
                      <p style={{ fontSize: 10, color: "#94A3B8" }}>Sred. czas</p>
                    </div>
                  </div>
                </div>

                {/* SVG Area Chart - YouTube-style retention */}
                {(() => {
                  const plays = selectedVideoRetention.plays || 1;
                  const points = [
                    { label: "Start", pct: 100, count: plays },
                    { label: "25%", pct: Math.round((selectedVideoRetention.progress25 / plays) * 100), count: selectedVideoRetention.progress25 },
                    { label: "50%", pct: Math.round((selectedVideoRetention.progress50 / plays) * 100), count: selectedVideoRetention.progress50 },
                    { label: "75%", pct: Math.round((selectedVideoRetention.progress75 / plays) * 100), count: selectedVideoRetention.progress75 },
                    { label: "100%", pct: Math.round((selectedVideoRetention.progress100 / plays) * 100), count: selectedVideoRetention.progress100 },
                  ];
                  const chartW = 500;
                  const chartH = 200;
                  const padL = 40;
                  const padR = 20;
                  const padT = 10;
                  const padB = 30;
                  const innerW = chartW - padL - padR;
                  const innerH = chartH - padT - padB;

                  const xCoords = points.map((_, i) => padL + (i / (points.length - 1)) * innerW);
                  const yCoords = points.map(p => padT + innerH - (p.pct / 100) * innerH);

                  const linePath = points.map((_, i) => `${i === 0 ? "M" : "L"}${xCoords[i]},${yCoords[i]}`).join(" ");
                  const areaPath = `${linePath} L${xCoords[xCoords.length - 1]},${padT + innerH} L${xCoords[0]},${padT + innerH} Z`;

                  return (
                    <div style={{ position: "relative" }}>
                      <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: "100%", height: "auto", maxHeight: 220 }}>
                        <defs>
                          <linearGradient id="retentionGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                          </linearGradient>
                        </defs>

                        {/* Horizontal grid lines */}
                        {[0, 25, 50, 75, 100].map(v => {
                          const y = padT + innerH - (v / 100) * innerH;
                          return (
                            <g key={v}>
                              <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="rgba(148,163,184,0.15)" strokeWidth="1" />
                              <text x={padL - 6} y={y + 4} fill="#6060a0" fontSize="10" textAnchor="end">{v}%</text>
                            </g>
                          );
                        })}

                        {/* Area fill */}
                        <path d={areaPath} fill="url(#retentionGrad)" />

                        {/* Line */}
                        <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                        {/* Data points + labels */}
                        {points.map((p, i) => (
                          <g key={i}>
                            <circle cx={xCoords[i]} cy={yCoords[i]} r="5" fill="#0f0f1a" stroke="#10b981" strokeWidth="2.5" />
                            <text x={xCoords[i]} y={yCoords[i] - 12} fill="#f0f0ff" fontSize="11" fontWeight="700" textAnchor="middle">
                              {p.pct}%
                            </text>
                            <text x={xCoords[i]} y={yCoords[i] - 24} fill="#6060a0" fontSize="9" textAnchor="middle">
                              ({p.count})
                            </text>
                            {/* X-axis label */}
                            <text x={xCoords[i]} y={chartH - 6} fill="#a0a0c0" fontSize="11" fontWeight="500" textAnchor="middle">
                              {p.label}
                            </text>
                          </g>
                        ))}
                      </svg>

                      {/* Completion rate highlight */}
                      <div style={{
                        marginTop: 12,
                        display: "flex",
                        gap: 12,
                        justifyContent: "center",
                        flexWrap: "wrap",
                      }}>
                        {points.slice(1).map((p, i) => (
                          <div key={i} style={{
                            background: p.pct >= 75 ? "rgba(16,185,129,0.12)" : p.pct >= 50 ? "rgba(96,165,250,0.12)" : p.pct >= 25 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
                            border: `1px solid ${p.pct >= 75 ? "rgba(16,185,129,0.25)" : p.pct >= 50 ? "rgba(96,165,250,0.25)" : p.pct >= 25 ? "rgba(245,158,11,0.25)" : "rgba(239,68,68,0.25)"}`,
                            borderRadius: 8,
                            padding: "8px 16px",
                            textAlign: "center",
                          }}>
                            <p style={{
                              fontSize: 18,
                              fontWeight: 700,
                              color: p.pct >= 75 ? "#10b981" : p.pct >= 50 ? "#60a5fa" : p.pct >= 25 ? "#f59e0b" : "#f87171",
                            }}>{p.pct}%</p>
                            <p style={{ fontSize: 10, color: "#94A3B8" }}>dotarli do {p.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </section>
            )}

            {/* ========================================================== */}
            {/*  2. DEVICES + TOP TAGS                                     */}
            {/* ========================================================== */}

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                gap: 16,
                marginBottom: 24,
              }}
            >
              {/* Devices */}
              <div className="card">
                <h3 style={{ fontSize: 11, fontWeight: 600, marginBottom: 16, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Urzadzenia
                </h3>

                {[
                  { label: "iOS", value: devices?.iOS ?? 0, percent: iosPercent, color: "#38BDF8" },
                  { label: "Android", value: devices?.Android ?? 0, percent: androidPercent, color: "#10b981" },
                  { label: "Desktop", value: devices?.Desktop ?? 0, percent: desktopPercent, color: "#94A3B8" },
                ].map((d) => (
                  <div key={d.label} style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 5,
                        fontSize: 12,
                      }}
                    >
                      <span style={{ color: "#F1F5F9", fontWeight: 500 }}>{d.label}</span>
                      <span style={{ color: "#94A3B8", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                        {d.value} <span style={{ color: "#64748B" }}>({d.percent}%)</span>
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${d.percent}%`,
                          background: d.color,
                        }}
                      />
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(148,163,184,0.06)" }}>
                  <span style={{ fontSize: 11, color: "#64748B", fontFamily: "var(--font-mono)" }}>
                    Razem: {devices?.total.toLocaleString("pl-PL") ?? 0}
                  </span>
                </div>
              </div>

              {/* Top Tags */}
              <div className="card">
                <h3 style={{ fontSize: 11, fontWeight: 600, marginBottom: 14, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Najczesciej skanowane
                </h3>
                {topTags.length === 0 && (
                  <p style={{ color: "#64748B", fontSize: 13 }}>Brak danych</p>
                )}
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
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: "#64748B",
                          fontFamily: "var(--font-mono)",
                          width: 16,
                          textAlign: "right",
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "#F1F5F9" }}>
                          {t.tagName}
                        </p>
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
              </div>
            </section>

            {/* ========================================================== */}
            {/*  3. COUNTRIES + CITIES                                     */}
            {/* ========================================================== */}

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                gap: 16,
                marginBottom: 24,
              }}
            >
              {/* Countries */}
              <div className="card">
                <h3 style={{ fontSize: 11, fontWeight: 600, marginBottom: 14, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Kraje
                </h3>
                {topCountries.length === 0 && (
                  <p style={{ color: "#64748B", fontSize: 14 }}>Brak danych</p>
                )}
                {topCountries.slice((countriesPage - 1) * 5, countriesPage * 5).map((c, i, arr) => (
                  <div
                    key={c.country}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderBottom: i < arr.length - 1 ? "1px solid rgba(148,163,184,0.08)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{getCountryFlag(c.country)}</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#F1F5F9" }}>
                        {c.country}
                      </span>
                    </div>
                    <div style={{ textAlign: "right", display: "flex", gap: 12, alignItems: "center" }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#F1F5F9", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>{c.count}</span>
                        <span style={{ fontSize: 10, color: "#94A3B8", marginLeft: 4 }}>sk.</span>
                      </div>
                      <div style={{ borderLeft: "1px solid rgba(148,163,184,0.08)", paddingLeft: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#38BDF8", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>{c.uniqueUsers}</span>
                        <span style={{ fontSize: 10, color: "#94A3B8", marginLeft: 4 }}>unik.</span>
                      </div>
                    </div>
                  </div>
                ))}
                {topCountries.length > 5 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(148,163,184,0.08)" }}>
                    <span style={{ fontSize: 10, color: "#64748B" }}>{Math.min(countriesPage * 5, topCountries.length)}/{topCountries.length}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        disabled={countriesPage <= 1}
                        onClick={() => setCountriesPage(p => p - 1)}
                        style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: countriesPage <= 1 ? "#3d4250" : "#94A3B8", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: countriesPage <= 1 ? "default" : "pointer" }}
                      >← Poprz.</button>
                      <button
                        disabled={countriesPage * 5 >= topCountries.length}
                        onClick={() => setCountriesPage(p => p + 1)}
                        style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: countriesPage * 5 >= topCountries.length ? "#3d4250" : "#94A3B8", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: countriesPage * 5 >= topCountries.length ? "default" : "pointer" }}
                      >Nast. →</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cities */}
              <div className="card">
                <h3 style={{ fontSize: 11, fontWeight: 600, marginBottom: 14, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Miasta
                </h3>
                {topCities.length === 0 && (
                  <p style={{ color: "#64748B", fontSize: 14 }}>Brak danych</p>
                )}
                {topCities.slice((citiesPage - 1) * 5, citiesPage * 5).map((c, i, arr) => (
                  <div
                    key={`${c.city}-${c.country}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderBottom: i < arr.length - 1 ? "1px solid rgba(148,163,184,0.08)" : "none",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "#F1F5F9" }}>
                        {c.city}
                      </p>
                      <p style={{ fontSize: 11, color: "#64748B" }}>{c.country}</p>
                    </div>
                    <div style={{ textAlign: "right", display: "flex", gap: 12, alignItems: "center" }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#F1F5F9", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>{c.count}</span>
                        <span style={{ fontSize: 10, color: "#94A3B8", marginLeft: 4 }}>sk.</span>
                      </div>
                      <div style={{ borderLeft: "1px solid rgba(148,163,184,0.08)", paddingLeft: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#38BDF8", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>{c.uniqueUsers}</span>
                        <span style={{ fontSize: 10, color: "#94A3B8", marginLeft: 4 }}>unik.</span>
                      </div>
                    </div>
                  </div>
                ))}
                {topCities.length > 5 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(148,163,184,0.08)" }}>
                    <span style={{ fontSize: 10, color: "#64748B" }}>{Math.min(citiesPage * 5, topCities.length)}/{topCities.length}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        disabled={citiesPage <= 1}
                        onClick={() => setCitiesPage(p => p - 1)}
                        style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: citiesPage <= 1 ? "#3d4250" : "#94A3B8", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: citiesPage <= 1 ? "default" : "pointer" }}
                      >← Poprz.</button>
                      <button
                        disabled={citiesPage * 5 >= topCities.length}
                        onClick={() => setCitiesPage(p => p + 1)}
                        style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: citiesPage * 5 >= topCities.length ? "#3d4250" : "#94A3B8", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: citiesPage * 5 >= topCities.length ? "default" : "pointer" }}
                      >Nast. →</button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ========================================================== */}
            {/*  4. WEEKLY CHART + LANGUAGES                               */}
            {/* ========================================================== */}

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                gap: 16,
                marginBottom: 24,
              }}
            >
              {/* Weekly Chart */}
              <div className="card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  <h3 style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                    Trend tygodniowy
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => handleWeekChange(-1)}
                      style={{
                        background: "transparent",
                        border: "1px solid rgba(148,163,184,0.08)",
                        color: "#94A3B8",
                        borderRadius: 6,
                        width: 32,
                        height: 32,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        transition: "border-color 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#38BDF8")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(148,163,184,0.15)")}
                    >
                      &#8249;
                    </button>
                    <span style={{ fontSize: 12, color: "#94A3B8", minWidth: 100, textAlign: "center" }}>
                      {weekly
                        ? formatWeekRange(weekly.weekStart, weekly.weekEnd)
                        : "---"}
                    </span>
                    <button
                      onClick={() => handleWeekChange(1)}
                      disabled={weekOffset >= 0}
                      style={{
                        background: "transparent",
                        border: "1px solid rgba(148,163,184,0.08)",
                        color: weekOffset >= 0 ? "#3d4250" : "#a0a0c0",
                        borderRadius: 6,
                        width: 32,
                        height: 32,
                        cursor: weekOffset >= 0 ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        transition: "border-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (weekOffset < 0) e.currentTarget.style.borderColor = "#38BDF8";
                      }}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(148,163,184,0.15)")}
                    >
                      &#8250;
                    </button>
                  </div>
                </div>

                {/* Bar chart with unique overlay */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 8,
                    height: 200,
                    paddingTop: 8,
                  }}
                >
                  {weekly?.data.map((d) => {
                    const barH = maxWeeklyCount > 0 ? (d.count / maxWeeklyCount) * 160 : 0;
                    const uBarH = maxWeeklyCount > 0 ? (d.uniqueUsers / maxWeeklyCount) * 160 : 0;
                    return (
                      <div
                        key={d.date}
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <span style={{ fontSize: 10, fontWeight: 600, color: d.count > 0 ? "#7dd3fc" : "#3d4250" }}>
                          {d.count}
                        </span>
                        <span style={{ fontSize: 9, fontWeight: 600, color: d.uniqueUsers > 0 ? "#10b981" : "#3d4250" }}>
                          {d.uniqueUsers} un.
                        </span>
                        <div style={{ position: "relative", width: "100%", maxWidth: 48, height: Math.max(barH, 4) }}>
                          {/* Total bar (orange) */}
                          <div
                            style={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: Math.max(barH, 4),
                              borderRadius: "6px 6px 2px 2px",
                              background: d.count > 0 ? "#38BDF8" : "#243052",
                              transition: "height 0.4s ease",
                              opacity: 0.35,
                            }}
                          />
                          {/* Unique bar (green, on top) */}
                          <div
                            style={{
                              position: "absolute",
                              bottom: 0,
                              left: "15%",
                              right: "15%",
                              height: Math.max(uBarH, d.uniqueUsers > 0 ? 4 : 0),
                              borderRadius: "4px 4px 2px 2px",
                              background: d.uniqueUsers > 0 ? "#10b981" : "transparent",
                              transition: "height 0.4s ease",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>
                          {d.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
                  <span style={{ fontSize: 10, color: "#7dd3fc", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: "#7dd3fc", opacity: 0.5, display: "inline-block" }} /> Wszystkie
                  </span>
                  <span style={{ fontSize: 10, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: "#10b981", display: "inline-block" }} /> Unikalne
                  </span>
                </div>
              </div>

              {/* Languages */}
              <div className="card">
                <h3 style={{ fontSize: 11, fontWeight: 600, marginBottom: 14, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Jezyki przegladarek
                </h3>
                {topLanguages.length === 0 && (
                  <p style={{ color: "#64748B", fontSize: 14 }}>Brak danych</p>
                )}
                {topLanguages.slice((languagesPage - 1) * 5, languagesPage * 5).map((l, i, arr) => (
                  <div
                    key={l.lang}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderBottom: i < arr.length - 1 ? "1px solid rgba(148,163,184,0.08)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: "transparent",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#7dd3fc",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {l.lang}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div className="progress-bar" style={{ width: 80 }}>
                        <div className="progress-fill" style={{ width: `${l.percent}%` }} />
                      </div>
                      <span style={{ fontSize: 12, color: "#94A3B8", minWidth: 50, textAlign: "right", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                        {l.count}
                      </span>
                      <span style={{ fontSize: 11, color: "#38BDF8", minWidth: 40, textAlign: "right", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                        {l.uniqueUsers} un.
                      </span>
                    </div>
                  </div>
                ))}
                {topLanguages.length > 5 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(148,163,184,0.08)" }}>
                    <span style={{ fontSize: 10, color: "#64748B" }}>{Math.min(languagesPage * 5, topLanguages.length)}/{topLanguages.length}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        disabled={languagesPage <= 1}
                        onClick={() => setLanguagesPage(p => p - 1)}
                        style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: languagesPage <= 1 ? "#3d4250" : "#94A3B8", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: languagesPage <= 1 ? "default" : "pointer" }}
                      >← Poprz.</button>
                      <button
                        disabled={languagesPage * 5 >= topLanguages.length}
                        onClick={() => setLanguagesPage(p => p + 1)}
                        style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: languagesPage * 5 >= topLanguages.length ? "#3d4250" : "#94A3B8", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: languagesPage * 5 >= topLanguages.length ? "default" : "pointer" }}
                      >Nast. →</button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ========================================================== */}
            {/*  4a. HOURLY DISTRIBUTION                                   */}
            {/* ========================================================== */}

            {hourly.length > 0 && hourly.some(h => h.count > 0) && (
              <section className="card" style={{ marginBottom: 24 }}>
                {/* Header with peak insight + mode toggle */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Rozklad godzinowy
                    </h3>
                    {/* Peak insight */}
                    {(() => {
                      const peak = hourly.reduce((a, b) => b.count > a.count ? b : a, hourly[0]);
                      const totalH = hourly.reduce((s, h) => s + h.count, 0);
                      const peakPct = totalH > 0 ? Math.round((peak.count / totalH) * 100) : 0;
                      return peak.count > 0 ? (
                        <p style={{ fontSize: 12, color: "#94A3B8", display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ color: "#10b981", fontWeight: 700 }}>Szczyt:</span>
                          {peak.hour}:00–{peak.hour + 1}:00
                          <span style={{ color: "#7dd3fc", fontWeight: 600 }}>({peak.count} skanow, {peak.uniqueUsers} unik.)</span>
                          <span style={{ color: "#64748B" }}>· {peakPct}% calego ruchu</span>
                        </p>
                      ) : null;
                    })()}
                  </div>
                  {/* Toggles */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {/* Data mode toggle */}
                    <div style={{ display: "flex", background: "#1C2541", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(148,163,184,0.08)" }}>
                      <button
                        onClick={() => setHourlyDataMode("both")}
                        style={{
                          padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", transition: "all 0.2s",
                          background: hourlyDataMode === "both" ? "rgba(56,189,248,0.12)" : "transparent",
                          color: hourlyDataMode === "both" ? "#7dd3fc" : "#64748B",
                        }}
                      >
                        Razem
                      </button>
                      <button
                        onClick={() => setHourlyDataMode("all")}
                        style={{
                          padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", transition: "all 0.2s",
                          background: hourlyDataMode === "all" ? "rgba(56,189,248,0.12)" : "transparent",
                          color: hourlyDataMode === "all" ? "#7dd3fc" : "#64748B",
                        }}
                      >
                        Wszystkie
                      </button>
                      <button
                        onClick={() => setHourlyDataMode("unique")}
                        style={{
                          padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", transition: "all 0.2s",
                          background: hourlyDataMode === "unique" ? "rgba(16,185,129,0.15)" : "transparent",
                          color: hourlyDataMode === "unique" ? "#10b981" : "#64748B",
                        }}
                      >
                        Unikalne
                      </button>
                    </div>
                    {/* View mode toggle */}
                    <div style={{ display: "flex", background: "#1C2541", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(148,163,184,0.08)" }}>
                      <button
                        onClick={() => setHourlyMode("bars")}
                        style={{
                          padding: "6px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", transition: "all 0.2s",
                          background: hourlyMode === "bars" ? "rgba(56,189,248,0.12)" : "transparent",
                          color: hourlyMode === "bars" ? "#7dd3fc" : "#64748B",
                        }}
                      >
                        Histogram
                      </button>
                      <button
                        onClick={() => setHourlyMode("heatmap")}
                        style={{
                          padding: "6px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", transition: "all 0.2s",
                          background: hourlyMode === "heatmap" ? "rgba(56,189,248,0.12)" : "transparent",
                          color: hourlyMode === "heatmap" ? "#7dd3fc" : "#64748B",
                        }}
                      >
                        Heatmapa
                      </button>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                  {hourlyDataMode !== "unique" && (
                    <span style={{ fontSize: 10, color: "#7dd3fc", display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: "#7dd3fc", opacity: 0.6, display: "inline-block" }} /> Wszystkie skany
                    </span>
                  )}
                  {hourlyDataMode !== "all" && (
                    <span style={{ fontSize: 10, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: "#10b981", display: "inline-block" }} /> Unikalni
                    </span>
                  )}
                </div>

                {/* HISTOGRAM MODE */}
                {hourlyMode === "bars" && (
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 200, paddingTop: 8 }}>
                    {hourly.map((h) => {
                      const showAll = hourlyDataMode !== "unique";
                      const showUnique = hourlyDataMode !== "all";
                      const primaryVal = hourlyDataMode === "unique" ? h.uniqueUsers : h.count;
                      const maxH = Math.max(...hourly.map(x => hourlyDataMode === "unique" ? x.uniqueUsers : x.count), 1);
                      const barH = (h.count / maxH) * 160;
                      const uBarH = (h.uniqueUsers / maxH) * 160;
                      const isActive = primaryVal > 0;
                      return (
                        <div key={h.hour} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }} title={`${h.hour}:00 - ${h.count} skanow, ${h.uniqueUsers} unikalnych`}>
                          {isActive && showAll && (
                            <span style={{ fontSize: 9, fontWeight: 700, color: "#7dd3fc" }}>{h.count}</span>
                          )}
                          {isActive && showUnique && (h.uniqueUsers < h.count || !showAll) && (
                            <span style={{ fontSize: 8, fontWeight: 600, color: "#10b981" }}>{h.uniqueUsers}</span>
                          )}
                          <div style={{ position: "relative", width: "100%", height: Math.max(showAll ? barH : uBarH, isActive ? 4 : 2) }}>
                            {/* Total bar */}
                            {showAll && (
                              <div style={{
                                position: "absolute", bottom: 0, left: "10%", right: "10%",
                                height: Math.max(barH, h.count > 0 ? 4 : 2),
                                borderRadius: "3px 3px 0 0",
                                background: h.count > 0 ? "rgba(0,200,160,0.6)" : "#1C2541",
                                transition: "height 0.3s ease",
                              }} />
                            )}
                            {/* Unique overlay */}
                            {showUnique && h.uniqueUsers > 0 && (
                              <div style={{
                                position: "absolute", bottom: 0,
                                left: showAll ? "25%" : "10%",
                                right: showAll ? "25%" : "10%",
                                height: Math.max(uBarH, 3),
                                borderRadius: "2px 2px 0 0",
                                background: "rgba(16,185,129,0.7)",
                                transition: "height 0.3s ease",
                              }} />
                            )}
                          </div>
                          <span style={{ fontSize: 8, color: isActive ? "#94A3B8" : "#363b48", fontWeight: 500 }}>
                            {h.hour}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* HEATMAP MODE */}
                {hourlyMode === "heatmap" && (
                  <div style={{ overflowX: "auto" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "50px repeat(24, 1fr)", gap: 1, minWidth: 600 }}>
                      {/* Header row: hours */}
                      <div />
                      {Array.from({ length: 24 }, (_, h) => (
                        <div key={`hdr-${h}`} style={{ textAlign: "center", fontSize: 8, color: "#64748B", padding: "4px 0", fontWeight: 500 }}>
                          {h}
                        </div>
                      ))}
                      {/* Data rows: each day */}
                      {["Pon", "Wt", "Sr", "Czw", "Pt", "Sob", "Nd"].map((dayName, dayIdx) => (
                        <React.Fragment key={`row-${dayIdx}`}>
                          <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, display: "flex", alignItems: "center", paddingRight: 8 }}>
                            {dayName}
                          </div>
                          {Array.from({ length: 24 }, (_, h) => {
                            const isUnique = hourlyDataMode === "unique";
                            const val = isUnique ? (heatmapUniqueData[dayIdx]?.[h] || 0) : (heatmapData[dayIdx]?.[h] || 0);
                            const maxVal = isUnique ? heatmapUniqueMax : heatmapMax;
                            const intensity = maxVal > 0 ? val / maxVal : 0;
                            // Color interpolation: 0 = dark, unique = green, all/both = orange
                            const bg = val === 0
                              ? "#151D35"
                              : isUnique
                                ? `rgba(16, 185, 129, ${0.15 + intensity * 0.85})`
                                : `rgba(46, 232, 192, ${0.15 + intensity * 0.85})`;
                            return (
                              <div
                                key={`cell-${dayIdx}-${h}`}
                                title={`${dayName} ${h}:00 — ${val} ${isUnique ? "unikalnych" : "skanow"}`}
                                style={{
                                  height: 22,
                                  borderRadius: 2,
                                  background: bg,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 8,
                                  fontWeight: 700,
                                  color: val > 0 ? (intensity > 0.5 ? "#151D35" : "#F1F5F9") : "transparent",
                                  cursor: "default",
                                  transition: "background 0.2s",
                                }}
                              >
                                {val > 0 ? val : ""}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                    {/* Heatmap scale */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
                      <span style={{ fontSize: 9, color: "#64748B" }}>Mniej</span>
                      <div style={{ display: "flex", gap: 2 }}>
                        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
                          <div key={i} style={{ width: 16, height: 10, borderRadius: 2, background: f === 0 ? "#151D35" : hourlyDataMode === "unique" ? `rgba(16, 185, 129, ${0.15 + f * 0.85})` : `rgba(46, 232, 192, ${0.15 + f * 0.85})` }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 9, color: "#64748B" }}>Wiecej</span>
                    </div>
                  </div>
                )}

                {/* Timezone note */}
                <p style={{ fontSize: 10, color: "#3d4250", marginTop: 10, textAlign: "right" }}>
                  Strefa czasowa: przegladarka ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                </p>
              </section>
            )}

            {/* ========================================================== */}
            {/*  4b. NFC CHIPS (physical keychains)                        */}
            {/* ========================================================== */}

            {stats.nfcChips && stats.nfcChips.length > 0 && (
              <section className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 16 }}>
                  Fizyczne breloczki NFC
                </h3>
                <p style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>
                  Unikalne chipy NFC ({stats.nfcChips.length} {stats.nfcChips.length === 1 ? "breloczek" : "breloczków"}, {stats.nfcChips.reduce((s, c) => s + c.count, 0)} skanów łącznie)
                </p>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(148,163,184,0.08)" }}>
                        <th style={{ textAlign: "left", padding: "8px 12px", color: "#94A3B8", fontWeight: 600 }}>#</th>
                        <th style={{ textAlign: "left", padding: "8px 12px", color: "#94A3B8", fontWeight: 600 }}>NFC Chip ID</th>
                        <th style={{ textAlign: "right", padding: "8px 12px", color: "#94A3B8", fontWeight: 600 }}>Skany</th>
                        <th style={{ textAlign: "right", padding: "8px 12px", color: "#94A3B8", fontWeight: 600 }}>Udział</th>
                        <th style={{ padding: "8px 12px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.nfcChips.map((chip, idx) => {
                        const totalNfc = stats.nfcChips.reduce((s, c) => s + c.count, 0);
                        const pct = totalNfc > 0 ? Math.round((chip.count / totalNfc) * 100) : 0;
                        return (
                          <tr key={chip.nfcId} style={{ borderBottom: "1px solid #1C2541" }}>
                            <td style={{ padding: "8px 12px", color: "#64748B" }}>{idx + 1}</td>
                            <td style={{ padding: "8px 12px" }}>
                              <button
                                onClick={() => { setScanNfcFilter(chip.nfcId); setShowScanTable(true); fetchScans({ nfcId: chip.nfcId, page: 1 }); setTimeout(() => scanTableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200); }}
                                style={{ background: "none", border: "none", fontFamily: "var(--font-mono)", color: "#7dd3fc", fontWeight: 600, cursor: "pointer", textDecoration: "underline", padding: 0, fontSize: 12 }}
                                title="Kliknij zeby zobaczyc skany tego chipa"
                              >
                                {chip.nfcId}
                              </button>
                            </td>
                            <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#F1F5F9" }}>{chip.count}</td>
                            <td style={{ padding: "8px 12px", textAlign: "right" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                                <div style={{ width: 50, height: 4, background: "transparent", borderRadius: 2, overflow: "hidden" }}>
                                  <div style={{ width: `${pct}%`, height: "100%", background: "#8b5cf6", borderRadius: 2 }} />
                                </div>
                                <span style={{ color: "#94A3B8", minWidth: 30 }}>{pct}%</span>
                              </div>
                            </td>
                            <td style={{ padding: "8px 12px" }}>
                              <button
                                onClick={() => { setScanNfcFilter(chip.nfcId); setShowScanTable(true); fetchScans({ nfcId: chip.nfcId, page: 1 }); setTimeout(() => scanTableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200); }}
                                style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: "#60a5fa", borderRadius: 4, padding: "3px 8px", fontSize: 10, cursor: "pointer" }}
                              >
                                Pokaz skany
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ========================================================== */}
            {/*  4b2. QR SCANS SUMMARY (visible when source=qr or all)    */}
            {/* ========================================================== */}
            {(scanSourceFilter === "qr" || scanSourceFilter === "all") && topTags.length > 0 && (
              <section className="card" style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <h3 style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 2 }}>
                      <span style={{ marginRight: 8 }}>📱</span>Skanowania QR
                    </h3>
                    <p style={{ fontSize: 12, color: "#64748B" }}>
                      {scanSourceFilter === "qr"
                        ? `Skany wyłącznie ze źródła QR — ${stats.kpi.totalScans} łącznie`
                        : "Statystyki akcji (wszystkie źródła). Filtruj QR aby zobaczyć tylko skany z kodów QR."}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {topTags.slice(0, 5).map((t, idx) => (
                    <div key={t.tagId} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 10, color: "#3d4250", minWidth: 16, textAlign: "right" }}>{idx + 1}</span>
                      <button
                        onClick={() => setTagFilter(t.tagId)}
                        style={{ background: "none", border: "none", color: "#7dd3fc", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: 0, textAlign: "left", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        title={t.tagId}
                      >{t.tagName}</button>
                      <span style={{ fontSize: 11, color: "#F1F5F9", fontWeight: 700, minWidth: 32, textAlign: "right" }}>{t.count}</span>
                      <div style={{ width: 60, height: 4, background: "transparent", borderRadius: 2, overflow: "hidden", flexShrink: 0 }}>
                        <div style={{ width: `${t.percent}%`, height: "100%", background: "#10b981", borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 10, color: "#64748B", minWidth: 28 }}>{t.percent}%</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ========================================================== */}
            {/*  4c. RAW SCAN TABLE                                        */}
            {/* ========================================================== */}

            <section ref={scanTableRef} className="card" style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                    Lista skanow
                  </h3>
                  <button
                    onClick={() => { setShowScanTable(!showScanTable); if (!showScanTable && !scanData) fetchScans({ page: 1 }); }}
                    style={{
                      background: showScanTable ? "rgba(0,200,160,0.12)" : "#243052",
                      border: `1px solid ${showScanTable ? "rgba(0,200,160,0.3)" : "rgba(148,163,184,0.15)"}`,
                      color: showScanTable ? "#7dd3fc" : "#94A3B8",
                      borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600,
                    }}
                  >
                    {showScanTable ? "Ukryj" : "Pokaz"} {scanData ? `(${scanData.total})` : ""}
                  </button>
                  {/* Source badge — read-only, control is in FilterBar above */}
                  {scanSourceFilter !== "all" && (
                    <span style={{
                      padding: "3px 10px", fontSize: 11, fontWeight: 600, borderRadius: 6,
                      background: scanSourceFilter === "qr" ? "rgba(16,185,129,0.15)" : "rgba(56,189,248,0.12)",
                      color: scanSourceFilter === "qr" ? "#10b981" : "#7dd3fc",
                      border: `1px solid ${scanSourceFilter === "qr" ? "rgba(16,185,129,0.3)" : "rgba(0,200,160,0.3)"}`,
                    }}>
                      {scanSourceFilter.toUpperCase()}
                    </span>
                  )}
                </div>
                {showScanTable && scanNfcFilter && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)" }}>
                    <span style={{ fontSize: 11, color: "#a78bfa" }}>NFC: {scanNfcFilter}</span>
                    <button onClick={() => { setScanNfcFilter(null); fetchScans({ nfcId: null, page: 1 }); }} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: 14 }}>×</button>
                  </div>
                )}
              </div>

              {showScanTable && (
                <>
                  {scanLoading && <p style={{ fontSize: 12, color: "#64748B", padding: "20px 0", textAlign: "center" }}>Ladowanie...</p>}
                  {scanData && !scanLoading && (
                    <>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                          <thead>
                            <tr style={{ borderBottom: "2px solid rgba(148,163,184,0.15)" }}>
                              {[
                                { key: "seq", label: "#", w: 40 },
                                { key: "timestamp", label: "Data/Czas", w: 140 },
                                { key: "tagId", label: "Akcja", w: 140 },
                                { key: "nfcId", label: "Źródło / ID", w: 130 },
                                { key: "deviceType", label: "Urzadzenie", w: 80 },
                                { key: "country", label: "Kraj", w: 60 },
                                { key: "city", label: "Miasto", w: 100 },
                              ].map(col => (
                                <th
                                  key={col.key}
                                  onClick={() => {
                                    if (col.key === "seq") return;
                                    const newDir = scanSortBy === col.key && scanSortDir === "desc" ? "asc" : "desc";
                                    setScanSortBy(col.key);
                                    setScanSortDir(newDir);
                                    fetchScans({ sortBy: col.key, sortDir: newDir, page: 1 });
                                  }}
                                  style={{
                                    textAlign: "left",
                                    padding: "8px 8px",
                                    color: scanSortBy === col.key ? "#7dd3fc" : "#94A3B8",
                                    fontWeight: 600,
                                    cursor: col.key === "seq" ? "default" : "pointer",
                                    minWidth: col.w,
                                    whiteSpace: "nowrap",
                                    userSelect: "none",
                                  }}
                                >
                                  {col.label}
                                  {scanSortBy === col.key && (
                                    <span style={{ marginLeft: 4 }}>{scanSortDir === "desc" ? "↓" : "↑"}</span>
                                  )}
                                </th>
                              ))}
                              <th style={{ textAlign: "left", padding: "8px 8px", color: "#94A3B8", fontWeight: 600 }}>Jezyk</th>
                              <th style={{ textAlign: "left", padding: "8px 8px", color: "#94A3B8", fontWeight: 600 }} title="Czy ta osoba skanowala te sama akcje wczesniej">Ponowny</th>
                              <th
                                onClick={() => {
                                  const newDir = scanSortBy === "ipHash" && scanSortDir === "desc" ? "asc" : "desc";
                                  setScanSortBy("ipHash");
                                  setScanSortDir(newDir);
                                  fetchScans({ sortBy: "ipHash", sortDir: newDir, page: 1 });
                                }}
                                style={{ textAlign: "left", padding: "8px 8px", color: scanSortBy === "ipHash" ? "#7dd3fc" : "#94A3B8", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", userSelect: "none" }}
                                title="Sortuj po gosciu — grupuje skany tej samej osoby razem"
                              >
                                Gość {scanSortBy === "ipHash" && <span style={{ marginLeft: 4 }}>{scanSortDir === "desc" ? "↓" : "↑"}</span>}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {scanData.rows.map((scan, idx) => (
                              <tr key={scan.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                <td style={{ padding: "6px 8px", color: "#64748B", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                                  {scan.seq}
                                </td>
                                <td style={{ padding: "6px 8px", color: "#F1F5F9", fontFamily: "var(--font-mono)", fontSize: 10 }}>
                                  {new Date(scan.timestamp).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                </td>
                                <td style={{ padding: "6px 8px" }}>
                                  <button
                                    onClick={() => { setTagFilter(scan.tagId); }}
                                    style={{ background: "none", border: "none", color: "#7dd3fc", cursor: "pointer", fontSize: 11, fontWeight: 600, padding: 0, textDecoration: "underline" }}
                                    title={`Filtruj po: ${scan.tagName}`}
                                  >
                                    {scan.tagName}
                                  </button>
                                  <span style={{ fontSize: 9, color: "#64748B", marginLeft: 4 }}>{scan.tagId}</span>
                                </td>
                                <td style={{ padding: "6px 8px" }}>
                                  {scan.eventSource === "qr" ? (
                                    // QR scan — confirmed source
                                    <span style={{ padding: "1px 5px", borderRadius: 3, fontSize: 9, fontWeight: 700, background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)", letterSpacing: 0.5 }}>QR</span>
                                  ) : scan.nfcId ? (
                                    // NFC scan with known chip ID
                                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                      <span style={{ padding: "1px 5px", borderRadius: 3, fontSize: 9, fontWeight: 700, background: "rgba(0,200,160,0.12)", color: "#7dd3fc", border: "1px solid rgba(0,200,160,0.25)", letterSpacing: 0.5 }}>NFC</span>
                                      <button
                                        onClick={() => { setScanNfcFilter(scan.nfcId); fetchScans({ nfcId: scan.nfcId, page: 1 }); }}
                                        style={{ background: "none", border: "none", color: "#a78bfa", cursor: "pointer", fontSize: 10, fontFamily: "var(--font-mono)", padding: 0, textDecoration: "underline" }}
                                      >{scan.nfcId}</button>
                                    </div>
                                  ) : (
                                    // Unknown source — just dash
                                    <span style={{ color: "#3d4250" }}>—</span>
                                  )}
                                </td>
                                <td style={{ padding: "6px 8px", color: "#94A3B8" }}>
                                  <span style={{
                                    padding: "2px 6px", borderRadius: 3, fontSize: 10, fontWeight: 600,
                                    background: scan.deviceType === "iOS" ? "rgba(96,165,250,0.1)" : scan.deviceType === "Android" ? "rgba(16,185,129,0.1)" : "rgba(139,149,168,0.1)",
                                    color: scan.deviceType === "iOS" ? "#60a5fa" : scan.deviceType === "Android" ? "#10b981" : "#94A3B8",
                                  }}>
                                    {scan.deviceType}
                                  </span>
                                </td>
                                <td style={{ padding: "6px 8px", color: "#94A3B8" }}>
                                  {scan.country ? `${getCountryFlag(scan.country)} ${scan.country}` : "—"}
                                </td>
                                <td style={{ padding: "6px 8px", color: "#94A3B8" }}>{scan.city || "—"}</td>
                                <td style={{ padding: "6px 8px", color: "#64748B", fontSize: 10 }}>{scan.browserLang || "—"}</td>
                                <td style={{ padding: "6px 8px" }}>
                                  {scan.isReturning ? (
                                    <span style={{ color: "#f59e0b", fontSize: 10, fontWeight: 600 }}>Tak</span>
                                  ) : (
                                    <span style={{ color: "#3d4250", fontSize: 10 }}>Nie</span>
                                  )}
                                </td>
                                <td style={{ padding: "6px 8px" }}>
                                  {scan.ipHash ? (
                                    <button
                                      onClick={async () => {
                                        setGuestModal({ ipHash: scan.ipHash!, guestKey: scan.guestKey ?? scan.ipHash!.slice(0, 7) });
                                        setGuestScans([]);
                                        setGuestLoading(true);
                                        try {
                                          const res = await fetch(`/api/scans/guest?ipHash=${encodeURIComponent(scan.ipHash!)}`);
                                          const data = await res.json();
                                          setGuestScans(data.rows ?? []);
                                        } catch { /* ignore */ }
                                        finally { setGuestLoading(false); }
                                      }}
                                      style={{
                                        background: "rgba(99,102,241,0.12)",
                                        border: "1px solid rgba(99,102,241,0.3)",
                                        color: "#818cf8",
                                        borderRadius: 4,
                                        padding: "2px 7px",
                                        fontSize: 10,
                                        fontFamily: "var(--font-mono)",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        letterSpacing: 0.5,
                                        transition: "background 0.15s",
                                      }}
                                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.25)")}
                                      onMouseLeave={e => (e.currentTarget.style.background = "rgba(99,102,241,0.12)")}
                                      title="Kliknij aby zobaczyc wszystkie skany tej osoby"
                                    >
                                      #{scan.guestKey ?? scan.ipHash!.slice(0, 7)}
                                    </button>
                                  ) : (
                                    <span style={{ color: "#3d4250" }}>—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(148,163,184,0.08)" }}>
                        <span style={{ fontSize: 11, color: "#64748B" }}>
                          {scanData.total} skanów • strona {scanData.page}/{scanData.totalPages}
                        </span>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            disabled={scanData.page <= 1}
                            onClick={() => { const p = scanData.page - 1; setScanPage(p); fetchScans({ page: p }); setTimeout(() => scanTableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); }}
                            style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: scanData.page <= 1 ? "#3d4250" : "#94A3B8", borderRadius: 6, padding: "5px 12px", fontSize: 11, cursor: scanData.page <= 1 ? "default" : "pointer" }}
                          >
                            ← Poprz.
                          </button>
                          <button
                            disabled={scanData.page >= scanData.totalPages}
                            onClick={() => { const p = scanData.page + 1; setScanPage(p); fetchScans({ page: p }); setTimeout(() => scanTableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); }}
                            style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: scanData.page >= scanData.totalPages ? "#3d4250" : "#94A3B8", borderRadius: 6, padding: "5px 12px", fontSize: 11, cursor: scanData.page >= scanData.totalPages ? "default" : "pointer" }}
                          >
                            Nast. →
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </section>

            {/* ========================================================== */}
            {/*  4c. TOP GOŚCIE                                            */}
            {/* ========================================================== */}
            <section className="card" style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showGuestsTable ? 16 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h3 style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Top Gości</h3>
                  {guestsTotal > 0 && (
                    <span style={{ fontSize: 11, color: "#64748B" }}>{guestsTotal} unikalnych</span>
                  )}
                </div>
                <button
                  onClick={async () => {
                    const next = !showGuestsTable;
                    setShowGuestsTable(next);
                    if (next) {
                      setGuestsLoading(true);
                      try {
                        const params = new URLSearchParams();
                        if (selectedTagIds.length > 0) {
                          params.set("tags", selectedTagIds.join(","));
                        } else if (tagFilter) {
                          params.set("tagId", tagFilter);
                        }
                        if (selectedCampaignId) params.set("campaignId", selectedCampaignId);
                        if (selectedClientId) params.set("clientId", selectedClientId);
                        if (dateFrom) params.set("from", timeFrom ? `${dateFrom}T${timeFrom}` : dateFrom);
                        if (dateTo) params.set("to", timeTo ? `${dateTo}T${timeTo}` : dateTo);
                        const res = await fetch(`/api/scans/guests?${params.toString()}`);
                        const data = await res.json();
                        setGuestsData(data.guests ?? []);
                        setGuestsTotal(data.total ?? 0);
                      } catch { /* ignore */ }
                      finally { setGuestsLoading(false); }
                    }
                  }}
                  style={{
                    background: showGuestsTable ? "rgba(0,200,160,0.12)" : "#243052",
                    border: `1px solid ${showGuestsTable ? "rgba(0,200,160,0.3)" : "rgba(148,163,184,0.15)"}`,
                    color: showGuestsTable ? "#7dd3fc" : "#94A3B8",
                    borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600,
                  }}
                >
                  {showGuestsTable ? "Ukryj" : "Pokaż"}
                </button>
              </div>

              {showGuestsTable && (
                <>
                  {guestsLoading && <p style={{ fontSize: 12, color: "#64748B", padding: "20px 0", textAlign: "center" }}>Ładowanie...</p>}
                  {!guestsLoading && guestsData.length === 0 && (
                    <p style={{ fontSize: 12, color: "#64748B", padding: "20px 0", textAlign: "center" }}>Brak danych</p>
                  )}
                  {!guestsLoading && guestsData.length > 0 && (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                        <thead>
                          <tr style={{ borderBottom: "2px solid rgba(148,163,184,0.15)" }}>
                            {["#", "Gość", "Skanów", "Akcji", "Źródło", "Urządzenie", "Miasto", "Ostatni skan"].map(h => (
                              <th key={h} style={{ textAlign: "left", padding: "8px 8px", color: "#94A3B8", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {guestsData.map((g) => (
                            <tr key={g.ipHash}
                              style={{ borderBottom: "1px solid #1C2541", transition: "background 0.15s" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "#151D35")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                            >
                              <td style={{ padding: "6px 8px", color: "#64748B", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{g.rank}</td>
                              <td style={{ padding: "6px 8px" }}>
                                <button
                                  onClick={async () => {
                                    setGuestModal({ ipHash: g.ipHash, guestKey: g.guestKey });
                                    setGuestScans([]);
                                    setGuestLoading(true);
                                    try {
                                      const res = await fetch(`/api/scans/guest?ipHash=${encodeURIComponent(g.ipHash)}`);
                                      const data = await res.json();
                                      setGuestScans(data.rows ?? []);
                                    } catch { /* ignore */ }
                                    finally { setGuestLoading(false); }
                                  }}
                                  style={{
                                    background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)",
                                    color: "#818cf8", borderRadius: 4, padding: "2px 7px",
                                    fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 700,
                                    cursor: "pointer", letterSpacing: 0.5, transition: "background 0.15s",
                                  }}
                                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.25)")}
                                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(99,102,241,0.12)")}
                                >
                                  #{g.guestKey}
                                </button>
                              </td>
                              <td style={{ padding: "6px 8px", color: "#F1F5F9", fontWeight: 600 }}>{g.scanCount}</td>
                              <td style={{ padding: "6px 8px", color: "#10b981", fontWeight: 600 }}>{g.uniqueActions}</td>
                              <td style={{ padding: "6px 8px" }}>
                                {g.source === "qr" ? (
                                  <span style={{ padding: "1px 5px", borderRadius: 3, fontSize: 9, fontWeight: 700, background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>QR</span>
                                ) : g.source === "nfc" ? (
                                  <span style={{ padding: "1px 5px", borderRadius: 3, fontSize: 9, fontWeight: 700, background: "rgba(0,200,160,0.12)", color: "#7dd3fc", border: "1px solid rgba(0,200,160,0.25)" }}>NFC</span>
                                ) : g.source === "mixed" ? (
                                  <span style={{ padding: "1px 5px", borderRadius: 3, fontSize: 9, fontWeight: 700, background: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.25)" }}>QR+NFC</span>
                                ) : <span style={{ color: "#3d4250" }}>—</span>}
                              </td>
                              <td style={{ padding: "6px 8px" }}>
                                <span style={{
                                  padding: "2px 6px", borderRadius: 3, fontSize: 10, fontWeight: 600,
                                  background: g.deviceType === "iOS" ? "rgba(96,165,250,0.1)" : g.deviceType === "Android" ? "rgba(16,185,129,0.1)" : "rgba(139,149,168,0.1)",
                                  color: g.deviceType === "iOS" ? "#60a5fa" : g.deviceType === "Android" ? "#10b981" : "#94A3B8",
                                }}>
                                  {g.deviceType}
                                </span>
                              </td>
                              <td style={{ padding: "6px 8px", color: "#94A3B8" }}>{g.city || "—"}</td>
                              <td style={{ padding: "6px 8px", color: "#64748B", fontFamily: "var(--font-mono)", fontSize: 10 }}>
                                {new Date(g.lastSeen).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* ========================================================== */}
            {/*  5. TAG MANAGEMENT                                         */}
            {/* ========================================================== */}

            <section style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 700 }}>
                    <span style={{ color: "#F1F5F9" }}>Akcje</span>
                  </h2>
                  <span
                    style={{
                      background: "transparent",
                      color: "#94A3B8",
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 20,
                    }}
                  >
                    {displayTags.length}
                  </span>
                </div>
                {/* View mode toggle + Global reset stats */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {/* Cards / Table toggle */}
                  <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(148,163,184,0.08)" }}>
                    {(["cards", "table"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        title={mode === "cards" ? "Widok kart" : "Widok tabeli"}
                        style={{
                          padding: "6px 12px",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          background: viewMode === mode ? "rgba(148,163,184,0.15)" : "transparent",
                          color: viewMode === mode ? "#F1F5F9" : "#64748B",
                          transition: "background 0.15s, color 0.15s",
                        }}
                      >
                        {mode === "cards" ? (
                          <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                            </svg>
                            Karty
                          </>
                        ) : (
                          <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                            Tabela
                          </>
                        )}
                      </button>
                    ))}
                  </div>

                  <div style={{ width: 1, height: 24, background: "rgba(148,163,184,0.15)" }} />
                  {resetAllConfirm ? (
                    <>
                      <span style={{ fontSize: 12, color: "#f87171", fontWeight: 600 }}>Na pewno usunac WSZYSTKIE statystyki?</span>
                      <button
                        onClick={() => handleResetStats()}
                        disabled={resetting}
                        style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontWeight: 700 }}
                      >
                        {resetting ? "Usuwanie..." : "TAK, usun wszystko"}
                      </button>
                      <button
                        onClick={() => setResetAllConfirm(false)}
                        style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: "#94A3B8", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}
                      >
                        Anuluj
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setResetAllConfirm(true)}
                      style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.08)", color: "#94A3B8", borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "border-color 0.2s, color 0.2s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#f87171"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(148,163,184,0.15)"; e.currentTarget.style.color = "#a0a0c0"; }}
                    >
                      Reset wszystkich statystyk
                    </button>
                  )}
                </div>
              </div>

              {/* ---- "+ Nowa akcja" button — navigates to full page ---- */}
              {isAdmin && <div style={{ marginBottom: 20 }}>
                <button
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (selectedClientId) params.set("clientId", selectedClientId);
                    if (selectedCampaignId) params.set("campaignId", selectedCampaignId);
                    const qs = params.toString();
                    router.push(`/dashboard/tags/new${qs ? `?${qs}` : ""}`);
                  }}
                  style={{
                    background: "#38BDF8",
                    border: "none",
                    color: "#0B0F1A",
                    borderRadius: 10,
                    padding: "10px 22px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 2px 12px rgba(0,200,160,0.25)",
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Nowa akcja
                </button>
              </div>}
              {/* ---- Nowa akcja DRAWER: the actual form JSX is rendered in the fixed overlay below the main layout ---- */}

              {/* ---- Tags List ---- */}

              {/* empty state */}
              {displayTags.length === 0 && (
                <div className="card" style={{ textAlign: "center", padding: "40px 24px" }}>
                  <p style={{ color: "#64748B", fontSize: 14 }}>
                    {selectedClientId ? "Brak akcji dla wybranego filtra." : "Brak akcji. Kliknij \"+ Nowa akcja\" aby dodac pierwsza akcje."}
                  </p>
                </div>
              )}

              {/* TABLE view */}
              {viewMode === "table" && displayTags.length > 0 && (
                <div className="card" style={{ padding: "4px 0" }}>
                  <ActionsTable
                    tags={displayTags}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    menuRef={menuRef}
                    uploadingTagId={uploadingTagId}
                    uploadProgress={uploadProgress}
                    onToggleActive={handleToggleActive}
                    onStartEdit={(tag) => router.push(`/dashboard/tags/${tag.id}/edit`)}
                    onDeleteTag={handleDeleteTag}
                    onResetStats={handleResetStats}
                    onVideoUpload={handleVideoUpload}
                    onRemoveVideo={handleRemoveVideo}
                    onSetResetTagConfirm={setResetTagConfirm}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    onBulkDelete={handleBulkDelete}
                    onBulkClone={handleBulkClone}
                    onBulkMoveRequest={() => setShowBulkMoveModal(true)}
                    bulkLoading={bulkLoading}
                    bulkMsg={bulkMsg}
                    readOnly={!isAdmin}
                    onCopySuccess={() => {
                      if (copyToastTimer.current) clearTimeout(copyToastTimer.current);
                      setCopyToast(true);
                      copyToastTimer.current = setTimeout(() => setCopyToast(false), 2000);
                    }}
                  />
                </div>
              )}

              {/* CARDS view */}
              <div style={{ display: viewMode === "cards" ? "flex" : "none", flexDirection: "column", gap: 12 }}>
                {/* placeholder so the empty state above handles it */}

                {displayTags.map((tag) => (
                  <div key={tag.id} className="card card-hover" style={{ padding: "16px 20px" }}>
                    <div>
                        {/* Top row: name + badges + actions */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 12,
                            marginBottom: 8,
                          }}
                        >
                          {/* Left: name + badges */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                              {tag.name}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                padding: "2px 8px",
                                borderRadius: 4,
                                background: tag.isActive ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                                color: tag.isActive ? "#10b981" : "#f87171",
                              }}
                            >
                              {tag.isActive ? "Aktywny" : "Nieaktywny"}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                padding: "2px 8px",
                                borderRadius: 4,
                                background: getTagTypeColor(tag.tagType).bg,
                                color: getTagTypeColor(tag.tagType).color,
                              }}
                            >
                              {getTagTypeLabel(tag.tagType)}
                            </span>
                            {tag.videoFile && (
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                  background: "rgba(16,185,129,0.15)",
                                  color: "#10b981",
                                }}
                              >
                                Video wgrane
                              </span>
                            )}
                            {tag.client && (
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                  background: tag.client.color ? `${tag.client.color}22` : "rgba(160,160,192,0.12)",
                                  color: tag.client.color || "#a0a0c0",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                {tag.client.color && (
                                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: tag.client.color, flexShrink: 0 }} />
                                )}
                                {tag.client.name}
                              </span>
                            )}
                            {tag.campaign && (
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                  background: "rgba(96,165,250,0.12)",
                                  color: "#60a5fa",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                                </svg>
                                {tag.campaign.name}
                              </span>
                            )}
                          </div>

                          {/* Right: actions */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {/* Active toggle — admin only */}
                            {isAdmin && (
                            <button
                              onClick={() => handleToggleActive(tag)}
                              title={tag.isActive ? "Dezaktywuj" : "Aktywuj"}
                              style={{
                                width: 44,
                                height: 24,
                                borderRadius: 8,
                                background: tag.isActive ? "#10b981" : "#3d4250",
                                border: "none",
                                cursor: "pointer",
                                position: "relative",
                                transition: "background 0.2s",
                                flexShrink: 0,
                              }}
                            >
                              <span
                                style={{
                                  position: "absolute",
                                  top: 3,
                                  left: tag.isActive ? 23 : 3,
                                  width: 18,
                                  height: 18,
                                  borderRadius: "50%",
                                  background: "#fff",
                                  transition: "left 0.2s",
                                }}
                              />
                            </button>
                            )}

                            {/* Quick: Kopiuj link publiczny */}
                            <button
                              onClick={e => { e.stopPropagation(); handleCopyLink(tag.id); }}
                              title="Kopiuj link publiczny"
                              style={{
                                background: "transparent",
                                border: "1px solid rgba(148,163,184,0.08)",
                                color: copiedCardId === tag.id ? "#22c55e" : "#94A3B8",
                                borderRadius: 6,
                                width: 28,
                                height: 28,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                transition: "color 0.15s, border-color 0.15s",
                              }}
                              onMouseEnter={e => { if (copiedCardId !== tag.id) { e.currentTarget.style.color = "#7dd3fc"; e.currentTarget.style.borderColor = "#38BDF8"; } }}
                              onMouseLeave={e => { if (copiedCardId !== tag.id) { e.currentTarget.style.color = "#94A3B8"; e.currentTarget.style.borderColor = "rgba(148,163,184,0.15)"; } }}
                            >
                              {copiedCardId === tag.id
                                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                              }
                            </button>

                            {/* Quick: Edytuj / Podglad */}
                            <button
                              onClick={e => { e.stopPropagation(); router.push(`/dashboard/tags/${tag.id}/edit`); }}
                              title={isAdmin ? "Edytuj akcje" : "Podglad"}
                              style={{
                                background: "transparent",
                                border: "1px solid rgba(148,163,184,0.08)",
                                color: "#94A3B8",
                                borderRadius: 6,
                                width: 28,
                                height: 28,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                transition: "color 0.15s, border-color 0.15s",
                              }}
                              onMouseEnter={e => { e.currentTarget.style.color = "#F1F5F9"; e.currentTarget.style.borderColor = "#38BDF8"; }}
                              onMouseLeave={e => { e.currentTarget.style.color = "#94A3B8"; e.currentTarget.style.borderColor = "rgba(148,163,184,0.15)"; }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>

                            {/* ⋯ menu — admin only */}
                            {isAdmin && (
                            <div style={{ position: "relative" }}>
                              <button
                                onClick={(e) => openCardMenu(tag.id, e)}
                                title="Więcej opcji"
                                style={{
                                  background: "transparent",
                                  border: "1px solid rgba(148,163,184,0.08)",
                                  color: "#94A3B8",
                                  borderRadius: 6,
                                  width: 32,
                                  height: 32,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 18,
                                  lineHeight: 1,
                                  letterSpacing: "0.05em",
                                  flexShrink: 0,
                                  transition: "border-color 0.15s, color 0.15s",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#38BDF8"; e.currentTarget.style.color = "#F1F5F9"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(148,163,184,0.15)"; e.currentTarget.style.color = "#94A3B8"; }}
                              >
                                ⋯
                              </button>

                              {openMenuId === tag.id && menuRect && (
                                <CtxMenuPortal anchorRect={menuRect} onClose={closeCardMenu}>

                                  {/* Pobierz QR PNG */}
                                  <button
                                    onClick={async () => {
                                      closeCardMenu();
                                      const res = await fetch(`/api/qr?tagId=${encodeURIComponent(tag.id)}&format=png`);
                                      if (!res.ok) return;
                                      const blob = await res.blob();
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement("a");
                                      a.href = url; a.download = `qr-${tag.id}.png`; a.click();
                                      URL.revokeObjectURL(url);
                                    }}
                                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "transparent", border: "none", color: "#10b981", fontSize: 13, cursor: "pointer", textAlign: "left" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "#243052"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                                      <path d="M14 14h3v3m0 4h4v-4m-4 0h4" />
                                    </svg>
                                    Pobierz QR (PNG)
                                  </button>

                                  {/* Pobierz SVG */}
                                  <button
                                    onClick={async () => {
                                      closeCardMenu();
                                      const res = await fetch(`/api/qr?tagId=${encodeURIComponent(tag.id)}&format=svg`);
                                      if (!res.ok) return;
                                      const blob = await res.blob();
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement("a");
                                      a.href = url; a.download = `qr-${tag.id}.svg`; a.click();
                                      URL.revokeObjectURL(url);
                                    }}
                                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "transparent", border: "none", color: "#10b981", fontSize: 13, cursor: "pointer", textAlign: "left" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "#243052"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                                    </svg>
                                    Pobierz SVG
                                  </button>

                                  {/* Pobierz PDF */}
                                  <button
                                    onClick={() => { closeCardMenu(); window.open(`/api/qr?tagId=${encodeURIComponent(tag.id)}&format=pdf`, "_blank"); }}
                                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "transparent", border: "none", color: "#7dd3fc", fontSize: 13, cursor: "pointer", textAlign: "left" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "#243052"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                                    </svg>
                                    Pobierz PDF (druk A4)
                                  </button>

                                  {/* Video items */}
                                  {tag.tagType === "video" && (
                                    <>
                                      <div style={{ height: 1, background: "rgba(148,163,184,0.15)", margin: "0 10px" }} />
                                      <label
                                        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "transparent", color: "#9f67ff", fontSize: 13, cursor: "pointer" }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = "#243052"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                      >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                          <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                        </svg>
                                        {uploadingTagId === tag.id ? uploadProgress : (tag.videoFile ? "Podmień video" : "Wgraj video")}
                                        <input type="file" accept="video/mp4,video/webm,video/quicktime" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) { closeCardMenu(); handleVideoUpload(tag.id, f); } e.target.value = ""; }} />
                                      </label>
                                      {tag.videoFile && (
                                        <button
                                          onClick={() => { closeCardMenu(); handleRemoveVideo(tag.id); }}
                                          style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "transparent", border: "none", color: "#f87171", fontSize: 13, cursor: "pointer", textAlign: "left" }}
                                          onMouseEnter={(e) => { e.currentTarget.style.background = "#243052"; }}
                                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                        >
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                                          </svg>
                                          Usuń video
                                        </button>
                                      )}
                                    </>
                                  )}

                                  <div style={{ height: 1, background: "rgba(148,163,184,0.15)", margin: "0 10px" }} />

                                  {/* Reset statystyk */}
                                  <button
                                    onClick={() => { closeCardMenu(); router.push(`/dashboard/tags/${tag.id}/edit`); }}
                                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "transparent", border: "none", color: "#f59e0b", fontSize: 13, cursor: "pointer", textAlign: "left" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(245,158,11,0.08)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                                    </svg>
                                    Reset statystyk
                                  </button>

                                  {/* Usuń akcję */}
                                  <button
                                    onClick={() => { closeCardMenu(); handleDeleteTag(tag.id); }}
                                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "transparent", border: "none", color: "#f87171", fontSize: 13, cursor: "pointer", textAlign: "left" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                                    </svg>
                                    Usuń akcję
                                  </button>
                                </CtxMenuPortal>
                              )}
                            </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom row: details */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 12, color: "#94A3B8", alignItems: "center" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <span style={{ color: "#64748B" }}>ID:</span>{" "}
                            <span style={{ fontFamily: "var(--font-mono)", color: "#7dd3fc" }}>{tag.id}</span>
                          </span>
                          <span>
                            <span style={{ color: "#64748B" }}>Skany:</span>{" "}
                            <span style={{ fontWeight: 600, color: "#F1F5F9" }}>{tag._count.scans}</span>
                          </span>
                          {/* Public link chip — click to copy */}
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <button
                              onClick={e => { e.stopPropagation(); handleCopyLink(tag.id); }}
                              title="Kliknij, aby skopiować link publiczny"
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 5,
                                background: "rgba(0,200,160,0.1)", border: "1px solid rgba(0,200,160,0.25)",
                                borderRadius: 6, padding: "3px 8px 3px 7px",
                                cursor: "pointer", transition: "background 0.15s, border-color 0.15s",
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,200,160,0.18)"; e.currentTarget.style.borderColor = "rgba(0,200,160,0.45)"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,200,160,0.1)"; e.currentTarget.style.borderColor = "rgba(0,200,160,0.25)"; }}
                            >
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#7dd3fc" }}>/s/{tag.id}</span>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                              </svg>
                            </button>
                            <a
                              href={`/s/${tag.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              title="Otwórz link publiczny"
                              style={{ color: "#64748B", display: "inline-flex", alignItems: "center", transition: "color 0.15s" }}
                              onMouseEnter={e => e.currentTarget.style.color = "#94A3B8"}
                              onMouseLeave={e => e.currentTarget.style.color = "#64748B"}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                              </svg>
                            </a>
                          </span>
                          {tag.videoFile && (
                            <span>
                              <span style={{ color: "#64748B" }}>Video:</span>{" "}
                              <a
                                href={tag.videoFile.replace(/^\/uploads\//, "/api/video/")}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "#10b981", fontSize: 11, textDecoration: "underline", cursor: "pointer" }}
                              >
                                {tag.videoFile.split("/").pop()}
                              </a>
                            </span>
                          )}
                        </div>
                        {tag.description && (
                          <p style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
                            {tag.description}
                          </p>
                        )}

                        {/* Link click stats for multilink campaigns */}
                        {tag.tagType === "multilink" && (
                          <div style={{ marginTop: 8 }}>
                            <button
                              onClick={() => toggleLinkStats(tag.id)}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "#60a5fa",
                                fontSize: 12,
                                cursor: "pointer",
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                fontWeight: 500,
                              }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                                style={{ transform: expandedLinkStats === tag.id ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}
                              >
                                <path d="M9 5l7 7-7 7" />
                              </svg>
                              Statystyki klikniec ({linkClickStats[tag.id]?.total ?? "..."})
                            </button>
                            {expandedLinkStats === tag.id && linkClickStats[tag.id] && (
                              <div style={{
                                marginTop: 8,
                                padding: 12,
                                background: "#14171e",
                                borderRadius: 8,
                                border: "1px solid rgba(148,163,184,0.08)",
                              }}>
                                {linkClickStats[tag.id].links.length === 0 ? (
                                  <p style={{ fontSize: 12, color: "#64748B" }}>Brak klikniec</p>
                                ) : (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {linkClickStats[tag.id].links.map((lc, idx) => (
                                      <div key={idx} style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "6px 0",
                                        borderBottom: idx < linkClickStats[tag.id].links.length - 1 ? "1px solid #243052" : "none",
                                      }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                                          <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {lc.linkLabel || lc.linkUrl}
                                          </span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                          <div style={{ width: 60, height: 4, background: "transparent", borderRadius: 2, overflow: "hidden" }}>
                                            <div style={{ width: `${lc.percent}%`, height: "100%", background: "#38BDF8", borderRadius: 2 }} />
                                          </div>
                                          <span style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9", minWidth: 24, textAlign: "right" }}>{lc.clicks}</span>
                                          <span style={{ fontSize: 10, color: "#64748B", minWidth: 28, textAlign: "right" }}>{lc.percent}%</span>
                                        </div>
                                      </div>
                                    ))}
                                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 4, paddingTop: 6, borderTop: "1px solid #243052" }}>
                                      Razem: {linkClickStats[tag.id].total} klikniec
                                    </div>
                                  </div>
                                )}
                                <button
                                  onClick={() => fetchLinkClicks(tag.id)}
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "#60a5fa",
                                    fontSize: 11,
                                    cursor: "pointer",
                                    padding: "4px 0 0 0",
                                    textDecoration: "underline",
                                  }}
                                >
                                  Odswiez
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Video stats for video campaigns */}
                        {tag.tagType === "video" && (
                          <div style={{ marginTop: 8 }}>
                            <button
                              onClick={() => toggleVideoStats(tag.id)}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "#10b981",
                                fontSize: 12,
                                cursor: "pointer",
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                fontWeight: 500,
                              }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                                style={{ transform: expandedVideoStats === tag.id ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}
                              >
                                <path d="M9 5l7 7-7 7" />
                              </svg>
                              Statystyki video ({videoStats[tag.id]?.plays ?? "..."} odtworzen)
                            </button>
                            {expandedVideoStats === tag.id && videoStats[tag.id] && (
                              <div style={{
                                marginTop: 8,
                                padding: 12,
                                background: "#14171e",
                                borderRadius: 8,
                                border: "1px solid rgba(148,163,184,0.08)",
                              }}>
                                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ fontSize: 18, fontWeight: 700, color: "#10b981" }}>{videoStats[tag.id].plays}</span>
                                    <span style={{ fontSize: 11, color: "#94A3B8" }}>odtworzen</span>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ fontSize: 18, fontWeight: 700, color: "#60a5fa" }}>{videoStats[tag.id].completions}</span>
                                    <span style={{ fontSize: 11, color: "#94A3B8" }}>do konca</span>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ fontSize: 18, fontWeight: 700, color: "#7dd3fc" }}>{formatWatchTime(videoStats[tag.id].avgWatchTime)}</span>
                                    <span style={{ fontSize: 11, color: "#94A3B8" }}>sred. czas</span>
                                  </div>
                                  {videoStats[tag.id].plays > 0 && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <span style={{ fontSize: 18, fontWeight: 700, color: "#f59e0b" }}>
                                        {Math.round((videoStats[tag.id].completions / videoStats[tag.id].plays) * 100)}%
                                      </span>
                                      <span style={{ fontSize: 11, color: "#94A3B8" }}>completion rate</span>
                                    </div>
                                  )}
                                </div>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                  <button
                                    onClick={() => {
                                      setTagFilter(tag.id);
                                    }}
                                    style={{
                                      background: "rgba(16,185,129,0.12)",
                                      border: "1px solid rgba(16,185,129,0.25)",
                                      color: "#10b981",
                                      fontSize: 11,
                                      cursor: "pointer",
                                      padding: "4px 12px",
                                      borderRadius: 6,
                                      fontWeight: 600,
                                    }}
                                  >
                                    Zobacz pelny wykres retencji
                                  </button>
                                  <button
                                    onClick={() => fetchVideoStats(tag.id)}
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      color: "#10b981",
                                      fontSize: 11,
                                      cursor: "pointer",
                                      padding: "4px 0",
                                      textDecoration: "underline",
                                    }}
                                  >
                                    Odswiez
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
          </div>{/* end right content column */}
        </div>{/* end sidebar+content flex */}
      </main>

      {/* New Tag Drawer — REPLACED with full-page editor at /dashboard/tags/new */}

      {/* ============================================================ */}
      {/*  CHANGE PASSWORD MODAL                                       */}
      {/* ============================================================ */}

      {showPasswordModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 420,
              margin: "0 16px",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                borderRadius: "12px 12px 0 0",
                background: "#38BDF8",
              }}
            />
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: "#F1F5F9" }}>
              Zmiana hasla
            </h2>
            <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 20 }}>
              Ze wzgledow bezpieczenstwa musisz ustawic nowe haslo przy pierwszym logowaniu.
            </p>

            <form onSubmit={handlePasswordChange}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, color: "#94A3B8", marginBottom: 4, fontWeight: 500 }}>
                  Nowe haslo
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 znakow"
                  autoFocus
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 12, color: "#94A3B8", marginBottom: 4, fontWeight: 500 }}>
                  Powtorz haslo
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Powtorz nowe haslo"
                />
              </div>

              {passwordError && (
                <div
                  style={{
                    marginBottom: 14,
                    padding: "10px 14px",
                    borderRadius: 8,
                    fontSize: 13,
                    background: "rgba(239,68,68,0.1)",
                    color: "#f87171",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  {passwordError}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={passwordSaving}
                style={{ width: "100%", padding: "12px 0", fontSize: 14 }}
              >
                {passwordSaving ? "Zapisywanie..." : "Ustaw nowe haslo"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  BULK MOVE MODAL                                            */}
      {/* ============================================================ */}
      {showBulkMoveModal && (
        <>
          <div
            onClick={() => { setShowBulkMoveModal(false); setBulkMsg(""); }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1100 }}
          />
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            background: "#14171e",
            border: "1px solid rgba(148,163,184,0.08)",
            borderRadius: 8,
            padding: "28px 32px",
            zIndex: 1101,
            minWidth: 360,
            maxWidth: "90vw",
            boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#F1F5F9", marginBottom: 6 }}>
              Przenieś {selectedIds.length} akcji
            </h3>
            <p style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>
              Wybierz kampanię docelową. Akcje zostaną przeniesione bez zmiany klienta.
            </p>
            <label style={{ display: "block", fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>
              Kampania docelowa
            </label>
            <select
              value={bulkMoveCampaignId}
              onChange={(e) => setBulkMoveCampaignId(e.target.value)}
              className="input-field"
              style={{ width: "100%", marginBottom: 20, padding: "8px 12px" }}
            >
              <option value="">(bez kampanii)</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {bulkMsg && (
              <p style={{ fontSize: 12, color: "#f87171", marginBottom: 12 }}>{bulkMsg}</p>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setShowBulkMoveModal(false); setBulkMsg(""); }}
                style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.08)", background: "transparent", color: "#94A3B8", fontSize: 13, cursor: "pointer" }}
              >
                Anuluj
              </button>
              <button
                onClick={handleBulkMove}
                disabled={bulkLoading}
                style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#38BDF8", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: bulkLoading ? 0.7 : 1 }}
              >
                {bulkLoading ? "Przenoszenie..." : "Przenieś"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit Action Drawer — REPLACED with full-page editor at /dashboard/tags/[id]/edit */}

      {/* ============================================================ */}
      {/*  COPY LINK TOAST                                             */}
      {/* ============================================================ */}
      <div
        style={{
          position: "fixed", bottom: 32, left: "50%", transform: `translateX(-50%) translateY(${copyToast ? 0 : 16}px)`,
          background: "#1a2d1a", border: "1px solid #22c55e", color: "#86efac",
          borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 8, zIndex: 99999,
          opacity: copyToast ? 1 : 0, pointerEvents: "none",
          transition: "opacity 0.2s ease, transform 0.2s ease",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          whiteSpace: "nowrap",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Skopiowano link
      </div>

      {/* ── GUEST MODAL ─────────────────────────────────────────── */}
      {guestModal && (
        <div
          onClick={() => setGuestModal(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 100000,
            background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(3px)",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#14171e",
              border: "1px solid rgba(148,163,184,0.08)",
              borderRadius: 8,
              width: "min(760px, 95vw)",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(148,163,184,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  background: "rgba(99,102,241,0.15)",
                  border: "1px solid rgba(99,102,241,0.35)",
                  color: "#818cf8",
                  borderRadius: 6,
                  padding: "3px 10px",
                  fontSize: 13,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  letterSpacing: 0.5,
                }}>
                  #{guestModal.guestKey}
                </span>
                <span style={{ color: "#94A3B8", fontSize: 12 }}>
                  {guestLoading ? "Ładowanie..." : `${guestScans.length} skan${guestScans.length === 1 ? "" : guestScans.length < 5 ? "y" : "ów"}`}
                </span>
              </div>
              <button
                onClick={() => setGuestModal(null)}
                style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#F1F5F9")}
                onMouseLeave={e => (e.currentTarget.style.color = "#64748B")}
              >×</button>
            </div>

            {/* Body */}
            <div style={{ overflowY: "auto", padding: "12px 20px 20px" }}>
              {guestLoading && (
                <p style={{ color: "#64748B", fontSize: 12, textAlign: "center", padding: "32px 0" }}>Ładowanie skanów...</p>
              )}
              {!guestLoading && guestScans.length === 0 && (
                <p style={{ color: "#64748B", fontSize: 12, textAlign: "center", padding: "32px 0" }}>Brak skanów</p>
              )}
              {!guestLoading && guestScans.length > 0 && (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid rgba(148,163,184,0.15)" }}>
                      {["#", "Data/Czas", "Akcja", "Źródło", "Urządzenie", "Miasto", "Ponowny"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "6px 8px", color: "#94A3B8", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {guestScans.map((s, idx) => (
                      <tr key={s.id}
                        style={{ borderBottom: "1px solid #1C2541", transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#151D35")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "5px 8px", color: "#64748B", fontFamily: "var(--font-mono)" }}>{idx + 1}</td>
                        <td style={{ padding: "5px 8px", color: "#F1F5F9", fontFamily: "var(--font-mono)", fontSize: 10, whiteSpace: "nowrap" }}>
                          {new Date(s.timestamp).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </td>
                        <td style={{ padding: "5px 8px" }}>
                          <span style={{ color: "#7dd3fc", fontWeight: 600 }}>{s.tagName}</span>
                        </td>
                        <td style={{ padding: "5px 8px" }}>
                          {s.eventSource === "qr" ? (
                            <span style={{ padding: "1px 5px", borderRadius: 3, fontSize: 9, fontWeight: 700, background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>QR</span>
                          ) : s.nfcId ? (
                            <span style={{ padding: "1px 5px", borderRadius: 3, fontSize: 9, fontWeight: 700, background: "rgba(0,200,160,0.12)", color: "#7dd3fc", border: "1px solid rgba(0,200,160,0.25)" }}>NFC</span>
                          ) : (
                            <span style={{ color: "#3d4250" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "5px 8px" }}>
                          <span style={{
                            padding: "2px 6px", borderRadius: 3, fontSize: 10, fontWeight: 600,
                            background: s.deviceType === "iOS" ? "rgba(96,165,250,0.1)" : s.deviceType === "Android" ? "rgba(16,185,129,0.1)" : "rgba(139,149,168,0.1)",
                            color: s.deviceType === "iOS" ? "#60a5fa" : s.deviceType === "Android" ? "#10b981" : "#94A3B8",
                          }}>
                            {s.deviceType}
                          </span>
                        </td>
                        <td style={{ padding: "5px 8px", color: "#94A3B8" }}>{s.city || "—"}</td>
                        <td style={{ padding: "5px 8px" }}>
                          {s.isReturning
                            ? <span style={{ color: "#f59e0b", fontSize: 10, fontWeight: 600 }}>Tak</span>
                            : <span style={{ color: "#3d4250", fontSize: 10 }}>Nie</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ── END GUEST MODAL ─────────────────────────────────────── */}

      {/* ── USERS PANEL ────────────────────────────────────────── */}
      <UsersPanel
        open={usersPanelOpen}
        onClose={() => setUsersPanelOpen(false)}
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
      />

    </div>
  );
}
