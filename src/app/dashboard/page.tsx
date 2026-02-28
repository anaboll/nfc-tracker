"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardFilterProvider, useDashboardFilters } from "@/contexts/DashboardFilterContext";
import { UsersPanel } from "@/components/users/UsersPanel";
import { useToast } from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ViewerDashboard from "@/components/dashboard/ViewerDashboard";
import PasswordModal from "@/components/dashboard/modals/PasswordModal";
import BulkMoveModal from "@/components/dashboard/modals/BulkMoveModal";
import GuestModal from "@/components/dashboard/modals/GuestModal";
import KpiStrip from "@/components/dashboard/KpiStrip";
import DevicesCard from "@/components/dashboard/cards/DevicesCard";
import TopTagsCard from "@/components/dashboard/cards/TopTagsCard";
import CountriesCard from "@/components/dashboard/cards/CountriesCard";
import CitiesCard from "@/components/dashboard/cards/CitiesCard";
import LanguagesCard from "@/components/dashboard/cards/LanguagesCard";
import VideoRetentionChart from "@/components/dashboard/charts/VideoRetentionChart";
import WeeklyChart from "@/components/dashboard/charts/WeeklyChart";
import HourlyChart from "@/components/dashboard/charts/HourlyChart";
import NfcChipsCard from "@/components/dashboard/cards/NfcChipsCard";
import ScanTable from "@/components/dashboard/ScanTable";
import GuestsTable from "@/components/dashboard/GuestsTable";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardFilterBar from "@/components/dashboard/DashboardFilterBar";
import type { ComparisonMode } from "@/components/dashboard/ComparisonToggle";
import TagManagement from "@/components/dashboard/TagManagement";
import { getComparisonPeriods } from "@/lib/periodComparison";
import type {
  Devices, TopTag, Language,
  NfcChip, HourlyData, StatsData,
  CampaignFull, ScanRow, ScansResponse,
  TagLink, LinkClickData, VideoStats,
  ClientFull, TagFull,
} from "@/types/dashboard";
import type { VCardData } from "@/types/vcard";
import {
  formatDate, formatWeekRange, formatWatchTime,
  buildHourlyData, buildHeatmapData, buildHeatmapUniqueData,
} from "@/lib/dashboardHelpers";


/* ------------------------------------------------------------------ */
/*  Skeleton loader                                                    */
/* ------------------------------------------------------------------ */

function DashboardSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* fake header */}
      <div style={{ height: 56, background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", padding: "0 24px", gap: 12 }}>
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

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid var(--border-hover)", borderTopColor: "var(--accent)", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "var(--txt-sec)" }}>Ladowanie...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }

  const isAdmin = session?.user?.role === "admin";

  /* Viewer (non-admin) gets simplified dashboard */
  if (session && !isAdmin) {
    return <ViewerDashboard session={session} />;
  }

  /* Admin — wrap in FilterProvider so children can use useDashboardFilters() */
  return (
    <DashboardFilterProvider>
      <DashboardAdmin session={session!} />
    </DashboardFilterProvider>
  );
}

/* ------------------------------------------------------------------ */
/*  Admin Dashboard                                                    */
/* ------------------------------------------------------------------ */

function DashboardAdmin({ session }: { session: NonNullable<ReturnType<typeof useSession>["data"]> }) {
  const router = useRouter();
  const toast = useToast();
  const isAdmin = session?.user?.role === "admin";

  /* ---- filter state (from context) ---- */
  const {
    dateFrom, setDateFrom, dateTo, setDateTo, timeFrom, setTimeFrom, timeTo, setTimeTo,
    weekOffset, setWeekOffset,
    selectedClientId, setSelectedClientId, selectedCampaignId, setSelectedCampaignId,
    tagFilter, setTagFilter, selectedTagIds, setSelectedTagIds, actionsMode, setActionsMode,
    scanSourceFilter, setScanSourceFilter, scanNfcFilter, setScanNfcFilter,
    scanPage, setScanPage, scanSortBy, setScanSortBy, scanSortDir, setScanSortDir,
    tagSearch, setTagSearch, campaignSearch, setCampaignSearch,
    showCampaignDropdown, setShowCampaignDropdown,
    campaignDropdownRef, campaignDropdownPortalRef, campaignDropdownPos, setCampaignDropdownPos,
    countriesPage, setCountriesPage, citiesPage, setCitiesPage, languagesPage, setLanguagesPage,
    sidebarOpen, setSidebarOpen,
    hourlyMode, setHourlyMode, hourlyDataMode, setHourlyDataMode,
    showScanTable, setShowScanTable, showGuestsTable, setShowGuestsTable,
    resetFilterState,
    filtersRestoredRef, scanTableRef,
  } = useDashboardFilters();

  /* ---- data state (NOT in filter context) ---- */
  const [stats, setStats] = useState<StatsData | null>(null);
  const [tags, setTags] = useState<TagFull[]>([]);
  const [clients, setClients] = useState<ClientFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // client management
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientDesc, setNewClientDesc] = useState("");
  const [newClientColor, setNewClientColor] = useState("#38BDF8");
  const [clientCreating, setClientCreating] = useState(false);

  // campaigns
  const [campaigns, setCampaigns] = useState<CampaignFull[]>([]);
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignDesc, setNewCampaignDesc] = useState("");
  const [campaignCreating, setCampaignCreating] = useState(false);

  // new-tag drawer
  const [showNewTagDrawer, setShowNewTagDrawer] = useState(false);
  const [drawerIsClosing, setDrawerIsClosing] = useState(false);

  // change-password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  // users panel
  const [usersPanelOpen, setUsersPanelOpen] = useState(false);

  // period comparison
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("off");
  const [previousStats, setPreviousStats] = useState<StatsData | null>(null);

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

  // raw scan table
  const [scanData, setScanData] = useState<ScansResponse | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  // Guest modal state
  const [guestModal, setGuestModal] = useState<{ ipHash: string; guestKey: string } | null>(null);
  const [guestScans, setGuestScans] = useState<ScanRow[]>([]);
  const [guestLoading, setGuestLoading] = useState(false);
  // Top Goście data
  const [guestsData, setGuestsData] = useState<{ rank: number; ipHash: string; guestKey: string; scanCount: number; uniqueActions: number; lastSeen: string; deviceType: string; city: string | null; country: string | null; source: string }[]>([]);
  const [guestsTotal, setGuestsTotal] = useState(0);
  const [guestsLoading, setGuestsLoading] = useState(false);

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

  // confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmLabel, setConfirmLabel] = useState("Potwierdź");
  const confirmAction = useRef<(() => void) | null>(null);

  const showConfirm = useCallback((title: string, message: string, action: () => void, label = "Usuń") => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmLabel(label);
    confirmAction.current = action;
    setConfirmOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    setConfirmOpen(false);
    confirmAction.current?.();
    confirmAction.current = null;
  }, []);

  const handleCancelConfirm = useCallback(() => {
    setConfirmOpen(false);
    confirmAction.current = null;
  }, []);

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
      // Comparison: for preset modes (day/week/month) override the main fetch dates too
      if (comparisonEnabled && comparisonMode !== "off" && comparisonMode !== "custom") {
        const periods = getComparisonPeriods(comparisonMode, effectiveFrom || null, effectiveTo || null);
        if (periods) {
          params.set("from", periods.current.from);
          params.set("to", periods.current.to);
        }
      }

      const fetchPromises: Promise<Response>[] = [fetch(`/api/stats?${params.toString()}`)];

      if (comparisonEnabled && comparisonMode !== "off") {
        const periods = getComparisonPeriods(comparisonMode, effectiveFrom || null, effectiveTo || null);
        if (periods) {
          const prevParams = new URLSearchParams(params);
          prevParams.set("from", periods.previous.from);
          prevParams.set("to", periods.previous.to);
          fetchPromises.push(fetch(`/api/stats?${prevParams.toString()}`));
        }
      }

      const [res, prevRes] = await Promise.all(fetchPromises);
      if (res.ok) {
        const data: StatsData = await res.json();
        setStats(data);
      } else {
        const errText = await res.text();
        setFetchError(`Stats API error ${res.status}: ${errText.substring(0, 200)}`);
        console.error("Stats API error:", res.status, errText);
      }
      if (prevRes?.ok) {
        setPreviousStats(await prevRes.json());
      } else {
        setPreviousStats(null);
      }
    } catch (e) {
      setFetchError(`Blad polaczenia: ${e}`);
      console.error("Stats fetch failed:", e);
    }
  }, [dateFrom, dateTo, timeFrom, timeTo, tagFilter, weekOffset, selectedClientId, selectedCampaignId, scanSourceFilter, selectedTagIds, comparisonEnabled, comparisonMode]);

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

  /* Filter restore + URL/localStorage sync are handled by DashboardFilterContext */

  /* ---- initial load (DashboardAdmin only renders when authenticated) ---- */

  useEffect(() => {
    loadAll();
    if (session?.user?.mustChangePass) {
      setShowPasswordModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- refresh campaigns when client changes ---- */
  const clientInitRef = useRef(false);
  useEffect(() => {
    if (!clientInitRef.current) { clientInitRef.current = true; return; }
    setSelectedCampaignId(null);
    setTagFilter("");
    setSelectedTagIds([]);
    setActionsMode("NA");
    setTagSearch("");
    fetchCampaigns();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId]);

  /* ---- refresh stats when campaign changes ---- */
  const campaignInitRef = useRef(false);
  useEffect(() => {
    if (!campaignInitRef.current) { campaignInitRef.current = true; return; }
    setTagFilter("");
    setSelectedTagIds([]);
    setTagSearch("");
    setActionsMode(selectedCampaignId ? "ALL" : "NA");
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampaignId]);

  /* viewMode persistence + popover/chips outside-click are in FilterContext */

  /* custom range popover + chips overflow outside-click are in FilterContext */
  /* context menu outside-click is in TagManagement */

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

  const handleDeleteClient = (id: string) => {
    showConfirm("Usunąć klienta?", "Tagi zostaną odpięte (nie usunięte).", async () => {
      try {
        await fetch(`/api/clients?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        if (selectedClientId === id) setSelectedClientId(null);
        await fetchClients();
        await fetchTags();
        await fetchCampaigns();
        toast.success("Klient usunięty");
      } catch { toast.error("Błąd usuwania klienta"); }
    });
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

  const handleDeleteCampaign = (id: string) => {
    showConfirm("Usunąć kampanię?", "Akcje zostaną odpięte (nie usunięte).", async () => {
      try {
        await fetch(`/api/campaigns?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        if (selectedCampaignId === id) setSelectedCampaignId(null);
        await fetchCampaigns();
        await fetchTags();
        toast.success("Kampania usunięta");
      } catch { toast.error("Błąd usuwania kampanii"); }
    });
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

  const handleResetFilters = async () => {
    resetFilterState();
    setLoading(true);
    try {
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
      toast.info(tag.isActive ? "Akcja dezaktywowana" : "Akcja aktywowana");
    } catch { toast.error("Błąd zmiany statusu"); }
  };

  const handleDeleteTag = (id: string) => {
    const tag = tags.find(t => t.id === id);
    showConfirm("Usunąć akcję?", `Akcja "${tag?.name || id}" i wszystkie jej skany zostaną trwale usunięte.`, async () => {
      try {
        await fetch(`/api/tags?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        setEditingAction(null);
        await fetchTags();
        await fetchStats();
        toast.success("Akcja usunięta");
      } catch { toast.error("Błąd usuwania akcji"); }
    });
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
      toast.success("Zapisano zmiany");
    } catch { toast.error("Błąd zapisywania"); }
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
  const handleRemoveVideo = (tagId: string) => {
    showConfirm("Usunąć video?", "Video zostanie trwale usunięte z tej akcji.", async () => {
      try {
        await fetch("/api/tags", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: tagId, videoFile: null }),
        });
        await fetchTags();
        toast.success("Video usunięte");
      } catch { toast.error("Błąd usuwania video"); }
    });
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

  const handleBulkDelete = () => {
    if (!selectedIds.length) return;
    showConfirm("Usunąć zaznaczone akcje?", `${selectedIds.length} akcji i wszystkie ich dane zostaną trwale usunięte.`, async () => {
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
        toast.success(`Usunięto ${selectedIds.length} akcji`);
      } catch { toast.error("Błąd usuwania"); }
      finally { setBulkLoading(false); }
    });
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


  /* Auth guard + viewer check are in DashboardPage above */

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
  const hourlyRaw = stats?.hourlyRaw ?? [];
  const hourly: HourlyData[] = buildHourlyData(hourlyRaw);
  const heatmapData: number[][] = buildHeatmapData(hourlyRaw);
  const heatmapMax = Math.max(...heatmapData.flat(), 1);
  const heatmapUniqueData: number[][] = buildHeatmapUniqueData(hourlyRaw);
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
    <div style={{ minHeight: "100vh", background: "var(--bg)", overflowX: "hidden" }}>
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

      <DashboardHeader
        isAdmin={isAdmin}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onOpenUsersPanel={() => setUsersPanelOpen(true)}
      />

      {/* ============================================================ */}
      {/*  MAIN CONTENT                                                */}
      {/* ============================================================ */}

      <main className="dash-main" style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 24px 64px", overflowX: "hidden" }}>
        {/* ================================================================ */}
        {/*  TWO-COLUMN LAYOUT: sidebar (260px) + scrollable content        */}
        {/* ================================================================ */}
        <style>{`
          /* Sidebar scrollbar — only appears when content overflows; thin and unobtrusive */
          .nfc-sidebar { scrollbar-width: thin; scrollbar-color: rgba(148,163,184,0.15) transparent; }
          .nfc-sidebar::-webkit-scrollbar { width: 4px; }
          .nfc-sidebar::-webkit-scrollbar-track { background: transparent; }
          .nfc-sidebar::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.15); border-radius: 4px; }
          .nfc-sidebar::-webkit-scrollbar-thumb:hover { background: #363b48; }
        `}</style>

        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="nfc-layout" style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

          <DashboardSidebar
            isAdmin={isAdmin}
            clients={clients}
            filteredCampaigns={filteredCampaigns}
            filteredTags={filteredTags}
            onCreateClient={handleCreateClient}
            onDeleteClient={handleDeleteClient}
            onCreateCampaign={handleCreateCampaign}
            onDeleteCampaign={handleDeleteCampaign}
            fetchStats={fetchStats}
            fetchScans={fetchScans}
            showAddClient={showAddClient} setShowAddClient={setShowAddClient}
            newClientName={newClientName} setNewClientName={setNewClientName}
            newClientDesc={newClientDesc} setNewClientDesc={setNewClientDesc}
            newClientColor={newClientColor} setNewClientColor={setNewClientColor}
            clientCreating={clientCreating}
            showAddCampaign={showAddCampaign} setShowAddCampaign={setShowAddCampaign}
            newCampaignName={newCampaignName} setNewCampaignName={setNewCampaignName}
            newCampaignDesc={newCampaignDesc} setNewCampaignDesc={setNewCampaignDesc}
            campaignCreating={campaignCreating}
          />

          {/* ============================================================ */}
          {/*  RIGHT CONTENT COLUMN                                        */}
          {/* ============================================================ */}
          <div style={{ flex: 1, minWidth: 0 }}>

            <DashboardFilterBar
              clients={clients}
              campaigns={campaigns}
              tags={tags}
              fetchStats={fetchStats}
              fetchScans={fetchScans}
              setLoading={setLoading}
              onResetFilters={handleResetFilters}
              comparisonEnabled={comparisonEnabled}
              comparisonMode={comparisonMode}
            />

        {/* ---- Error display ---- */}
        {fetchError && (
          <div style={{ margin: "20px 0", padding: "16px 20px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--error)", fontSize: 13, fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>
            {fetchError}
          </div>
        )}

        {/* ---- Loading skeleton ---- */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* KPI skeleton */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: 12 }}>
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
            {/*  1. KPI CARDS                                              */}
            {/* ========================================================== */}

            <KpiStrip kpi={kpi} formatDate={formatDate} previousKpi={previousStats?.kpi} showComparison={comparisonEnabled} />

            {/* 1b. VIDEO RETENTION CHART */}
            <VideoRetentionChart videoStats={selectedVideoRetention} formatWatchTime={formatWatchTime} />

            {/* ========================================================== */}
            {/*  2. DEVICES + TOP TAGS                                     */}
            {/* ========================================================== */}

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))",
                gap: 16,
                marginBottom: 24,
              }}
            >
              <DevicesCard devices={devices} />
              <TopTagsCard topTags={topTags} />
            </section>

            {/* ========================================================== */}
            {/*  3. COUNTRIES + CITIES                                     */}
            {/* ========================================================== */}

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))",
                gap: 16,
                marginBottom: 24,
              }}
            >
              <CountriesCard topCountries={topCountries} />
              <CitiesCard topCities={topCities} />
            </section>

            {/* 4. WEEKLY CHART + LANGUAGES */}
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))",
                gap: 16,
                marginBottom: 24,
              }}
            >
              <WeeklyChart
                weekly={weekly}
                maxWeeklyCount={maxWeeklyCount}
                weekOffset={weekOffset}
                onWeekChange={handleWeekChange}
                formatWeekRange={formatWeekRange}
              />
              <LanguagesCard topLanguages={topLanguages} />
            </section>

            {/* 4a. HOURLY DISTRIBUTION */}
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

            {/* 4b. NFC CHIPS */}
            <NfcChipsCard
              nfcChips={stats.nfcChips ?? []}
              onChipClick={(nfcId) => {
                setScanNfcFilter(nfcId);
                setShowScanTable(true);
                fetchScans({ nfcId, page: 1 });
                setTimeout(() => scanTableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
              }}
            />

            {/* ========================================================== */}
            {/*  4b2. QR SCANS SUMMARY (visible when source=qr or all)    */}
            {/* ========================================================== */}
            {(scanSourceFilter === "qr" || scanSourceFilter === "all") && topTags.length > 0 && (
              <section className="card" style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <h3 style={{ fontSize: 11, fontWeight: 600, color: "var(--txt-muted)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 2 }}>
                      <span style={{ marginRight: 8 }}>📱</span>Skanowania QR
                    </h3>
                    <p style={{ fontSize: 12, color: "var(--txt-muted)" }}>
                      {scanSourceFilter === "qr"
                        ? `Skany wyłącznie ze źródła QR — ${stats.kpi.totalScans} łącznie`
                        : "Statystyki akcji (wszystkie źródła). Filtruj QR aby zobaczyć tylko skany z kodów QR."}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {topTags.slice(0, 5).map((t, idx) => (
                    <div key={t.tagId} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 10, color: "var(--border-hover)", minWidth: 16, textAlign: "right" }}>{idx + 1}</span>
                      <button
                        onClick={() => setTagFilter(t.tagId)}
                        style={{ background: "none", border: "none", color: "var(--accent-light)", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: 0, textAlign: "left", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        title={t.tagId}
                      >{t.tagName}</button>
                      <span style={{ fontSize: 11, color: "var(--txt)", fontWeight: 700, minWidth: 32, textAlign: "right" }}>{t.count}</span>
                      <div style={{ width: 60, height: 4, background: "transparent", borderRadius: 2, overflow: "hidden", flexShrink: 0 }}>
                        <div style={{ width: `${t.percent}%`, height: "100%", background: "var(--success)", borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 10, color: "var(--txt-muted)", minWidth: 28 }}>{t.percent}%</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 4c. RAW SCAN TABLE */}
            <ScanTable
              scanTableRef={scanTableRef}
              showScanTable={showScanTable}
              setShowScanTable={setShowScanTable}
              scanData={scanData}
              scanLoading={scanLoading}
              scanSortBy={scanSortBy}
              scanSortDir={scanSortDir}
              scanNfcFilter={scanNfcFilter}
              scanSourceFilter={scanSourceFilter}
              onToggle={() => { setShowScanTable(!showScanTable); if (!showScanTable && !scanData) fetchScans({ page: 1 }); }}
              onSort={(key) => {
                const newDir = scanSortBy === key && scanSortDir === "desc" ? "asc" : "desc";
                setScanSortBy(key);
                setScanSortDir(newDir);
                fetchScans({ sortBy: key, sortDir: newDir, page: 1 });
              }}
              onPageChange={(p) => {
                setScanPage(p);
                fetchScans({ page: p });
                setTimeout(() => scanTableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
              }}
              onNfcFilter={(nfcId) => { setScanNfcFilter(nfcId); fetchScans({ nfcId, page: 1 }); }}
              onTagFilter={(tagId) => setTagFilter(tagId)}
              onGuestClick={async (ipHash, guestKey) => {
                setGuestModal({ ipHash, guestKey });
                setGuestScans([]);
                setGuestLoading(true);
                try {
                  const gp = new URLSearchParams();
                  gp.set("ipHash", ipHash);
                  if (dateFrom) gp.set("from", timeFrom ? `${dateFrom}T${timeFrom}` : dateFrom);
                  if (dateTo) gp.set("to", timeTo ? `${dateTo}T${timeTo}` : dateTo);
                  if (scanSourceFilter !== "all") gp.set("source", scanSourceFilter);
                  if (selectedTagIds.length > 0) gp.set("tags", selectedTagIds.join(","));
                  else if (tagFilter) gp.set("tagId", tagFilter);
                  if (selectedCampaignId) gp.set("campaignId", selectedCampaignId);
                  if (selectedClientId) gp.set("clientId", selectedClientId);
                  const res = await fetch(`/api/scans/guest?${gp.toString()}`);
                  const data = await res.json();
                  setGuestScans(data.rows ?? []);
                } catch { /* ignore */ }
                finally { setGuestLoading(false); }
              }}
            />

            {/* 4c. TOP GOŚCIE */}
            <GuestsTable
              showGuestsTable={showGuestsTable}
              guestsData={guestsData}
              guestsTotal={guestsTotal}
              guestsLoading={guestsLoading}
              onToggle={async () => {
                const next = !showGuestsTable;
                setShowGuestsTable(next);
                if (next) {
                  setGuestsLoading(true);
                  try {
                    const params = new URLSearchParams();
                    if (selectedTagIds.length > 0) params.set("tags", selectedTagIds.join(","));
                    else if (tagFilter) params.set("tagId", tagFilter);
                    if (selectedCampaignId) params.set("campaignId", selectedCampaignId);
                    if (selectedClientId) params.set("clientId", selectedClientId);
                    if (dateFrom) params.set("from", timeFrom ? `${dateFrom}T${timeFrom}` : dateFrom);
                    if (dateTo) params.set("to", timeTo ? `${dateTo}T${timeTo}` : dateTo);
                    if (scanSourceFilter !== "all") params.set("source", scanSourceFilter);
                    const res = await fetch(`/api/scans/guests?${params.toString()}`);
                    const data = await res.json();
                    setGuestsData(data.guests ?? []);
                    setGuestsTotal(data.total ?? 0);
                  } catch { /* ignore */ }
                  finally { setGuestsLoading(false); }
                }
              }}
              onGuestClick={async (ipHash, guestKey) => {
                setGuestModal({ ipHash, guestKey });
                setGuestScans([]);
                setGuestLoading(true);
                try {
                  const gp = new URLSearchParams();
                  gp.set("ipHash", ipHash);
                  if (dateFrom) gp.set("from", timeFrom ? `${dateFrom}T${timeFrom}` : dateFrom);
                  if (dateTo) gp.set("to", timeTo ? `${dateTo}T${timeTo}` : dateTo);
                  if (scanSourceFilter !== "all") gp.set("source", scanSourceFilter);
                  if (selectedTagIds.length > 0) gp.set("tags", selectedTagIds.join(","));
                  else if (tagFilter) gp.set("tagId", tagFilter);
                  if (selectedCampaignId) gp.set("campaignId", selectedCampaignId);
                  if (selectedClientId) gp.set("clientId", selectedClientId);
                  const res = await fetch(`/api/scans/guest?${gp.toString()}`);
                  const data = await res.json();
                  setGuestScans(data.rows ?? []);
                } catch { /* ignore */ }
                finally { setGuestLoading(false); }
              }}
            />

            <TagManagement
              displayTags={displayTags}
              isAdmin={isAdmin}
              handleToggleActive={handleToggleActive}
              handleDeleteTag={handleDeleteTag}
              handleResetStats={handleResetStats}
              handleVideoUpload={handleVideoUpload}
              handleRemoveVideo={handleRemoveVideo}
              handleCopyLink={handleCopyLink}
              fetchLinkClicks={fetchLinkClicks}
              fetchVideoStats={fetchVideoStats}
              toggleLinkStats={toggleLinkStats}
              toggleVideoStats={toggleVideoStats}
              resetAllConfirm={resetAllConfirm}
              setResetAllConfirm={setResetAllConfirm}
              resetting={resetting}
              uploadingTagId={uploadingTagId}
              uploadProgress={uploadProgress}
              linkClickStats={linkClickStats}
              expandedLinkStats={expandedLinkStats}
              videoStats={videoStats}
              expandedVideoStats={expandedVideoStats}
              copiedCardId={copiedCardId}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              handleBulkDelete={handleBulkDelete}
              handleBulkClone={handleBulkClone}
              onBulkMoveRequest={() => setShowBulkMoveModal(true)}
              bulkLoading={bulkLoading}
              bulkMsg={bulkMsg}
              copyToastTimer={copyToastTimer}
              setCopyToast={setCopyToast}
            />
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
        <PasswordModal
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          passwordError={passwordError}
          passwordSaving={passwordSaving}
          handlePasswordChange={handlePasswordChange}
        />
      )}

      {/* ============================================================ */}
      {/*  BULK MOVE MODAL                                            */}
      {/* ============================================================ */}
      {showBulkMoveModal && (
        <BulkMoveModal
          selectedCount={selectedIds.length}
          campaigns={campaigns}
          bulkMoveCampaignId={bulkMoveCampaignId}
          setBulkMoveCampaignId={setBulkMoveCampaignId}
          bulkMsg={bulkMsg}
          bulkLoading={bulkLoading}
          handleBulkMove={handleBulkMove}
          onClose={() => { setShowBulkMoveModal(false); setBulkMsg(""); }}
        />
      )}

      {/* Edit Action Drawer — REPLACED with full-page editor at /dashboard/tags/[id]/edit */}

      {/* ============================================================ */}
      {/*  COPY LINK TOAST                                             */}
      {/* ============================================================ */}
      <div
        style={{
          position: "fixed", bottom: 32, left: "50%", transform: `translateX(-50%) translateY(${copyToast ? 0 : 16}px)`,
          background: "rgba(22,163,74,0.15)", border: "1px solid var(--success)", color: "var(--success)",
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
        <GuestModal
          guestModal={guestModal}
          onClose={() => setGuestModal(null)}
          guestScans={guestScans}
          guestLoading={guestLoading}
        />
      )}

      {/* ── USERS PANEL ────────────────────────────────────────── */}
      <UsersPanel
        open={usersPanelOpen}
        onClose={() => setUsersPanelOpen(false)}
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
      />

      {/* ── CONFIRM DIALOG ──────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={confirmLabel}
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />

    </div>
  );
}
