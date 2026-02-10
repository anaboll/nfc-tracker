"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
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
  returningPercent: number;
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
  percent: number;
}

interface Country {
  country: string;
  count: number;
  percent: number;
}

interface City {
  city: string;
  country: string;
  count: number;
}

interface Language {
  lang: string;
  count: number;
  percent: number;
}

interface WeekDay {
  day: string;
  date: string;
  count: number;
}

interface WeeklyTrend {
  data: WeekDay[];
  weekStart: string;
  weekEnd: string;
}

interface StatsData {
  kpi: KPI;
  devices: Devices;
  topTags: TopTag[];
  topCountries: Country[];
  topCities: City[];
  topLanguages: Language[];
  weeklyTrend: WeeklyTrend;
  allTags: { id: string; name: string }[];
}

interface TagFull {
  id: string;
  name: string;
  targetUrl: string;
  description: string | null;
  videoFile: string | null;
  isActive: boolean;
  _count: { scans: number };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DashboardWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f0f1a" }}>
        <p style={{ color: "#a0a0c0" }}>Ladowanie panelu...</p>
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);

  // change‑password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  // create tag
  const [newTagId, setNewTagId] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [newTagUrl, setNewTagUrl] = useState("");
  const [newTagDesc, setNewTagDesc] = useState("");
  const [tagCreating, setTagCreating] = useState(false);
  const [tagCreateError, setTagCreateError] = useState("");
  const [tagCreateSuccess, setTagCreateSuccess] = useState("");

  // editing
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // upload
  const [uploadingTagId, setUploadingTagId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState("");

  /* ---- fetch helpers ---- */

  const fetchStats = useCallback(async (opts?: { wo?: number }) => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      if (tagFilter) params.set("tag", tagFilter);
      params.set("weekOffset", String(opts?.wo ?? weekOffset));
      const res = await fetch(`/api/stats?${params.toString()}`);
      if (res.ok) {
        const data: StatsData = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Stats fetch failed:", e);
    }
  }, [dateFrom, dateTo, tagFilter, weekOffset]);

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

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchTags()]);
    setLoading(false);
  }, [fetchStats, fetchTags]);

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

  /* ---- handlers ---- */

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchTags()]);
    setRefreshing(false);
  };

  const handleFilter = async () => {
    setLoading(true);
    await fetchStats();
    setLoading(false);
  };

  const handleResetFilters = async () => {
    setDateFrom("");
    setDateTo("");
    setTagFilter("");
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

  /* tag CRUD */
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setTagCreateError("");
    setTagCreateSuccess("");
    if (!newTagId || !newTagName || !newTagUrl) {
      setTagCreateError("ID, nazwa i docelowy URL sa wymagane");
      return;
    }
    setTagCreating(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newTagId,
          name: newTagName,
          targetUrl: newTagUrl,
          description: newTagDesc || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setTagCreateError(data.error || "Blad tworzenia tagu");
      } else {
        setTagCreateSuccess("Tag utworzony pomyslnie!");
        setNewTagId("");
        setNewTagName("");
        setNewTagUrl("");
        setNewTagDesc("");
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
    if (!confirm(`Czy na pewno chcesz usunac tag "${id}" i wszystkie jego skany?`)) return;
    try {
      await fetch(`/api/tags?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await fetchTags();
      await fetchStats();
    } catch { /* ignore */ }
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await fetch("/api/tags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: editName,
          targetUrl: editUrl,
          description: editDesc,
        }),
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
          background: "#0f0f1a",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              border: "3px solid #2a2a4a",
              borderTopColor: "#7c3aed",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#a0a0c0" }}>Ladowanie...</p>
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

  const kpi = stats?.kpi;
  const devices = stats?.devices;
  const topTags = stats?.topTags ?? [];
  const topCountries = stats?.topCountries ?? [];
  const topCities = stats?.topCities ?? [];
  const topLanguages = stats?.topLanguages ?? [];
  const weekly = stats?.weeklyTrend;
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
    <div style={{ minHeight: "100vh", background: "#0f0f1a" }}>
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
          background: "rgba(15,15,26,0.85)",
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
                background: "linear-gradient(135deg, #7c3aed, #10b981)",
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
                background: "#1e1e3a",
                border: "1px solid #2a2a4a",
                color: "#f0f0ff",
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
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#7c3aed")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2a4a")}
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
                border: "1px solid #2a2a4a",
                color: "#a0a0c0",
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
                e.currentTarget.style.borderColor = "#2a2a4a";
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
            <label style={{ fontSize: 12, color: "#a0a0c0", fontWeight: 500 }}>
              Od
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{ minWidth: 150 }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "#a0a0c0", fontWeight: 500 }}>
              Do
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{ minWidth: 150 }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "#a0a0c0", fontWeight: 500 }}>
              Tag
            </label>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="input-field"
              style={{ minWidth: 180, padding: "8px 12px" }}
            >
              <option value="">Wszystkie tagi</option>
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
                background: "#252547",
                border: "1px solid #2a2a4a",
                color: "#a0a0c0",
                borderRadius: 10,
                padding: "9px 20px",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#7c3aed")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2a4a")}
            >
              Resetuj
            </button>
          </div>
        </section>

        {/* ---- Loading overlay ---- */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "3px solid #2a2a4a",
                borderTopColor: "#7c3aed",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 12px",
              }}
            />
            <p style={{ color: "#a0a0c0", fontSize: 14 }}>Ladowanie danych...</p>
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
                    background: "rgba(124,58,237,0.08)",
                  }}
                />
                <p style={{ fontSize: 12, color: "#a0a0c0", fontWeight: 500, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                  Wszystkie skany
                </p>
                <p style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1 }} className="gradient-text">
                  {kpi?.totalScans.toLocaleString("pl-PL") ?? "0"}
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
                    background: "rgba(16,185,129,0.08)",
                  }}
                />
                <p style={{ fontSize: 12, color: "#a0a0c0", fontWeight: 500, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                  Unikalni uzytkownicy
                </p>
                <p style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1 }} className="gradient-text">
                  {kpi?.uniqueUsers.toLocaleString("pl-PL") ?? "0"}
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
                    background: "rgba(124,58,237,0.08)",
                  }}
                />
                <p style={{ fontSize: 12, color: "#a0a0c0", fontWeight: 500, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                  Ostatni skan
                </p>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#f0f0ff" }}>
                  {formatDate(kpi?.lastScan ?? null)}
                </p>
              </div>

              {/* Returning % */}
              <div className="card card-hover" style={{ position: "relative", overflow: "hidden" }}>
                <div
                  style={{
                    position: "absolute",
                    top: -20,
                    right: -20,
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "rgba(16,185,129,0.08)",
                  }}
                />
                <p style={{ fontSize: 12, color: "#a0a0c0", fontWeight: 500, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                  Powracajacy
                </p>
                <p style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1, color: "#10b981" }}>
                  {kpi?.returningPercent ?? 0}%
                </p>
              </div>
            </section>

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
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "#f0f0ff" }}>
                  Urzadzenia
                </h3>

                {[
                  { label: "iOS", value: devices?.iOS ?? 0, percent: iosPercent, color: "#7c3aed" },
                  { label: "Android", value: devices?.Android ?? 0, percent: androidPercent, color: "#10b981" },
                  { label: "Desktop", value: devices?.Desktop ?? 0, percent: desktopPercent, color: "#9f67ff" },
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
                      <span style={{ color: "#f0f0ff", fontWeight: 500 }}>{d.label}</span>
                      <span style={{ color: "#a0a0c0" }}>
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
                  <span style={{ fontSize: 12, color: "#6060a0" }}>
                    Razem: {devices?.total.toLocaleString("pl-PL") ?? 0}
                  </span>
                </div>
              </div>

              {/* Top Tags */}
              <div className="card">
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "#f0f0ff" }}>
                  Najczesciej skanowane tagi
                </h3>
                {topTags.length === 0 && (
                  <p style={{ color: "#6060a0", fontSize: 14 }}>Brak danych</p>
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
                          background: "linear-gradient(135deg, #7c3aed, #10b981)",
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
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#f0f0ff" }}>
                          {t.tagName}
                        </p>
                        <p style={{ fontSize: 11, color: "#6060a0" }}>{t.tagId}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#f0f0ff" }}>
                        {t.count}
                      </p>
                      <p style={{ fontSize: 11, color: "#a0a0c0" }}>{t.percent}%</p>
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
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "#f0f0ff" }}>
                  Kraje
                </h3>
                {topCountries.length === 0 && (
                  <p style={{ color: "#6060a0", fontSize: 14 }}>Brak danych</p>
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
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#f0f0ff" }}>
                        {c.country}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#f0f0ff" }}>
                        {c.count}
                      </span>
                      <span style={{ fontSize: 12, color: "#a0a0c0", marginLeft: 6 }}>
                        ({c.percent}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cities */}
              <div className="card">
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "#f0f0ff" }}>
                  Miasta
                </h3>
                {topCities.length === 0 && (
                  <p style={{ color: "#6060a0", fontSize: 14 }}>Brak danych</p>
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
                      <p style={{ fontSize: 14, fontWeight: 500, color: "#f0f0ff" }}>
                        {c.city}
                      </p>
                      <p style={{ fontSize: 11, color: "#6060a0" }}>{c.country}</p>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#f0f0ff" }}>
                      {c.count}
                    </span>
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
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f0f0ff" }}>
                    Trend tygodniowy
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => handleWeekChange(-1)}
                      style={{
                        background: "#252547",
                        border: "1px solid #2a2a4a",
                        color: "#a0a0c0",
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
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#7c3aed")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2a4a")}
                    >
                      &#8249;
                    </button>
                    <span style={{ fontSize: 12, color: "#a0a0c0", minWidth: 100, textAlign: "center" }}>
                      {weekly
                        ? formatWeekRange(weekly.weekStart, weekly.weekEnd)
                        : "---"}
                    </span>
                    <button
                      onClick={() => handleWeekChange(1)}
                      disabled={weekOffset >= 0}
                      style={{
                        background: "#252547",
                        border: "1px solid #2a2a4a",
                        color: weekOffset >= 0 ? "#3a3a5a" : "#a0a0c0",
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
                        if (weekOffset < 0) e.currentTarget.style.borderColor = "#7c3aed";
                      }}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2a4a")}
                    >
                      &#8250;
                    </button>
                  </div>
                </div>

                {/* Bar chart */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 8,
                    height: 180,
                    paddingTop: 8,
                  }}
                >
                  {weekly?.data.map((d) => {
                    const barH = maxWeeklyCount > 0 ? (d.count / maxWeeklyCount) * 160 : 0;
                    return (
                      <div
                        key={d.date}
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: d.count > 0 ? "#f0f0ff" : "#6060a0",
                          }}
                        >
                          {d.count}
                        </span>
                        <div
                          style={{
                            width: "100%",
                            maxWidth: 48,
                            height: Math.max(barH, 4),
                            borderRadius: "6px 6px 2px 2px",
                            background:
                              d.count > 0
                                ? "linear-gradient(180deg, #7c3aed, #10b981)"
                                : "#252547",
                            transition: "height 0.4s ease",
                          }}
                        />
                        <span style={{ fontSize: 11, color: "#a0a0c0", fontWeight: 500 }}>
                          {d.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Languages */}
              <div className="card">
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "#f0f0ff" }}>
                  Jezyki przegladarek
                </h3>
                {topLanguages.length === 0 && (
                  <p style={{ color: "#6060a0", fontSize: 14 }}>Brak danych</p>
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
                          background: "#252547",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#9f67ff",
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
                      <span style={{ fontSize: 13, color: "#a0a0c0", minWidth: 50, textAlign: "right" }}>
                        {l.count} ({l.percent}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ========================================================== */}
            {/*  5. TAG MANAGEMENT                                         */}
            {/* ========================================================== */}

            <section style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800 }}>
                  <span className="gradient-text">Zarzadzanie tagami</span>
                </h2>
                <span
                  style={{
                    background: "#252547",
                    color: "#a0a0c0",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 20,
                  }}
                >
                  {tags.length}
                </span>
              </div>

              {/* ---- Create Tag Form ---- */}
              <div className="card" style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "#f0f0ff" }}>
                  Utworz nowy tag
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
                      <label style={{ display: "block", fontSize: 12, color: "#a0a0c0", marginBottom: 4, fontWeight: 500 }}>
                        ID tagu
                      </label>
                      <input
                        className="input-field"
                        value={newTagId}
                        onChange={(e) => setNewTagId(e.target.value)}
                        placeholder="np. moja-wizytowka"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "#a0a0c0", marginBottom: 4, fontWeight: 500 }}>
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
                      <label style={{ display: "block", fontSize: 12, color: "#a0a0c0", marginBottom: 4, fontWeight: 500 }}>
                        Docelowy URL
                      </label>
                      <input
                        className="input-field"
                        value={newTagUrl}
                        onChange={(e) => setNewTagUrl(e.target.value)}
                        placeholder="https://example.com"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "#a0a0c0", marginBottom: 4, fontWeight: 500 }}>
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
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={tagCreating}
                      style={{ padding: "10px 24px", fontSize: 13 }}
                    >
                      {tagCreating ? "Tworzenie..." : "Utworz tag"}
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
                {tags.length === 0 && (
                  <div className="card" style={{ textAlign: "center", padding: "40px 24px" }}>
                    <p style={{ color: "#6060a0", fontSize: 14 }}>
                      Brak tagow. Utworz pierwszy tag powyzej.
                    </p>
                  </div>
                )}

                {tags.map((tag) => (
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
                            <label style={{ display: "block", fontSize: 11, color: "#a0a0c0", marginBottom: 3 }}>
                              Nazwa
                            </label>
                            <input
                              className="input-field"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: 11, color: "#a0a0c0", marginBottom: 3 }}>
                              Docelowy URL
                            </label>
                            <input
                              className="input-field"
                              value={editUrl}
                              onChange={(e) => setEditUrl(e.target.value)}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: 11, color: "#a0a0c0", marginBottom: 3 }}>
                              Opis
                            </label>
                            <input
                              className="input-field"
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                            />
                          </div>
                        </div>
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
                              background: "#252547",
                              border: "1px solid #2a2a4a",
                              color: "#a0a0c0",
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
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 12,
                        }}
                      >
                        {/* Left info */}
                        <div style={{ flex: "1 1 300px", minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                            <span style={{ fontSize: 16, fontWeight: 700, color: "#f0f0ff" }}>
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
                            {tag.videoFile && (
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 600,
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                  background: "rgba(124,58,237,0.15)",
                                  color: "#9f67ff",
                                }}
                              >
                                Video
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 12, color: "#a0a0c0" }}>
                            <span>
                              <span style={{ color: "#6060a0" }}>ID:</span>{" "}
                              <span style={{ fontFamily: "monospace", color: "#9f67ff" }}>{tag.id}</span>
                            </span>
                            <span>
                              <span style={{ color: "#6060a0" }}>Skany:</span>{" "}
                              <span style={{ fontWeight: 600, color: "#f0f0ff" }}>{tag._count.scans}</span>
                            </span>
                            <span>
                              <span style={{ color: "#6060a0" }}>URL:</span>{" "}
                              <span
                                style={{
                                  color: "#9f67ff",
                                  fontFamily: "monospace",
                                  fontSize: 11,
                                }}
                              >
                                TwojeNFC.pl/s/{tag.id}
                              </span>
                            </span>
                          </div>
                          {tag.description && (
                            <p style={{ fontSize: 12, color: "#6060a0", marginTop: 4 }}>
                              {tag.description}
                            </p>
                          )}
                        </div>

                        {/* Right actions */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          {/* Toggle active */}
                          <button
                            onClick={() => handleToggleActive(tag)}
                            title={tag.isActive ? "Dezaktywuj" : "Aktywuj"}
                            style={{
                              width: 44,
                              height: 24,
                              borderRadius: 12,
                              background: tag.isActive ? "#10b981" : "#3a3a5a",
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

                          {/* Edit */}
                          <button
                            onClick={() => startEdit(tag)}
                            style={{
                              background: "#252547",
                              border: "1px solid #2a2a4a",
                              color: "#a0a0c0",
                              borderRadius: 6,
                              padding: "6px 12px",
                              fontSize: 12,
                              cursor: "pointer",
                              transition: "border-color 0.2s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#7c3aed")}
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2a4a")}
                          >
                            Edytuj
                          </button>

                          {/* Upload video */}
                          <label
                            style={{
                              background: "#252547",
                              border: "1px solid #2a2a4a",
                              color: "#a0a0c0",
                              borderRadius: 6,
                              padding: "6px 12px",
                              fontSize: 12,
                              cursor: "pointer",
                              transition: "border-color 0.2s",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#9f67ff")}
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2a2a4a")}
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polygon points="23 7 16 12 23 17 23 7" />
                              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                            </svg>
                            {uploadingTagId === tag.id ? uploadProgress : "Video"}
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime"
                              style={{ display: "none" }}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleVideoUpload(tag.id, f);
                                e.target.value = "";
                              }}
                            />
                          </label>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteTag(tag.id)}
                            style={{
                              background: "transparent",
                              border: "1px solid #2a2a4a",
                              color: "#6060a0",
                              borderRadius: 6,
                              padding: "6px 10px",
                              fontSize: 12,
                              cursor: "pointer",
                              transition: "border-color 0.2s, color 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "#ef4444";
                              e.currentTarget.style.color = "#f87171";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "#2a2a4a";
                              e.currentTarget.style.color = "#6060a0";
                            }}
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </button>
                        </div>
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
                background: "linear-gradient(90deg, #7c3aed, #10b981)",
              }}
            />
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: "#f0f0ff" }}>
              Zmiana hasla
            </h2>
            <p style={{ fontSize: 13, color: "#a0a0c0", marginBottom: 20 }}>
              Ze wzgledow bezpieczenstwa musisz ustawic nowe haslo przy pierwszym logowaniu.
            </p>

            <form onSubmit={handlePasswordChange}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, color: "#a0a0c0", marginBottom: 4, fontWeight: 500 }}>
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
                <label style={{ display: "block", fontSize: 12, color: "#a0a0c0", marginBottom: 4, fontWeight: 500 }}>
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
