"use client";

/* ------------------------------------------------------------------ */
/*  StatusPage — live server health dashboard for admins.             */
/*                                                                     */
/*  Polls /api/server-status every 5s. Shows:                         */
/*   - alert banner if replicas serve different commits                */
/*   - per-replica card: green/red dot, build info, uptime, memory    */
/*   - host-level stats: CPU, RAM, OS uptime                          */
/*                                                                     */
/*  Mobile-friendly layout: single column on phone, 2 cols on tablet+ */
/* ------------------------------------------------------------------ */

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

type HealthData = {
  ok?: boolean;
  replica_id?: string;
  pid?: number;
  uptime_sec?: number;
  timestamp?: string;
  build?: { commit?: string; branch?: string; time?: string };
  memory_mb?: { rss?: number; heap_used?: number; heap_total?: number };
  load_avg?: { "1m"?: number; "5m"?: number; "15m"?: number };
};

type Replica = {
  id: string;
  host: string;
  reachable: boolean;
  error?: string;
  data?: HealthData;
  latency_ms: number;
};

type HostInfo = {
  platform: string;
  arch: string;
  cpus: number;
  hostname: string;
  os_uptime_sec: number;
  total_mem_mb: number;
  free_mem_mb: number;
  used_mem_pct: number;
};

type ServerStatus = {
  timestamp: string;
  version_mismatch: boolean;
  host: HostInfo;
  replicas: Replica[];
};

const POLL_INTERVAL_MS = 5000;

function formatUptime(sec: number | undefined): string {
  if (!sec && sec !== 0) return "?";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m ${sec % 60}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

function shortCommit(c: string | undefined): string {
  if (!c || c === "unknown") return "unknown";
  return c.slice(0, 7);
}

export default function StatusPage() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastFetchAt, setLastFetchAt] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/server-status", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ServerStatus;
      setStatus(data);
      setError(null);
      setLastFetchAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling loop
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!autoRefresh) return;
    timerRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefresh, fetchStatus]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--txt)" }}>
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "color-mix(in srgb, var(--bg) 88%, transparent)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 1px 0 var(--border)",
          padding: "12px 16px",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/dashboard"
              style={{
                color: "var(--txt-sec)",
                textDecoration: "none",
                fontSize: 13,
                padding: "6px 10px",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
            >
              &larr; Panel
            </Link>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
              Status serwera
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--txt-sec)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto 5s
            </label>
            <button
              onClick={fetchStatus}
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--txt)",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Odśwież
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--txt-sec)",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Wyloguj
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px 64px" }}>
        {loading && !status && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--txt-sec)" }}>Ładowanie...</div>
        )}

        {error && (
          <div
            style={{
              background: "color-mix(in srgb, var(--error) 15%, transparent)",
              border: "1px solid var(--error)",
              color: "var(--error)",
              padding: "10px 14px",
              borderRadius: 10,
              marginBottom: 16,
              fontSize: 13,
            }}
          >
            Błąd pobierania statusu: {error}
          </div>
        )}

        {status && (
          <>
            {/* Version mismatch alert */}
            {status.version_mismatch && (
              <div
                style={{
                  background: "color-mix(in srgb, #f59e0b 15%, transparent)",
                  border: "1px solid #f59e0b",
                  color: "#f59e0b",
                  padding: "10px 14px",
                  borderRadius: 10,
                  marginBottom: 16,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                ⚠ Repliki serwują różne wersje. Trwa rolling deploy lub jedna z replik nie zrolowała się poprawnie.
              </div>
            )}

            {/* Replicas */}
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--txt-sec)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
              Repliki
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 12,
                marginBottom: 24,
              }}
            >
              {status.replicas.map((r) => (
                <ReplicaCard key={r.id} replica={r} />
              ))}
            </div>

            {/* Host info */}
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--txt-sec)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
              Host (VPS)
            </h2>
            <HostCard host={status.host} />

            {/* Last refresh */}
            <div style={{ marginTop: 20, fontSize: 12, color: "var(--txt-sec)", textAlign: "center" }}>
              Ostatnie odświeżenie: {lastFetchAt ? lastFetchAt.toLocaleTimeString() : "—"} · Serwer: {new Date(status.timestamp).toLocaleTimeString()}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Replica card                                                      */
/* ------------------------------------------------------------------ */

function ReplicaCard({ replica }: { replica: Replica }) {
  const healthy = replica.reachable && replica.data?.ok;
  const dotColor = healthy ? "#22c55e" : "#ef4444";
  const statusLabel = healthy ? "ONLINE" : "OFFLINE";

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: dotColor,
              boxShadow: `0 0 8px ${dotColor}`,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 16, fontWeight: 600 }}>{replica.id}</span>
          <span style={{ fontSize: 11, fontWeight: 500, color: dotColor, letterSpacing: "0.05em" }}>
            {statusLabel}
          </span>
        </div>
        <span style={{ fontSize: 11, color: "var(--txt-sec)" }}>{replica.latency_ms}ms</span>
      </div>

      {!healthy && replica.error && (
        <div style={{ fontSize: 12, color: "var(--error)" }}>Błąd: {replica.error}</div>
      )}

      {healthy && replica.data && (
        <>
          <Row k="Branch" v={replica.data.build?.branch || "?"} />
          <Row k="Commit" v={shortCommit(replica.data.build?.commit)} mono />
          <Row k="Build" v={replica.data.build?.time || "?"} mono small />
          <Row k="Uptime" v={formatUptime(replica.data.uptime_sec)} />
          <Row
            k="RAM"
            v={`${replica.data.memory_mb?.rss ?? "?"} MB rss · ${replica.data.memory_mb?.heap_used ?? "?"}/${replica.data.memory_mb?.heap_total ?? "?"} MB heap`}
          />
          <Row
            k="Load"
            v={`${replica.data.load_avg?.["1m"] ?? "?"} / ${replica.data.load_avg?.["5m"] ?? "?"} / ${replica.data.load_avg?.["15m"] ?? "?"}`}
            small
          />
          <Row k="PID" v={String(replica.data.pid ?? "?")} small />
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Host card                                                          */
/* ------------------------------------------------------------------ */

function HostCard({ host }: { host: HostInfo }) {
  const memBarPct = Math.min(100, Math.max(0, host.used_mem_pct));
  const memBarColor = memBarPct > 85 ? "#ef4444" : memBarPct > 70 ? "#f59e0b" : "#22c55e";

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <Row k="Hostname" v={host.hostname} mono small />
      <Row k="OS" v={`${host.platform} ${host.arch}`} />
      <Row k="CPU" v={`${host.cpus} rdzeni`} />
      <Row k="Uptime OS" v={formatUptime(host.os_uptime_sec)} />

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--txt-sec)" }}>
          <span>RAM</span>
          <span>
            {host.total_mem_mb - host.free_mem_mb} / {host.total_mem_mb} MB ({memBarPct}%)
          </span>
        </div>
        <div
          style={{
            width: "100%",
            height: 8,
            background: "color-mix(in srgb, var(--border) 60%, transparent)",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${memBarPct}%`,
              height: "100%",
              background: memBarColor,
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small row util                                                     */
/* ------------------------------------------------------------------ */

function Row({ k, v, mono, small }: { k: string; v: string; mono?: boolean; small?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
      <span style={{ fontSize: small ? 11 : 12, color: "var(--txt-sec)" }}>{k}</span>
      <span
        style={{
          fontSize: small ? 11 : 13,
          fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace" : undefined,
          color: "var(--txt)",
          textAlign: "right",
          wordBreak: "break-all",
        }}
      >
        {v}
      </span>
    </div>
  );
}
