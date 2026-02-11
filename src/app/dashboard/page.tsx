"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { getCountryFlag } from "@/lib/utils";

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
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DashboardWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#06080d" }}>
        <p style={{ color: "#8b95a8" }}>Ladowanie panelu...</p>
      </div>
    }>
      <DashboardPage />
    </Suspense>
  );
}

function DashboardPage() {
  const { data: session, status } = useSession();

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
  const [newClientColor, setNewClientColor] = useState("#e69500");
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
  const [weekOffset, setWeekOffset] = useState(0);
  const filtersRestoredRef = useRef(false);
  const scanTableRef = useRef<HTMLElement>(null);

  // change‑password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  // create tag
  const [newTagId, setNewTagId] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [newTagClient, setNewTagClient] = useState("");
  const [newTagCampaign, setNewTagCampaign] = useState("");
  const [newTagUrl, setNewTagUrl] = useState("");
  const [newTagDesc, setNewTagDesc] = useState("");
  const [newTagType, setNewTagType] = useState("url");
  const [newTagLinks, setNewTagLinks] = useState<TagLink[]>([{ label: "", url: "", icon: "link" }]);
  const [newVCard, setNewVCard] = useState<VCardData>({ firstName: "", lastName: "" });
  const [tagCreating, setTagCreating] = useState(false);
  const [tagCreateError, setTagCreateError] = useState("");
  const [tagCreateSuccess, setTagCreateSuccess] = useState("");

  // hourly chart mode
  const [hourlyMode, setHourlyMode] = useState<"bars" | "heatmap">("bars");

  // raw scan table
  const [scanData, setScanData] = useState<ScansResponse | null>(null);
  const [scanPage, setScanPage] = useState(1);
  const [scanSortBy, setScanSortBy] = useState("timestamp");
  const [scanSortDir, setScanSortDir] = useState<"asc" | "desc">("desc");
  const [scanNfcFilter, setScanNfcFilter] = useState<string | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [showScanTable, setShowScanTable] = useState(false);

  // editing
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editType, setEditType] = useState("url");
  const [editTagLinks, setEditTagLinks] = useState<TagLink[]>([]);
  const [editVCard, setEditVCard] = useState<VCardData>({ firstName: "", lastName: "" });

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

  /* ---- fetch helpers ---- */

  const fetchStats = useCallback(async (opts?: { wo?: number }) => {
    try {
      setFetchError("");
      const params = new URLSearchParams();
      if (dateFrom) {
        // Combine date + optional time: "2025-01-15T08:00" or just "2025-01-15"
        params.set("from", timeFrom ? `${dateFrom}T${timeFrom}` : dateFrom);
      }
      if (dateTo) {
        params.set("to", timeTo ? `${dateTo}T${timeTo}` : dateTo);
      }
      if (tagFilter) params.set("tag", tagFilter);
      if (selectedClientId) params.set("clientId", selectedClientId);
      if (selectedCampaignId) params.set("campaignId", selectedCampaignId);
      params.set("weekOffset", String(opts?.wo ?? weekOffset));
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
  }, [dateFrom, dateTo, timeFrom, timeTo, tagFilter, weekOffset, selectedClientId, selectedCampaignId]);

  const fetchScans = useCallback(async (opts?: { page?: number; sortBy?: string; sortDir?: "asc" | "desc"; nfcId?: string | null }) => {
    setScanLoading(true);
    try {
      const p = opts?.page ?? scanPage;
      const sb = opts?.sortBy ?? scanSortBy;
      const sd = opts?.sortDir ?? scanSortDir;
      const nfc = opts?.nfcId !== undefined ? opts.nfcId : scanNfcFilter;
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("limit", "50");
      params.set("sortBy", sb);
      params.set("sortDir", sd);
      if (tagFilter) params.set("tagId", tagFilter);
      if (selectedCampaignId) params.set("campaignId", selectedCampaignId);
      if (selectedClientId) params.set("clientId", selectedClientId);
      if (nfc) params.set("nfcId", nfc);
      if (dateFrom) params.set("from", timeFrom ? `${dateFrom}T${timeFrom}` : dateFrom);
      if (dateTo) params.set("to", timeTo ? `${dateTo}T${timeTo}` : dateTo);
      const res = await fetch(`/api/scans?${params.toString()}`);
      if (res.ok) {
        setScanData(await res.json());
      }
    } catch (e) { console.error("Scans fetch failed:", e); }
    finally { setScanLoading(false); }
  }, [scanPage, scanSortBy, scanSortDir, scanNfcFilter, tagFilter, selectedClientId, selectedCampaignId, dateFrom, dateTo, timeFrom, timeTo]);

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

  /* ---- auto-load video retention when video campaign selected ---- */
  useEffect(() => {
    if (tagFilter) {
      const selectedTag = tags.find(t => t.id === tagFilter);
      if (selectedTag?.tagType === "video") {
        fetch(`/api/video-event?tagId=${encodeURIComponent(tagFilter)}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => { if (data) setSelectedVideoRetention(data); })
          .catch(() => {});
      } else {
        setSelectedVideoRetention(null);
      }
    } else {
      setSelectedVideoRetention(null);
    }
  }, [tagFilter, tags]);

  /* ---- restore filters from localStorage on mount ---- */
  useEffect(() => {
    if (filtersRestoredRef.current) return;
    filtersRestoredRef.current = true;
    try {
      const saved = localStorage.getItem("nfc_filters");
      if (saved) {
        const f = JSON.parse(saved);
        if (f.clientId) setSelectedClientId(f.clientId);
        if (f.campaignId) setSelectedCampaignId(f.campaignId);
        if (f.tagFilter) setTagFilter(f.tagFilter);
        if (f.dateFrom) setDateFrom(f.dateFrom);
        if (f.dateTo) setDateTo(f.dateTo);
        if (f.timeFrom) setTimeFrom(f.timeFrom);
        if (f.timeTo) setTimeTo(f.timeTo);
      }
    } catch { /* ignore */ }
  }, []);

  /* ---- save filters to localStorage when they change ---- */
  useEffect(() => {
    if (!filtersRestoredRef.current) return;
    try {
      localStorage.setItem("nfc_filters", JSON.stringify({
        clientId: selectedClientId,
        campaignId: selectedCampaignId,
        tagFilter,
        dateFrom,
        dateTo,
        timeFrom,
        timeTo,
      }));
    } catch { /* ignore */ }
  }, [selectedClientId, selectedCampaignId, tagFilter, dateFrom, dateTo, timeFrom, timeTo]);

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
      setTagFilter(""); // reset tag filter when client changes
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
      setTagFilter(""); // reset tag filter when campaign changes
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampaignId]);

  /* ---- handlers ---- */

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchTags(), fetchClients(), fetchCampaigns()]);
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
        setNewClientColor("#e69500");
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
        alert(`Blad tworzenia kampanii: ${errData.error || res.status}`);
        console.error("Campaign create error:", res.status, errData);
      }
    } catch (e) { console.error("Campaign create fetch error:", e); alert("Blad polaczenia"); }
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

  const handleResetFilters = async () => {
    setDateFrom("");
    setDateTo("");
    setTimeFrom("");
    setTimeTo("");
    setTagFilter("");
    setSelectedClientId(null);
    setSelectedCampaignId(null);
    setWeekOffset(0);
    setLoading(true);
    const params = new URLSearchParams();
    params.set("weekOffset", "0");
    try {
      const res = await fetch(`/api/stats?${params.toString()}`);
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
        ...(newTagClient ? { clientId: newTagClient } : {}),
        ...(newTagCampaign ? { campaignId: newTagCampaign } : {}),
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
        setTagCreateSuccess("Akcja utworzona pomyslnie!");
        setNewTagId("");
        setNewTagName("");
        setNewTagUrl("");
        setNewTagDesc("");
        setNewTagType("url");
        setNewTagClient("");
        setNewTagCampaign("");
        setNewTagLinks([{ label: "", url: "", icon: "link" }]);
        setNewVCard({ firstName: "", lastName: "" });
        await fetchTags();
        await fetchStats();
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
      setEditingTagId(null);
      await fetchTags();
    } catch { /* ignore */ }
  };

  const startEdit = (tag: TagFull) => {
    setEditingTagId(tag.id);
    setEditName(tag.name);
    setEditUrl(tag.targetUrl);
    setEditDesc(tag.description || "");
    setEditType(tag.tagType);
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

  /* tag type label helper */
  const getTagTypeLabel = (type: string) => {
    switch (type) {
      case "url": return "URL";
      case "video": return "Video";
      case "multilink": return "Multi-link";
      case "vcard": return "Wizytowka";
      case "google-review": return "Google Review";
      default: return "URL";
    }
  };

  const getTagTypeColor = (type: string) => {
    switch (type) {
      case "url": return { bg: "rgba(124,58,237,0.15)", color: "#f5b731" };
      case "video": return { bg: "rgba(16,185,129,0.15)", color: "#10b981" };
      case "multilink": return { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" };
      case "vcard": return { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" };
      case "google-review": return { bg: "rgba(234,67,53,0.15)", color: "#ea4335" };
      default: return { bg: "rgba(124,58,237,0.15)", color: "#f5b731" };
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
          background: "#06080d",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              border: "3px solid #2a2a4a",
              borderTopColor: "#e69500",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#8b95a8" }}>Ladowanie...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
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
    <div style={{ minHeight: "100vh", background: "#06080d" }}>
      {/* ---- Spinner keyframes ---- */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .anim-fade { animation: fadeIn 0.35s ease forwards; }
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
          borderBottom: "1px solid #2a2a4a",
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
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #e69500, #f5b731)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="white"
                viewBox="0 0 24 24"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
            </div>
            <span style={{ fontSize: 20, fontWeight: 700 }}>
              <span className="gradient-text">TwojeNFC</span>
            </span>
          </div>

          {/* actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                background: "#131b2e",
                border: "1px solid #1e2d45",
                color: "#e8ecf1",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity: refreshing ? 0.6 : 1,
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#e69500")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1e2d45")}
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

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{
                background: "transparent",
                border: "1px solid #1e2d45",
                color: "#8b95a8",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "border-color 0.2s, color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#ef4444";
                e.currentTarget.style.color = "#f87171";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1e2d45";
                e.currentTarget.style.color = "#a0a0c0";
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
        {/* ---- Client Selector (dropdown) ---- */}
        <section style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5a6478" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
              <select
                className="input-field"
                value={selectedClientId || ""}
                onChange={(e) => setSelectedClientId(e.target.value || null)}
                style={{
                  padding: "8px 14px",
                  minWidth: 200,
                  fontSize: 14,
                  fontWeight: 600,
                  background: selectedClientId ? "#0c1220" : "#0c1220",
                  borderColor: selectedClientId ? (clients.find(c => c.id === selectedClientId)?.color || "#e69500") : "#1e2d45",
                }}
              >
                <option value="">Wszyscy klienci ({clients.reduce((s, c) => s + c.scanCount, 0)} skanow)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.scanCount} skanow)
                  </option>
                ))}
              </select>
            </div>
            {selectedClientId && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 10,
                background: `${clients.find(c => c.id === selectedClientId)?.color || "#e69500"}18`,
                border: `1px solid ${clients.find(c => c.id === selectedClientId)?.color || "#e69500"}40`,
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: clients.find(c => c.id === selectedClientId)?.color || "#e69500",
                }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: clients.find(c => c.id === selectedClientId)?.color || "#f5b731" }}>
                  {clients.find(c => c.id === selectedClientId)?.name}
                </span>
                <button
                  onClick={() => setSelectedClientId(null)}
                  style={{ background: "none", border: "none", color: "#5a6478", cursor: "pointer", fontSize: 16, padding: "0 2px", lineHeight: 1 }}
                  title="Pokaz wszystkich"
                >
                  x
                </button>
              </div>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setShowAddClient(!showAddClient)}
                style={{
                  background: "transparent",
                  border: "1px dashed #2a4060",
                  color: "#5a6478",
                  borderRadius: 10,
                  padding: "8px 14px",
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "border-color 0.2s, color 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#e69500"; e.currentTarget.style.color = "#f5b731"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a4060"; e.currentTarget.style.color = "#5a6478"; }}
              >
                + Dodaj klienta
              </button>
              {selectedClientId && (
                <button
                  onClick={() => handleDeleteClient(selectedClientId)}
                  style={{
                    background: "transparent",
                    border: "1px solid #1e2d45",
                    color: "#5a6478",
                    borderRadius: 10,
                    padding: "8px 12px",
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "border-color 0.2s, color 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#f87171"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e2d45"; e.currentTarget.style.color = "#5a6478"; }}
                >
                  Usun klienta
                </button>
              )}
            </div>
          </div>
          {/* Add client form */}
          {showAddClient && (
            <div className="card" style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", padding: "14px 18px", marginTop: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>Nazwa klienta</label>
                <input className="input-field" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="np. Bulderownia" style={{ fontSize: 13, padding: "7px 12px" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>Opis</label>
                <input className="input-field" value={newClientDesc} onChange={(e) => setNewClientDesc(e.target.value)} placeholder="Opcjonalny opis" style={{ fontSize: 13, padding: "7px 12px" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>Kolor</label>
                <input type="color" value={newClientColor} onChange={(e) => setNewClientColor(e.target.value)} style={{ width: 40, height: 34, border: "1px solid #1e2d45", borderRadius: 6, background: "#131b2e", cursor: "pointer" }} />
              </div>
              <button className="btn-primary" onClick={handleCreateClient} disabled={clientCreating} style={{ padding: "8px 18px", fontSize: 12 }}>
                {clientCreating ? "..." : "Dodaj"}
              </button>
              <button onClick={() => setShowAddClient(false)} style={{ background: "#1a253a", border: "1px solid #1e2d45", color: "#8b95a8", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>
                Anuluj
              </button>
            </div>
          )}
        </section>

        {/* ---- Campaign Selector (shows when client selected) ---- */}
        {selectedClientId && (
          <section style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5a6478" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                </svg>
                <select
                  className="input-field"
                  value={selectedCampaignId || ""}
                  onChange={(e) => setSelectedCampaignId(e.target.value || null)}
                  style={{
                    padding: "8px 14px",
                    minWidth: 200,
                    fontSize: 14,
                    fontWeight: 600,
                    borderColor: selectedCampaignId ? "#60a5fa" : "#1e2d45",
                  }}
                >
                  <option value="">Wszystkie kampanie ({filteredCampaigns.length})</option>
                  {filteredCampaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.scanCount} skanow, {c.tagCount} akcji)
                    </option>
                  ))}
                </select>
              </div>
              {selectedCampaignId && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: 10,
                  background: "rgba(96,165,250,0.1)",
                  border: "1px solid rgba(96,165,250,0.25)",
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth={2.5}>
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#60a5fa" }}>
                    {filteredCampaigns.find(c => c.id === selectedCampaignId)?.name}
                  </span>
                  <button
                    onClick={() => setSelectedCampaignId(null)}
                    style={{ background: "none", border: "none", color: "#5a6478", cursor: "pointer", fontSize: 16, padding: "0 2px", lineHeight: 1 }}
                    title="Pokaz wszystkie kampanie"
                  >
                    x
                  </button>
                </div>
              )}
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => setShowAddCampaign(!showAddCampaign)}
                  style={{
                    background: "transparent",
                    border: "1px dashed #2a4060",
                    color: "#5a6478",
                    borderRadius: 10,
                    padding: "8px 14px",
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "border-color 0.2s, color 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#60a5fa"; e.currentTarget.style.color = "#60a5fa"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a4060"; e.currentTarget.style.color = "#5a6478"; }}
                >
                  + Dodaj kampanie
                </button>
                {selectedCampaignId && (
                  <button
                    onClick={() => handleDeleteCampaign(selectedCampaignId)}
                    style={{
                      background: "transparent",
                      border: "1px solid #1e2d45",
                      color: "#5a6478",
                      borderRadius: 10,
                      padding: "8px 12px",
                      fontSize: 12,
                      cursor: "pointer",
                      transition: "border-color 0.2s, color 0.2s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#f87171"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e2d45"; e.currentTarget.style.color = "#5a6478"; }}
                  >
                    Usun kampanie
                  </button>
                )}
              </div>
            </div>
            {/* Add campaign form */}
            {showAddCampaign && (
              <div className="card" style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", padding: "14px 18px", marginTop: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>Nazwa kampanii</label>
                  <input className="input-field" value={newCampaignName} onChange={(e) => setNewCampaignName(e.target.value)} placeholder="np. Promocja letnia 2025" style={{ fontSize: 13, padding: "7px 12px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>Opis</label>
                  <input className="input-field" value={newCampaignDesc} onChange={(e) => setNewCampaignDesc(e.target.value)} placeholder="Opcjonalny opis" style={{ fontSize: 13, padding: "7px 12px" }} />
                </div>
                <button className="btn-primary" onClick={handleCreateCampaign} disabled={campaignCreating} style={{ padding: "8px 18px", fontSize: 12 }}>
                  {campaignCreating ? "..." : "Dodaj"}
                </button>
                <button onClick={() => setShowAddCampaign(false)} style={{ background: "#1a253a", border: "1px solid #1e2d45", color: "#8b95a8", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>
                  Anuluj
                </button>
              </div>
            )}
          </section>
        )}

        {/* ---- Filter Bar ---- */}
        <section
          className="card"
          style={{
            marginBottom: 24,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "#8b95a8", fontWeight: 500 }}>
              Od
            </label>
            <div style={{ display: "flex", gap: 4 }}>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{ minWidth: 140 }}
              />
              <input
                type="time"
                value={timeFrom}
                onChange={(e) => setTimeFrom(e.target.value)}
                placeholder="00:00"
                style={{
                  minWidth: 90,
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--txt)",
                  borderRadius: 8,
                  padding: "0.5rem 0.5rem",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "#8b95a8", fontWeight: 500 }}>
              Do
            </label>
            <div style={{ display: "flex", gap: 4 }}>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{ minWidth: 140 }}
              />
              <input
                type="time"
                value={timeTo}
                onChange={(e) => setTimeTo(e.target.value)}
                placeholder="23:59"
                style={{
                  minWidth: 90,
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--txt)",
                  borderRadius: 8,
                  padding: "0.5rem 0.5rem",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "#8b95a8", fontWeight: 500 }}>
              Akcja
            </label>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="input-field"
              style={{ minWidth: 180, padding: "8px 12px" }}
            >
              <option value="">Wszystkie akcje</option>
              {allTagsFilter.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.id})
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" onClick={handleFilter} style={{ padding: "9px 20px", fontSize: 13 }}>
              Pokaz
            </button>
            <button
              onClick={handleResetFilters}
              style={{
                background: "#1a253a",
                border: "1px solid #1e2d45",
                color: "#8b95a8",
                borderRadius: 10,
                padding: "9px 20px",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#e69500")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1e2d45")}
            >
              Reset filtrow
            </button>
          </div>
        </section>

        {/* ---- Error display ---- */}
        {fetchError && (
          <div style={{ margin: "20px 0", padding: "16px 20px", borderRadius: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: 13, fontFamily: "monospace", wordBreak: "break-all" }}>
            {fetchError}
          </div>
        )}

        {/* ---- Loading overlay ---- */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "3px solid #2a2a4a",
                borderTopColor: "#e69500",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 12px",
              }}
            />
            <p style={{ color: "#8b95a8", fontSize: 14 }}>Ladowanie danych...</p>
          </div>
        )}

        {!loading && stats && (
          <div className="anim-fade">
            {/* ========================================================== */}
            {/*  1. KPI CARDS                                              */}
            {/* ========================================================== */}

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
                marginBottom: 24,
              }}
            >
              {/* Total Scans */}
              <div className="card card-hover" style={{ position: "relative", overflow: "hidden" }}>
                <div
                  style={{
                    position: "absolute",
                    top: -20,
                    right: -20,
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "rgba(139,92,246,0.08)",
                  }}
                />
                <p style={{ fontSize: 12, color: "#8b95a8", fontWeight: 500, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                  Wszystkie skany
                </p>
                <p style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1 }} className="gradient-text">
                  {kpi?.totalScans.toLocaleString("pl-PL") ?? "0"}
                </p>
                <p style={{ fontSize: 11, color: "#5a6478", marginTop: 4 }}>
                  Lacznie zarejestrowanych skanow
                </p>
              </div>

              {/* Unique Users */}
              <div className="card card-hover" style={{ position: "relative", overflow: "hidden" }}>
                <div
                  style={{
                    position: "absolute",
                    top: -20,
                    right: -20,
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "rgba(52,211,153,0.08)",
                  }}
                />
                <p style={{ fontSize: 12, color: "#8b95a8", fontWeight: 500, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                  Unikalni uzytkownicy
                </p>
                <p style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1 }} className="gradient-text">
                  {kpi?.uniqueUsers.toLocaleString("pl-PL") ?? "0"}
                </p>
                <p style={{ fontSize: 11, color: "#5a6478", marginTop: 4 }}>
                  Rozne urzadzenia / osoby
                </p>
              </div>

              {/* Last Scan */}
              <div className="card card-hover" style={{ position: "relative", overflow: "hidden" }}>
                <div
                  style={{
                    position: "absolute",
                    top: -20,
                    right: -20,
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "rgba(139,92,246,0.08)",
                  }}
                />
                <p style={{ fontSize: 12, color: "#8b95a8", fontWeight: 500, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                  Ostatni skan
                </p>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#e8ecf1" }}>
                  {formatDate(kpi?.lastScan ?? null)}
                </p>
              </div>

              {/* Avg Scans Per User */}
              <div className="card card-hover" style={{ position: "relative", overflow: "hidden" }}>
                <div
                  style={{
                    position: "absolute",
                    top: -20,
                    right: -20,
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "rgba(52,211,153,0.08)",
                  }}
                />
                <p style={{ fontSize: 12, color: "#8b95a8", fontWeight: 500, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                  Sr. skanow / osoba
                </p>
                <p style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1, color: "#10b981" }}>
                  {kpi?.avgScansPerUser ?? 0}x
                </p>
                <p style={{ fontSize: 11, color: "#5a6478", marginTop: 4 }}>
                  {(kpi?.avgScansPerUser ?? 0) <= 1.2 ? "Wiekszosc skanuje raz" : "Uzytkownicy wracaja"}
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
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#e8ecf1" }}>
                      Retencja video
                    </h3>
                    <p style={{ fontSize: 12, color: "#5a6478", marginTop: 2 }}>
                      Ile % widzow dotarlo do kazdego momentu
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 22, fontWeight: 800, color: "#10b981" }}>{selectedVideoRetention.plays}</p>
                      <p style={{ fontSize: 10, color: "#8b95a8" }}>Odtworzen</p>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 22, fontWeight: 800, color: "#60a5fa" }}>{selectedVideoRetention.completions}</p>
                      <p style={{ fontSize: 10, color: "#8b95a8" }}>Do konca</p>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 22, fontWeight: 800, color: "#f5b731" }}>{formatWatchTime(selectedVideoRetention.avgWatchTime)}</p>
                      <p style={{ fontSize: 10, color: "#8b95a8" }}>Sred. czas</p>
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
                              <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#2a2a4a" strokeWidth="1" />
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
                              fontWeight: 800,
                              color: p.pct >= 75 ? "#10b981" : p.pct >= 50 ? "#60a5fa" : p.pct >= 25 ? "#f59e0b" : "#f87171",
                            }}>{p.pct}%</p>
                            <p style={{ fontSize: 10, color: "#8b95a8" }}>dotarli do {p.label}</p>
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
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "#e8ecf1" }}>
                  Urzadzenia
                </h3>

                {[
                  { label: "iOS", value: devices?.iOS ?? 0, percent: iosPercent, color: "#e69500" },
                  { label: "Android", value: devices?.Android ?? 0, percent: androidPercent, color: "#10b981" },
                  { label: "Desktop", value: devices?.Desktop ?? 0, percent: desktopPercent, color: "#f5b731" },
                ].map((d) => (
                  <div key={d.label} style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 6,
                        fontSize: 13,
                      }}
                    >
                      <span style={{ color: "#e8ecf1", fontWeight: 500 }}>{d.label}</span>
                      <span style={{ color: "#8b95a8" }}>
                        {d.value} ({d.percent}%)
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${d.percent}%`,
                          background: `linear-gradient(90deg, ${d.color}, ${d.color}88)`,
                        }}
                      />
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #2a2a4a" }}>
                  <span style={{ fontSize: 12, color: "#5a6478" }}>
                    Razem: {devices?.total.toLocaleString("pl-PL") ?? 0}
                  </span>
                </div>
              </div>

              {/* Top Tags */}
              <div className="card">
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: "#e8ecf1" }}>
                  Najczesciej skanowane akcje
                </h3>
                <p style={{ fontSize: 11, color: "#5a6478", marginBottom: 16 }}>
                  Skany = lacznie | Unikalni = rozne osoby/urzadzenia
                </p>
                {topTags.length === 0 && (
                  <p style={{ color: "#5a6478", fontSize: 14 }}>Brak danych</p>
                )}
                {topTags.map((t, i) => (
                  <div
                    key={t.tagId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderBottom: i < topTags.length - 1 ? "1px solid #2a2a4a" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: "linear-gradient(135deg, #e69500, #f5b731)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#fff",
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#e8ecf1" }}>
                          {t.tagName}
                        </p>
                        <p style={{ fontSize: 11, color: "#5a6478" }}>{t.tagId}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", display: "flex", gap: 16, alignItems: "center" }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#e8ecf1" }}>
                          {t.count}
                        </p>
                        <p style={{ fontSize: 10, color: "#8b95a8" }}>skanow</p>
                      </div>
                      <div style={{ borderLeft: "1px solid #2a2a4a", paddingLeft: 16 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#10b981" }}>
                          {t.uniqueUsers}
                        </p>
                        <p style={{ fontSize: 10, color: "#8b95a8" }}>unikalnych</p>
                      </div>
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
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "#e8ecf1" }}>
                  Kraje
                </h3>
                {topCountries.length === 0 && (
                  <p style={{ color: "#5a6478", fontSize: 14 }}>Brak danych</p>
                )}
                {topCountries.map((c, i) => (
                  <div
                    key={c.country}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderBottom: i < topCountries.length - 1 ? "1px solid #2a2a4a" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{getCountryFlag(c.country)}</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#e8ecf1" }}>
                        {c.country}
                      </span>
                    </div>
                    <div style={{ textAlign: "right", display: "flex", gap: 12, alignItems: "center" }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#e8ecf1" }}>{c.count}</span>
                        <span style={{ fontSize: 10, color: "#8b95a8", marginLeft: 4 }}>sk.</span>
                      </div>
                      <div style={{ borderLeft: "1px solid #2a2a4a", paddingLeft: 12 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#10b981" }}>{c.uniqueUsers}</span>
                        <span style={{ fontSize: 10, color: "#8b95a8", marginLeft: 4 }}>unik.</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cities */}
              <div className="card">
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "#e8ecf1" }}>
                  Miasta
                </h3>
                {topCities.length === 0 && (
                  <p style={{ color: "#5a6478", fontSize: 14 }}>Brak danych</p>
                )}
                {topCities.map((c, i) => (
                  <div
                    key={`${c.city}-${c.country}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderBottom: i < topCities.length - 1 ? "1px solid #2a2a4a" : "none",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "#e8ecf1" }}>
                        {c.city}
                      </p>
                      <p style={{ fontSize: 11, color: "#5a6478" }}>{c.country}</p>
                    </div>
                    <div style={{ textAlign: "right", display: "flex", gap: 12, alignItems: "center" }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#e8ecf1" }}>{c.count}</span>
                        <span style={{ fontSize: 10, color: "#8b95a8", marginLeft: 4 }}>sk.</span>
                      </div>
                      <div style={{ borderLeft: "1px solid #2a2a4a", paddingLeft: 12 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#10b981" }}>{c.uniqueUsers}</span>
                        <span style={{ fontSize: 10, color: "#8b95a8", marginLeft: 4 }}>unik.</span>
                      </div>
                    </div>
                  </div>
                ))}
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
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#e8ecf1" }}>
                    Trend tygodniowy
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => handleWeekChange(-1)}
                      style={{
                        background: "#1a253a",
                        border: "1px solid #1e2d45",
                        color: "#8b95a8",
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
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#e69500")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1e2d45")}
                    >
                      &#8249;
                    </button>
                    <span style={{ fontSize: 12, color: "#8b95a8", minWidth: 100, textAlign: "center" }}>
                      {weekly
                        ? formatWeekRange(weekly.weekStart, weekly.weekEnd)
                        : "---"}
                    </span>
                    <button
                      onClick={() => handleWeekChange(1)}
                      disabled={weekOffset >= 0}
                      style={{
                        background: "#1a253a",
                        border: "1px solid #1e2d45",
                        color: weekOffset >= 0 ? "#2a4060" : "#a0a0c0",
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
                        if (weekOffset < 0) e.currentTarget.style.borderColor = "#e69500";
                      }}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1e2d45")}
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
                        <span style={{ fontSize: 10, fontWeight: 600, color: d.count > 0 ? "#f5b731" : "#3a4560" }}>
                          {d.count}
                        </span>
                        <span style={{ fontSize: 9, fontWeight: 600, color: d.uniqueUsers > 0 ? "#10b981" : "#3a4560" }}>
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
                              background: d.count > 0 ? "linear-gradient(180deg, #f5b731, #e69500)" : "#1a253a",
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
                              background: d.uniqueUsers > 0 ? "linear-gradient(180deg, #10b981, #059669)" : "transparent",
                              transition: "height 0.4s ease",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 11, color: "#8b95a8", fontWeight: 500 }}>
                          {d.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
                  <span style={{ fontSize: 10, color: "#f5b731", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: "#f5b731", opacity: 0.5, display: "inline-block" }} /> Wszystkie
                  </span>
                  <span style={{ fontSize: 10, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: "#10b981", display: "inline-block" }} /> Unikalne
                  </span>
                </div>
              </div>

              {/* Languages */}
              <div className="card">
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "#e8ecf1" }}>
                  Jezyki przegladarek
                </h3>
                {topLanguages.length === 0 && (
                  <p style={{ color: "#5a6478", fontSize: 14 }}>Brak danych</p>
                )}
                {topLanguages.map((l, i) => (
                  <div
                    key={l.lang}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderBottom: i < topLanguages.length - 1 ? "1px solid #2a2a4a" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: "#1a253a",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#f5b731",
                          fontFamily: "monospace",
                        }}
                      >
                        {l.lang}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div className="progress-bar" style={{ width: 80 }}>
                        <div className="progress-fill" style={{ width: `${l.percent}%` }} />
                      </div>
                      <span style={{ fontSize: 13, color: "#8b95a8", minWidth: 50, textAlign: "right" }}>
                        {l.count}
                      </span>
                      <span style={{ fontSize: 12, color: "#10b981", minWidth: 40, textAlign: "right" }}>
                        {l.uniqueUsers} un.
                      </span>
                    </div>
                  </div>
                ))}
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
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: "#e8ecf1" }}>
                      Rozklad godzinowy
                    </h3>
                    {/* Peak insight */}
                    {(() => {
                      const peak = hourly.reduce((a, b) => b.count > a.count ? b : a, hourly[0]);
                      const totalH = hourly.reduce((s, h) => s + h.count, 0);
                      const peakPct = totalH > 0 ? Math.round((peak.count / totalH) * 100) : 0;
                      return peak.count > 0 ? (
                        <p style={{ fontSize: 12, color: "#8b95a8", display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ color: "#10b981", fontWeight: 700 }}>Szczyt:</span>
                          {peak.hour}:00–{peak.hour + 1}:00
                          <span style={{ color: "#f5b731", fontWeight: 600 }}>({peak.count} skanow, {peak.uniqueUsers} unik.)</span>
                          <span style={{ color: "#5a6478" }}>· {peakPct}% calego ruchu</span>
                        </p>
                      ) : null;
                    })()}
                  </div>
                  {/* Mode toggle */}
                  <div style={{ display: "flex", background: "#0f1a2e", borderRadius: 8, overflow: "hidden", border: "1px solid #1e2d45" }}>
                    <button
                      onClick={() => setHourlyMode("bars")}
                      style={{
                        padding: "6px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", transition: "all 0.2s",
                        background: hourlyMode === "bars" ? "rgba(245,183,49,0.15)" : "transparent",
                        color: hourlyMode === "bars" ? "#f5b731" : "#5a6478",
                      }}
                    >
                      Histogram
                    </button>
                    <button
                      onClick={() => setHourlyMode("heatmap")}
                      style={{
                        padding: "6px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", transition: "all 0.2s",
                        background: hourlyMode === "heatmap" ? "rgba(245,183,49,0.15)" : "transparent",
                        color: hourlyMode === "heatmap" ? "#f5b731" : "#5a6478",
                      }}
                    >
                      Heatmapa
                    </button>
                  </div>
                </div>

                {/* Legend */}
                <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                  <span style={{ fontSize: 10, color: "#f5b731", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: "#f5b731", opacity: 0.6, display: "inline-block" }} /> Wszystkie skany
                  </span>
                  <span style={{ fontSize: 10, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: "#10b981", display: "inline-block" }} /> Unikalni
                  </span>
                </div>

                {/* HISTOGRAM MODE */}
                {hourlyMode === "bars" && (
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 200, paddingTop: 8 }}>
                    {hourly.map((h) => {
                      const maxH = Math.max(...hourly.map(x => x.count), 1);
                      const barH = (h.count / maxH) * 160;
                      const uBarH = (h.uniqueUsers / maxH) * 160;
                      const isActive = h.count > 0;
                      return (
                        <div key={h.hour} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }} title={`${h.hour}:00 - ${h.count} skanow, ${h.uniqueUsers} unikalnych`}>
                          {isActive && (
                            <span style={{ fontSize: 9, fontWeight: 700, color: "#f5b731" }}>{h.count}</span>
                          )}
                          {isActive && h.uniqueUsers < h.count && (
                            <span style={{ fontSize: 8, fontWeight: 600, color: "#10b981" }}>{h.uniqueUsers}</span>
                          )}
                          <div style={{ position: "relative", width: "100%", height: Math.max(barH, isActive ? 4 : 2) }}>
                            {/* Total bar */}
                            <div style={{
                              position: "absolute", bottom: 0, left: "10%", right: "10%",
                              height: Math.max(barH, isActive ? 4 : 2),
                              borderRadius: "3px 3px 0 0",
                              background: isActive ? "linear-gradient(180deg, rgba(245,183,49,0.7), rgba(230,149,0,0.4))" : "#131b2e",
                              transition: "height 0.3s ease",
                            }} />
                            {/* Unique overlay */}
                            {h.uniqueUsers > 0 && (
                              <div style={{
                                position: "absolute", bottom: 0, left: "25%", right: "25%",
                                height: Math.max(uBarH, 3),
                                borderRadius: "2px 2px 0 0",
                                background: "linear-gradient(180deg, rgba(16,185,129,0.85), rgba(5,150,105,0.5))",
                                transition: "height 0.3s ease",
                              }} />
                            )}
                          </div>
                          <span style={{ fontSize: 8, color: isActive ? "#8b95a8" : "#2a3650", fontWeight: 500 }}>
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
                        <div key={`hdr-${h}`} style={{ textAlign: "center", fontSize: 8, color: "#5a6478", padding: "4px 0", fontWeight: 500 }}>
                          {h}
                        </div>
                      ))}
                      {/* Data rows: each day */}
                      {["Pon", "Wt", "Sr", "Czw", "Pt", "Sob", "Nd"].map((dayName, dayIdx) => (
                        <React.Fragment key={`row-${dayIdx}`}>
                          <div style={{ fontSize: 10, color: "#8b95a8", fontWeight: 600, display: "flex", alignItems: "center", paddingRight: 8 }}>
                            {dayName}
                          </div>
                          {Array.from({ length: 24 }, (_, h) => {
                            const val = heatmapData[dayIdx]?.[h] || 0;
                            const intensity = heatmapMax > 0 ? val / heatmapMax : 0;
                            // Color interpolation: 0 = dark, 1 = bright orange
                            const bg = val === 0
                              ? "#0c1220"
                              : `rgba(245, 183, 49, ${0.15 + intensity * 0.85})`;
                            return (
                              <div
                                key={`cell-${dayIdx}-${h}`}
                                title={`${dayName} ${h}:00 — ${val} skanow`}
                                style={{
                                  height: 22,
                                  borderRadius: 2,
                                  background: bg,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 8,
                                  fontWeight: 700,
                                  color: val > 0 ? (intensity > 0.5 ? "#1a1a2e" : "#e8ecf1") : "transparent",
                                  cursor: val > 0 ? "default" : "default",
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
                      <span style={{ fontSize: 9, color: "#5a6478" }}>Mniej</span>
                      <div style={{ display: "flex", gap: 2 }}>
                        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
                          <div key={i} style={{ width: 16, height: 10, borderRadius: 2, background: f === 0 ? "#0c1220" : `rgba(245, 183, 49, ${0.15 + f * 0.85})` }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 9, color: "#5a6478" }}>Wiecej</span>
                    </div>
                  </div>
                )}

                {/* Timezone note */}
                <p style={{ fontSize: 10, color: "#3a4560", marginTop: 10, textAlign: "right" }}>
                  Strefa czasowa: przegladarka ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                </p>
              </section>
            )}

            {/* ========================================================== */}
            {/*  4b. NFC CHIPS (physical keychains)                        */}
            {/* ========================================================== */}

            {stats.nfcChips && stats.nfcChips.length > 0 && (
              <section className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#e8ecf1", marginBottom: 16 }}>
                  Fizyczne breloczki NFC
                </h3>
                <p style={{ fontSize: 12, color: "#5a6478", marginBottom: 16 }}>
                  Unikalne chipy NFC ({stats.nfcChips.length} {stats.nfcChips.length === 1 ? "breloczek" : "breloczków"}, {stats.nfcChips.reduce((s, c) => s + c.count, 0)} skanów łącznie)
                </p>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1e2d45" }}>
                        <th style={{ textAlign: "left", padding: "8px 12px", color: "#8b95a8", fontWeight: 600 }}>#</th>
                        <th style={{ textAlign: "left", padding: "8px 12px", color: "#8b95a8", fontWeight: 600 }}>NFC Chip ID</th>
                        <th style={{ textAlign: "right", padding: "8px 12px", color: "#8b95a8", fontWeight: 600 }}>Skany</th>
                        <th style={{ textAlign: "right", padding: "8px 12px", color: "#8b95a8", fontWeight: 600 }}>Udział</th>
                        <th style={{ padding: "8px 12px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.nfcChips.map((chip, idx) => {
                        const totalNfc = stats.nfcChips.reduce((s, c) => s + c.count, 0);
                        const pct = totalNfc > 0 ? Math.round((chip.count / totalNfc) * 100) : 0;
                        return (
                          <tr key={chip.nfcId} style={{ borderBottom: "1px solid #131b2e" }}>
                            <td style={{ padding: "8px 12px", color: "#5a6478" }}>{idx + 1}</td>
                            <td style={{ padding: "8px 12px" }}>
                              <button
                                onClick={() => { setScanNfcFilter(chip.nfcId); setShowScanTable(true); fetchScans({ nfcId: chip.nfcId, page: 1 }); setTimeout(() => scanTableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200); }}
                                style={{ background: "none", border: "none", fontFamily: "monospace", color: "#f5b731", fontWeight: 600, cursor: "pointer", textDecoration: "underline", padding: 0, fontSize: 12 }}
                                title="Kliknij zeby zobaczyc skany tego chipa"
                              >
                                {chip.nfcId}
                              </button>
                            </td>
                            <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#e8ecf1" }}>{chip.count}</td>
                            <td style={{ padding: "8px 12px", textAlign: "right" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                                <div style={{ width: 50, height: 4, background: "#1a253a", borderRadius: 2, overflow: "hidden" }}>
                                  <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #8b5cf6, #a78bfa)", borderRadius: 2 }} />
                                </div>
                                <span style={{ color: "#8b95a8", minWidth: 30 }}>{pct}%</span>
                              </div>
                            </td>
                            <td style={{ padding: "8px 12px" }}>
                              <button
                                onClick={() => { setScanNfcFilter(chip.nfcId); setShowScanTable(true); fetchScans({ nfcId: chip.nfcId, page: 1 }); setTimeout(() => scanTableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200); }}
                                style={{ background: "transparent", border: "1px solid #1e2d45", color: "#60a5fa", borderRadius: 4, padding: "3px 8px", fontSize: 10, cursor: "pointer" }}
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
            {/*  4c. RAW SCAN TABLE                                        */}
            {/* ========================================================== */}

            <section ref={scanTableRef} className="card" style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#e8ecf1" }}>
                    Lista skanow
                  </h3>
                  <button
                    onClick={() => { setShowScanTable(!showScanTable); if (!showScanTable && !scanData) fetchScans({ page: 1 }); }}
                    style={{
                      background: showScanTable ? "rgba(245,183,49,0.12)" : "#1a253a",
                      border: `1px solid ${showScanTable ? "rgba(245,183,49,0.3)" : "#1e2d45"}`,
                      color: showScanTable ? "#f5b731" : "#8b95a8",
                      borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600,
                    }}
                  >
                    {showScanTable ? "Ukryj" : "Pokaz"} {scanData ? `(${scanData.total})` : ""}
                  </button>
                </div>
                {showScanTable && scanNfcFilter && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)" }}>
                    <span style={{ fontSize: 11, color: "#a78bfa" }}>NFC: {scanNfcFilter}</span>
                    <button onClick={() => { setScanNfcFilter(null); fetchScans({ nfcId: null, page: 1 }); }} style={{ background: "none", border: "none", color: "#5a6478", cursor: "pointer", fontSize: 14 }}>×</button>
                  </div>
                )}
              </div>

              {showScanTable && (
                <>
                  {scanLoading && <p style={{ fontSize: 12, color: "#5a6478", padding: "20px 0", textAlign: "center" }}>Ladowanie...</p>}
                  {scanData && !scanLoading && (
                    <>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                          <thead>
                            <tr style={{ borderBottom: "2px solid #1e2d45" }}>
                              {[
                                { key: "seq", label: "#", w: 40 },
                                { key: "timestamp", label: "Data/Czas", w: 140 },
                                { key: "tagId", label: "Akcja", w: 140 },
                                { key: "nfcId", label: "NFC Chip", w: 120 },
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
                                    color: scanSortBy === col.key ? "#f5b731" : "#8b95a8",
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
                              <th style={{ textAlign: "left", padding: "8px 8px", color: "#8b95a8", fontWeight: 600 }}>Jezyk</th>
                              <th style={{ textAlign: "left", padding: "8px 8px", color: "#8b95a8", fontWeight: 600 }} title="Czy ta osoba skanowala te sama akcje wczesniej">Ponowny</th>
                            </tr>
                          </thead>
                          <tbody>
                            {scanData.rows.map((scan) => (
                              <tr key={scan.id} style={{ borderBottom: "1px solid #131b2e", transition: "background 0.15s" }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#0c1220")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                <td style={{ padding: "6px 8px", color: "#5a6478", fontWeight: 600, fontFamily: "monospace" }}>
                                  {scan.seq}
                                </td>
                                <td style={{ padding: "6px 8px", color: "#e8ecf1", fontFamily: "monospace", fontSize: 10 }}>
                                  {new Date(scan.timestamp).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                </td>
                                <td style={{ padding: "6px 8px" }}>
                                  <button
                                    onClick={() => { setTagFilter(scan.tagId); }}
                                    style={{ background: "none", border: "none", color: "#f5b731", cursor: "pointer", fontSize: 11, fontWeight: 600, padding: 0, textDecoration: "underline" }}
                                    title={`Filtruj po: ${scan.tagName}`}
                                  >
                                    {scan.tagName}
                                  </button>
                                  <span style={{ fontSize: 9, color: "#5a6478", marginLeft: 4 }}>{scan.tagId}</span>
                                </td>
                                <td style={{ padding: "6px 8px" }}>
                                  {scan.nfcId ? (
                                    <button
                                      onClick={() => { setScanNfcFilter(scan.nfcId); fetchScans({ nfcId: scan.nfcId, page: 1 }); }}
                                      style={{ background: "none", border: "none", color: "#a78bfa", cursor: "pointer", fontSize: 10, fontFamily: "monospace", padding: 0, textDecoration: "underline" }}
                                    >
                                      {scan.nfcId}
                                    </button>
                                  ) : (
                                    <span style={{ color: "#2a4060" }}>—</span>
                                  )}
                                </td>
                                <td style={{ padding: "6px 8px", color: "#8b95a8" }}>
                                  <span style={{
                                    padding: "2px 6px", borderRadius: 3, fontSize: 10, fontWeight: 600,
                                    background: scan.deviceType === "iOS" ? "rgba(96,165,250,0.1)" : scan.deviceType === "Android" ? "rgba(16,185,129,0.1)" : "rgba(139,149,168,0.1)",
                                    color: scan.deviceType === "iOS" ? "#60a5fa" : scan.deviceType === "Android" ? "#10b981" : "#8b95a8",
                                  }}>
                                    {scan.deviceType}
                                  </span>
                                </td>
                                <td style={{ padding: "6px 8px", color: "#8b95a8" }}>
                                  {scan.country ? `${getCountryFlag(scan.country)} ${scan.country}` : "—"}
                                </td>
                                <td style={{ padding: "6px 8px", color: "#8b95a8" }}>{scan.city || "—"}</td>
                                <td style={{ padding: "6px 8px", color: "#5a6478", fontSize: 10 }}>{scan.browserLang || "—"}</td>
                                <td style={{ padding: "6px 8px" }}>
                                  {scan.isReturning ? (
                                    <span style={{ color: "#f59e0b", fontSize: 10, fontWeight: 600 }}>Tak</span>
                                  ) : (
                                    <span style={{ color: "#2a4060", fontSize: 10 }}>Nie</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: "1px solid #1e2d45" }}>
                        <span style={{ fontSize: 11, color: "#5a6478" }}>
                          {scanData.total} skanów • strona {scanData.page}/{scanData.totalPages}
                        </span>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            disabled={scanData.page <= 1}
                            onClick={() => { setScanPage(scanData.page - 1); fetchScans({ page: scanData.page - 1 }); }}
                            style={{ background: "#1a253a", border: "1px solid #1e2d45", color: scanData.page <= 1 ? "#2a4060" : "#8b95a8", borderRadius: 6, padding: "5px 12px", fontSize: 11, cursor: scanData.page <= 1 ? "default" : "pointer" }}
                          >
                            ← Poprz.
                          </button>
                          <button
                            disabled={scanData.page >= scanData.totalPages}
                            onClick={() => { setScanPage(scanData.page + 1); fetchScans({ page: scanData.page + 1 }); }}
                            style={{ background: "#1a253a", border: "1px solid #1e2d45", color: scanData.page >= scanData.totalPages ? "#2a4060" : "#8b95a8", borderRadius: 6, padding: "5px 12px", fontSize: 11, cursor: scanData.page >= scanData.totalPages ? "default" : "pointer" }}
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
            {/*  5. TAG MANAGEMENT                                         */}
            {/* ========================================================== */}

            <section style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800 }}>
                    <span className="gradient-text">Akcje</span>
                  </h2>
                  <span
                    style={{
                      background: "#1a253a",
                      color: "#8b95a8",
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 20,
                    }}
                  >
                    {displayTags.length}
                  </span>
                </div>
                {/* Global reset stats */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
                        style={{ background: "#1a253a", border: "1px solid #1e2d45", color: "#8b95a8", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}
                      >
                        Anuluj
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setResetAllConfirm(true)}
                      style={{ background: "transparent", border: "1px solid #1e2d45", color: "#8b95a8", borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "border-color 0.2s, color 0.2s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#f87171"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e2d45"; e.currentTarget.style.color = "#a0a0c0"; }}
                    >
                      Reset wszystkich statystyk
                    </button>
                  )}
                </div>
              </div>

              {/* ---- Create Tag Form ---- */}
              <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "#e8ecf1" }}>
                  Nowa akcja
                </h3>
                <form onSubmit={handleCreateTag}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "#8b95a8", marginBottom: 4, fontWeight: 500 }}>
                        ID akcji
                      </label>
                      <input
                        className="input-field"
                        value={newTagId}
                        onChange={(e) => setNewTagId(e.target.value)}
                        placeholder="np. moja-wizytowka"
                      />
                      {newTagId && (
                        <p style={{ fontSize: 10, color: "#5a6478", marginTop: 4, fontFamily: "monospace" }}>
                          URL: twojenfc.pl/s/{newTagId.toLowerCase().replace(/[^a-z0-9\-_.+]/g, "-")}
                        </p>
                      )}
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "#8b95a8", marginBottom: 4, fontWeight: 500 }}>
                        Nazwa
                      </label>
                      <input
                        className="input-field"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Moja Wizytowka"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "#8b95a8", marginBottom: 4, fontWeight: 500 }}>
                        Typ akcji
                      </label>
                      <select
                        className="input-field"
                        value={newTagType}
                        onChange={(e) => setNewTagType(e.target.value)}
                        style={{ padding: "8px 12px" }}
                      >
                        <option value="url">Przekierowanie URL</option>
                        <option value="video">Video player</option>
                        <option value="multilink">Multi-link</option>
                        <option value="vcard">Wizytowka (vCard)</option>
                        <option value="google-review">Recenzja Google</option>
                      </select>
                    </div>
                    {(newTagType === "url" || newTagType === "google-review") && (
                      <div>
                        <label style={{ display: "block", fontSize: 12, color: "#8b95a8", marginBottom: 4, fontWeight: 500 }}>
                          {newTagType === "google-review" ? "Link do recenzji Google" : "Docelowy URL"}
                        </label>
                        <input
                          className="input-field"
                          value={newTagUrl}
                          onChange={(e) => setNewTagUrl(e.target.value)}
                          placeholder={newTagType === "google-review" ? "https://search.google.com/local/writereview?placeid=..." : "https://example.com"}
                        />
                        {newTagType === "google-review" && (
                          <p style={{ fontSize: 10, color: "#5a6478", marginTop: 4 }}>
                            Wklej link do opinii Google z Google Maps (Place ID lub bezposredni link)
                          </p>
                        )}
                      </div>
                    )}
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "#8b95a8", marginBottom: 4, fontWeight: 500 }}>
                        Klient
                      </label>
                      <select
                        className="input-field"
                        value={newTagClient}
                        onChange={(e) => setNewTagClient(e.target.value)}
                        style={{ padding: "8px 12px" }}
                      >
                        <option value="">-- brak klienta --</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "#8b95a8", marginBottom: 4, fontWeight: 500 }}>
                        Kampania
                      </label>
                      <select
                        className="input-field"
                        value={newTagCampaign}
                        onChange={(e) => setNewTagCampaign(e.target.value)}
                        style={{ padding: "8px 12px" }}
                      >
                        <option value="">-- brak kampanii --</option>
                        {campaigns.filter(c => !newTagClient || c.clientId === newTagClient).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "#8b95a8", marginBottom: 4, fontWeight: 500 }}>
                        Opis (opcjonalnie)
                      </label>
                      <input
                        className="input-field"
                        value={newTagDesc}
                        onChange={(e) => setNewTagDesc(e.target.value)}
                        placeholder="Krotki opis..."
                      />
                    </div>
                  </div>

                  {/* Multilink links editor */}
                  {newTagType === "multilink" && (
                    <div style={{
                      marginBottom: 16,
                      padding: 16,
                      background: "#0f1524",
                      borderRadius: 10,
                      border: "1px solid #1e2d45",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <h4 style={{ fontSize: 13, fontWeight: 600, color: "#e8ecf1" }}>
                          Linki
                        </h4>
                        <button
                          type="button"
                          onClick={() => setNewTagLinks([...newTagLinks, { label: "", url: "", icon: "link" }])}
                          style={{
                            background: "#1a253a",
                            border: "1px solid #1e2d45",
                            color: "#10b981",
                            borderRadius: 6,
                            padding: "4px 12px",
                            fontSize: 12,
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          + Dodaj link
                        </button>
                      </div>
                      {newTagLinks.map((link, idx) => (
                        <div key={idx} style={{
                          display: "flex",
                          gap: 8,
                          marginBottom: 8,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}>
                          <select
                            className="input-field"
                            value={link.icon}
                            onChange={(e) => {
                              const updated = [...newTagLinks];
                              updated[idx] = { ...updated[idx], icon: e.target.value };
                              setNewTagLinks(updated);
                            }}
                            style={{ padding: "6px 8px", width: 130, fontSize: 12 }}
                          >
                            {iconOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <input
                            className="input-field"
                            placeholder="Etykieta"
                            value={link.label}
                            onChange={(e) => {
                              const updated = [...newTagLinks];
                              updated[idx] = { ...updated[idx], label: e.target.value };
                              setNewTagLinks(updated);
                            }}
                            style={{ flex: "1 1 120px", minWidth: 100, fontSize: 12, padding: "6px 10px" }}
                          />
                          <input
                            className="input-field"
                            placeholder="https://..."
                            value={link.url}
                            onChange={(e) => {
                              const updated = [...newTagLinks];
                              updated[idx] = { ...updated[idx], url: e.target.value };
                              setNewTagLinks(updated);
                            }}
                            style={{ flex: "2 1 180px", minWidth: 140, fontSize: 12, padding: "6px 10px" }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = newTagLinks.filter((_, i) => i !== idx);
                              setNewTagLinks(updated.length ? updated : [{ label: "", url: "", icon: "link" }]);
                            }}
                            style={{
                              background: "transparent",
                              border: "1px solid #1e2d45",
                              color: "#5a6478",
                              borderRadius: 6,
                              width: 28,
                              height: 28,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 14,
                              fontWeight: 700,
                              flexShrink: 0,
                              transition: "border-color 0.2s, color 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "#ef4444";
                              e.currentTarget.style.color = "#f87171";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "#1e2d45";
                              e.currentTarget.style.color = "#6060a0";
                            }}
                          >
                            X
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* vCard editor */}
                  {newTagType === "vcard" && (
                    <div style={{
                      marginBottom: 16,
                      padding: 16,
                      background: "#0f1524",
                      borderRadius: 10,
                      border: "1px solid #1e2d45",
                    }}>
                      <h4 style={{ fontSize: 13, fontWeight: 600, color: "#e8ecf1", marginBottom: 12 }}>
                        Dane wizytowki
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>Imie *</label>
                          <input className="input-field" value={newVCard.firstName} onChange={(e) => setNewVCard({ ...newVCard, firstName: e.target.value })} placeholder="Jan" style={{ fontSize: 12, padding: "6px 10px" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>Nazwisko *</label>
                          <input className="input-field" value={newVCard.lastName} onChange={(e) => setNewVCard({ ...newVCard, lastName: e.target.value })} placeholder="Kowalski" style={{ fontSize: 12, padding: "6px 10px" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>Firma</label>
                          <input className="input-field" value={newVCard.company || ""} onChange={(e) => setNewVCard({ ...newVCard, company: e.target.value })} placeholder="Nazwa firmy" style={{ fontSize: 12, padding: "6px 10px" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>Stanowisko</label>
                          <input className="input-field" value={newVCard.jobTitle || ""} onChange={(e) => setNewVCard({ ...newVCard, jobTitle: e.target.value })} placeholder="CEO / Manager" style={{ fontSize: 12, padding: "6px 10px" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>Telefon</label>
                          <input className="input-field" value={newVCard.phone || ""} onChange={(e) => setNewVCard({ ...newVCard, phone: e.target.value })} placeholder="+48 123 456 789" style={{ fontSize: 12, padding: "6px 10px" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>Email</label>
                          <input className="input-field" value={newVCard.email || ""} onChange={(e) => setNewVCard({ ...newVCard, email: e.target.value })} placeholder="jan@firma.pl" style={{ fontSize: 12, padding: "6px 10px" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>Strona WWW</label>
                          <input className="input-field" value={newVCard.website || ""} onChange={(e) => setNewVCard({ ...newVCard, website: e.target.value })} placeholder="https://firma.pl" style={{ fontSize: 12, padding: "6px 10px" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>Adres</label>
                          <input className="input-field" value={newVCard.address || ""} onChange={(e) => setNewVCard({ ...newVCard, address: e.target.value })} placeholder="ul. Przykladowa 1, Warszawa" style={{ fontSize: 12, padding: "6px 10px" }} />
                        </div>
                      </div>
                      <p style={{ fontSize: 11, color: "#5a6478", marginTop: 10, marginBottom: 6, fontWeight: 500 }}>Media spolecznosciowe (opcjonalnie):</p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>Instagram</label>
                          <input className="input-field" value={newVCard.instagram || ""} onChange={(e) => setNewVCard({ ...newVCard, instagram: e.target.value })} placeholder="@profil lub URL" style={{ fontSize: 12, padding: "6px 10px" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>Facebook</label>
                          <input className="input-field" value={newVCard.facebook || ""} onChange={(e) => setNewVCard({ ...newVCard, facebook: e.target.value })} placeholder="Profil lub URL" style={{ fontSize: 12, padding: "6px 10px" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>LinkedIn</label>
                          <input className="input-field" value={newVCard.linkedin || ""} onChange={(e) => setNewVCard({ ...newVCard, linkedin: e.target.value })} placeholder="Profil lub URL" style={{ fontSize: 12, padding: "6px 10px" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>WhatsApp</label>
                          <input className="input-field" value={newVCard.whatsapp || ""} onChange={(e) => setNewVCard({ ...newVCard, whatsapp: e.target.value })} placeholder="+48123456789" style={{ fontSize: 12, padding: "6px 10px" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>TikTok</label>
                          <input className="input-field" value={newVCard.tiktok || ""} onChange={(e) => setNewVCard({ ...newVCard, tiktok: e.target.value })} placeholder="@profil" style={{ fontSize: 12, padding: "6px 10px" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>YouTube</label>
                          <input className="input-field" value={newVCard.youtube || ""} onChange={(e) => setNewVCard({ ...newVCard, youtube: e.target.value })} placeholder="@kanal lub URL" style={{ fontSize: 12, padding: "6px 10px" }} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>Telegram</label>
                          <input className="input-field" value={newVCard.telegram || ""} onChange={(e) => setNewVCard({ ...newVCard, telegram: e.target.value })} placeholder="@profil" style={{ fontSize: 12, padding: "6px 10px" }} />
                        </div>
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>Notatka</label>
                        <input className="input-field" value={newVCard.note || ""} onChange={(e) => setNewVCard({ ...newVCard, note: e.target.value })} placeholder="Dodatkowa informacja..." style={{ fontSize: 12, padding: "6px 10px" }} />
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={tagCreating}
                      style={{ padding: "10px 24px", fontSize: 13 }}
                    >
                      {tagCreating ? "Tworzenie akcji..." : "Utworz akcje"}
                    </button>
                    {tagCreateError && (
                      <span style={{ fontSize: 13, color: "#f87171" }}>{tagCreateError}</span>
                    )}
                    {tagCreateSuccess && (
                      <span style={{ fontSize: 13, color: "#10b981" }}>{tagCreateSuccess}</span>
                    )}
                  </div>
                </form>
              </div>

              {/* ---- Tags List ---- */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {displayTags.length === 0 && (
                  <div className="card" style={{ textAlign: "center", padding: "40px 24px" }}>
                    <p style={{ color: "#5a6478", fontSize: 14 }}>
                      {selectedClientId ? "Brak akcji dla wybranego filtra." : "Brak akcji. Utworz pierwsza akcje powyzej."}
                    </p>
                  </div>
                )}

                {displayTags.map((tag) => (
                  <div key={tag.id} className="card card-hover" style={{ padding: "16px 20px" }}>
                    {editingTagId === tag.id ? (
                      /* ---- Edit Mode ---- */
                      <div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: 10,
                            marginBottom: 12,
                          }}
                        >
                          <div>
                            <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>
                              Nazwa
                            </label>
                            <input
                              className="input-field"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>
                              Typ
                            </label>
                            <select
                              className="input-field"
                              value={editType}
                              onChange={(e) => setEditType(e.target.value)}
                              style={{ padding: "8px 12px" }}
                            >
                              <option value="url">Przekierowanie URL</option>
                              <option value="video">Video player</option>
                              <option value="multilink">Multi-link</option>
                            </select>
                          </div>
                          {(editType === "url" || editType === "google-review") && (
                            <div>
                              <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>
                                {editType === "google-review" ? "Link do recenzji Google" : "Docelowy URL"}
                              </label>
                              <input
                                className="input-field"
                                value={editUrl}
                                onChange={(e) => setEditUrl(e.target.value)}
                                placeholder={editType === "google-review" ? "https://search.google.com/local/writereview?placeid=..." : "https://example.com"}
                              />
                            </div>
                          )}
                          <div>
                            <label style={{ display: "block", fontSize: 11, color: "#8b95a8", marginBottom: 3 }}>
                              Opis
                            </label>
                            <input
                              className="input-field"
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                            />
                          </div>
                        </div>
                        {/* Multilink editor in edit mode */}
                        {editType === "multilink" && (
                          <div style={{
                            marginBottom: 12,
                            padding: 14,
                            background: "#0f1524",
                            borderRadius: 10,
                            border: "1px solid #1e2d45",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                              <h4 style={{ fontSize: 12, fontWeight: 600, color: "#e8ecf1" }}>Linki</h4>
                              <button
                                type="button"
                                onClick={() => setEditTagLinks([...editTagLinks, { label: "", url: "", icon: "link" }])}
                                style={{ background: "#1a253a", border: "1px solid #1e2d45", color: "#10b981", borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                              >
                                + Dodaj link
                              </button>
                            </div>
                            {editTagLinks.map((link, idx) => (
                              <div key={idx} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center", flexWrap: "wrap" }}>
                                <select
                                  className="input-field"
                                  value={link.icon}
                                  onChange={(e) => { const u = [...editTagLinks]; u[idx] = { ...u[idx], icon: e.target.value }; setEditTagLinks(u); }}
                                  style={{ padding: "5px 6px", width: 120, fontSize: 11 }}
                                >
                                  {iconOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                                <input
                                  className="input-field"
                                  placeholder="Etykieta"
                                  value={link.label}
                                  onChange={(e) => { const u = [...editTagLinks]; u[idx] = { ...u[idx], label: e.target.value }; setEditTagLinks(u); }}
                                  style={{ flex: "1 1 100px", minWidth: 80, fontSize: 11, padding: "5px 8px" }}
                                />
                                <input
                                  className="input-field"
                                  placeholder="https://..."
                                  value={link.url}
                                  onChange={(e) => { const u = [...editTagLinks]; u[idx] = { ...u[idx], url: e.target.value }; setEditTagLinks(u); }}
                                  style={{ flex: "2 1 160px", minWidth: 120, fontSize: 11, padding: "5px 8px" }}
                                />
                                <button
                                  type="button"
                                  onClick={() => { const u = editTagLinks.filter((_, i) => i !== idx); setEditTagLinks(u.length ? u : [{ label: "", url: "", icon: "link" }]); }}
                                  style={{ background: "transparent", border: "1px solid #1e2d45", color: "#5a6478", borderRadius: 6, width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}
                                >
                                  X
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {editType === "video" && (
                          <p style={{ fontSize: 11, color: "#5a6478", marginBottom: 12 }}>
                            URL zostanie ustawiony automatycznie na /watch/{tag.id}. Wgraj video po zapisaniu.
                          </p>
                        )}
                        {editType === "vcard" && (
                          <div style={{
                            marginBottom: 12,
                            padding: 14,
                            background: "#0f1524",
                            borderRadius: 10,
                            border: "1px solid #1e2d45",
                          }}>
                            <h4 style={{ fontSize: 12, fontWeight: 600, color: "#e8ecf1", marginBottom: 10 }}>Dane wizytowki</h4>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
                              {[
                                { key: "firstName", label: "Imie" },
                                { key: "lastName", label: "Nazwisko" },
                                { key: "company", label: "Firma" },
                                { key: "jobTitle", label: "Stanowisko" },
                                { key: "phone", label: "Telefon" },
                                { key: "email", label: "Email" },
                                { key: "website", label: "Strona WWW" },
                                { key: "address", label: "Adres" },
                                { key: "instagram", label: "Instagram" },
                                { key: "facebook", label: "Facebook" },
                                { key: "linkedin", label: "LinkedIn" },
                                { key: "whatsapp", label: "WhatsApp" },
                                { key: "tiktok", label: "TikTok" },
                                { key: "youtube", label: "YouTube" },
                                { key: "telegram", label: "Telegram" },
                                { key: "note", label: "Notatka" },
                              ].map(field => (
                                <div key={field.key}>
                                  <label style={{ display: "block", fontSize: 10, color: "#8b95a8", marginBottom: 2 }}>{field.label}</label>
                                  <input
                                    className="input-field"
                                    value={(editVCard as unknown as Record<string, string>)[field.key] || ""}
                                    onChange={(e) => setEditVCard({ ...editVCard, [field.key]: e.target.value })}
                                    style={{ fontSize: 11, padding: "5px 8px" }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="btn-primary"
                            onClick={() => handleSaveEdit(tag.id)}
                            style={{ padding: "7px 18px", fontSize: 12 }}
                          >
                            Zapisz
                          </button>
                          <button
                            onClick={() => setEditingTagId(null)}
                            style={{
                              background: "#1a253a",
                              border: "1px solid #1e2d45",
                              color: "#8b95a8",
                              borderRadius: 8,
                              padding: "7px 18px",
                              fontSize: 12,
                              cursor: "pointer",
                            }}
                          >
                            Anuluj
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* ---- View Mode ---- */
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
                            <span style={{ fontSize: 16, fontWeight: 700, color: "#e8ecf1" }}>
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
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <button
                              onClick={() => handleToggleActive(tag)}
                              title={tag.isActive ? "Dezaktywuj" : "Aktywuj"}
                              style={{
                                width: 44,
                                height: 24,
                                borderRadius: 12,
                                background: tag.isActive ? "#10b981" : "#2a4060",
                                border: "none",
                                cursor: "pointer",
                                position: "relative",
                                transition: "background 0.2s",
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
                            <button
                              onClick={() => startEdit(tag)}
                              style={{ background: "#1a253a", border: "1px solid #1e2d45", color: "#8b95a8", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", transition: "border-color 0.2s" }}
                              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#e69500")}
                              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1e2d45")}
                            >
                              Edytuj
                            </button>
                            {tag.tagType === "video" && (
                              <label
                                style={{ background: "#1a253a", border: "1px solid #1e2d45", color: "#8b95a8", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", transition: "border-color 0.2s", display: "inline-flex", alignItems: "center", gap: 4 }}
                                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#9f67ff")}
                                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1e2d45")}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="23 7 16 12 23 17 23 7" />
                                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                </svg>
                                {uploadingTagId === tag.id ? uploadProgress : (tag.videoFile ? "Podmien video" : "Wgraj video")}
                                <input type="file" accept="video/mp4,video/webm,video/quicktime" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoUpload(tag.id, f); e.target.value = ""; }} />
                              </label>
                            )}
                            {tag.tagType === "video" && tag.videoFile && (
                              <button
                                onClick={() => handleRemoveVideo(tag.id)}
                                title="Usun video"
                                style={{ background: "transparent", border: "1px solid #1e2d45", color: "#5a6478", borderRadius: 6, padding: "6px 10px", fontSize: 11, cursor: "pointer", transition: "border-color 0.2s, color 0.2s" }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#f87171"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e2d45"; e.currentTarget.style.color = "#6060a0"; }}
                              >
                                Usun video
                              </button>
                            )}
                            {resetTagConfirm === tag.id ? (
                              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                <button
                                  onClick={() => handleResetStats(tag.id)}
                                  disabled={resetting}
                                  style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", borderRadius: 6, padding: "6px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                                >
                                  {resetting ? "..." : "Potwierdz"}
                                </button>
                                <button
                                  onClick={() => setResetTagConfirm(null)}
                                  style={{ background: "#1a253a", border: "1px solid #1e2d45", color: "#8b95a8", borderRadius: 6, padding: "6px 8px", fontSize: 11, cursor: "pointer" }}
                                >
                                  Nie
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setResetTagConfirm(tag.id)}
                                title="Resetuj statystyki akcji"
                                style={{ background: "transparent", border: "1px solid #1e2d45", color: "#5a6478", borderRadius: 6, padding: "6px 10px", fontSize: 11, cursor: "pointer", transition: "border-color 0.2s, color 0.2s" }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#f59e0b"; e.currentTarget.style.color = "#fbbf24"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e2d45"; e.currentTarget.style.color = "#6060a0"; }}
                              >
                                Reset stats
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteTag(tag.id)}
                              style={{ background: "transparent", border: "1px solid #1e2d45", color: "#5a6478", borderRadius: 6, padding: "6px 10px", fontSize: 12, cursor: "pointer", transition: "border-color 0.2s, color 0.2s" }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#f87171"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e2d45"; e.currentTarget.style.color = "#6060a0"; }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Bottom row: details */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 12, color: "#8b95a8" }}>
                          <span>
                            <span style={{ color: "#5a6478" }}>ID:</span>{" "}
                            <span style={{ fontFamily: "monospace", color: "#f5b731" }}>{tag.id}</span>
                          </span>
                          <span>
                            <span style={{ color: "#5a6478" }}>Skany:</span>{" "}
                            <span style={{ fontWeight: 600, color: "#e8ecf1" }}>{tag._count.scans}</span>
                          </span>
                          <span>
                            <span style={{ color: "#5a6478" }}>URL:</span>{" "}
                            <a
                              href={`/s/${tag.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#f5b731", fontFamily: "monospace", fontSize: 11, textDecoration: "underline", cursor: "pointer" }}
                            >
                              twojenfc.pl/s/{tag.id}
                            </a>
                          </span>
                          {tag.videoFile && (
                            <span>
                              <span style={{ color: "#5a6478" }}>Video:</span>{" "}
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
                          <p style={{ fontSize: 12, color: "#5a6478", marginTop: 4 }}>
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
                                background: "#0f1524",
                                borderRadius: 8,
                                border: "1px solid #1e2d45",
                              }}>
                                {linkClickStats[tag.id].links.length === 0 ? (
                                  <p style={{ fontSize: 12, color: "#5a6478" }}>Brak klikniec</p>
                                ) : (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    {linkClickStats[tag.id].links.map((lc, idx) => (
                                      <div key={idx} style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "6px 0",
                                        borderBottom: idx < linkClickStats[tag.id].links.length - 1 ? "1px solid #1a253a" : "none",
                                      }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                                          <span style={{ fontSize: 11, color: "#8b95a8", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {lc.linkLabel || lc.linkUrl}
                                          </span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                          <div style={{ width: 60, height: 4, background: "#1a253a", borderRadius: 2, overflow: "hidden" }}>
                                            <div style={{ width: `${lc.percent}%`, height: "100%", background: "linear-gradient(90deg, #60a5fa, #3b82f6)", borderRadius: 2 }} />
                                          </div>
                                          <span style={{ fontSize: 12, fontWeight: 700, color: "#e8ecf1", minWidth: 24, textAlign: "right" }}>{lc.clicks}</span>
                                          <span style={{ fontSize: 10, color: "#5a6478", minWidth: 28, textAlign: "right" }}>{lc.percent}%</span>
                                        </div>
                                      </div>
                                    ))}
                                    <div style={{ fontSize: 11, color: "#5a6478", marginTop: 4, paddingTop: 6, borderTop: "1px solid #1a253a" }}>
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
                                background: "#0f1524",
                                borderRadius: 8,
                                border: "1px solid #1e2d45",
                              }}>
                                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ fontSize: 18, fontWeight: 800, color: "#10b981" }}>{videoStats[tag.id].plays}</span>
                                    <span style={{ fontSize: 11, color: "#8b95a8" }}>odtworzen</span>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ fontSize: 18, fontWeight: 800, color: "#60a5fa" }}>{videoStats[tag.id].completions}</span>
                                    <span style={{ fontSize: 11, color: "#8b95a8" }}>do konca</span>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ fontSize: 18, fontWeight: 800, color: "#f5b731" }}>{formatWatchTime(videoStats[tag.id].avgWatchTime)}</span>
                                    <span style={{ fontSize: 11, color: "#8b95a8" }}>sred. czas</span>
                                  </div>
                                  {videoStats[tag.id].plays > 0 && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                      <span style={{ fontSize: 18, fontWeight: 800, color: "#f59e0b" }}>
                                        {Math.round((videoStats[tag.id].completions / videoStats[tag.id].plays) * 100)}%
                                      </span>
                                      <span style={{ fontSize: 11, color: "#8b95a8" }}>completion rate</span>
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
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

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
                background: "linear-gradient(90deg, #e69500, #10b981)",
              }}
            />
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: "#e8ecf1" }}>
              Zmiana hasla
            </h2>
            <p style={{ fontSize: 13, color: "#8b95a8", marginBottom: 20 }}>
              Ze wzgledow bezpieczenstwa musisz ustawic nowe haslo przy pierwszym logowaniu.
            </p>

            <form onSubmit={handlePasswordChange}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, color: "#8b95a8", marginBottom: 4, fontWeight: 500 }}>
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
                <label style={{ display: "block", fontSize: 12, color: "#8b95a8", marginBottom: 4, fontWeight: 500 }}>
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
    </div>
  );
}
