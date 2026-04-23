import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import os from "os";

/**
 * Aggregated status of BOTH replicas (app1 + app2) + host-level info.
 *
 * Called by /dashboard/status. Admin-only.
 *
 * Flow: whichever replica nginx routes the request to, THIS endpoint calls
 *   http://app1:3000/api/health + http://app2:3000/api/health in parallel
 * (docker compose default bridge network resolves service names to container IPs).
 *
 * If a replica is being redeployed or crashed, its fetch fails; we mark it
 * `reachable: false` and include the error. Dashboard shows red dot for that
 * replica but keeps running.
 *
 * version_mismatch = true means the two replicas are serving DIFFERENT commits
 * (expected briefly during a rolling deploy; if it persists, deploy failed).
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Replicas are addressed by docker compose service name on the default bridge
// network. Container port is always 3000 (host maps it to 3001/3002 but that
// mapping doesn't apply inside the docker network).
//
// Override for local dev via env var, e.g. in .env.local:
//   REPLICA_TARGETS="app1=localhost:3001,app2=localhost:3002"
function parseReplicas(): Array<{ id: string; host: string; port: number }> {
  const raw = process.env.REPLICA_TARGETS;
  if (raw) {
    return raw.split(",").map((entry) => {
      const [id, hostPort] = entry.split("=");
      const [host, port] = hostPort.split(":");
      return { id: id.trim(), host: host.trim(), port: parseInt(port, 10) || 3000 };
    });
  }
  return [
    { id: "app1", host: "app1", port: 3000 },
    { id: "app2", host: "app2", port: 3000 },
  ];
}
const REPLICAS = parseReplicas();
const TIMEOUT_MS = 2500;

type HealthResponse = {
  ok?: boolean;
  replica_id?: string;
  pid?: number;
  uptime_sec?: number;
  timestamp?: string;
  build?: { commit?: string; branch?: string; time?: string };
  memory_mb?: { rss?: number; heap_used?: number; heap_total?: number };
  load_avg?: { "1m"?: number; "5m"?: number; "15m"?: number };
};

type ReplicaStatus = {
  id: string;
  host: string;
  reachable: boolean;
  error?: string;
  data?: HealthResponse;
  latency_ms: number;
};

async function fetchHealth(host: string, port: number): Promise<{ data?: HealthResponse; latency_ms: number; error?: string }> {
  const start = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`http://${host}:${port}/api/health`, {
      signal: ctrl.signal,
      cache: "no-store",
    });
    const latency_ms = Date.now() - start;
    if (!res.ok) {
      return { latency_ms, error: `HTTP ${res.status}` };
    }
    const data = (await res.json()) as HealthResponse;
    return { data, latency_ms };
  } catch (e) {
    const latency_ms = Date.now() - start;
    const msg = e instanceof Error ? e.message : String(e);
    return { latency_ms, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  // Admin-only. Regular viewers can't see server internals.
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const results: ReplicaStatus[] = await Promise.all(
    REPLICAS.map(async (r) => {
      const { data, latency_ms, error } = await fetchHealth(r.host, r.port);
      return {
        id: r.id,
        host: r.host,
        reachable: !error,
        error,
        data,
        latency_ms,
      };
    })
  );

  // Version mismatch = replicas report different commits. Expected mid-deploy.
  // If it persists >1 min after deploy, one replica failed to roll.
  const reachableBuilds = results
    .filter((r) => r.reachable && r.data?.build?.commit)
    .map((r) => r.data!.build!.commit!);
  const uniqueCommits = new Set(reachableBuilds);
  const versionMismatch = uniqueCommits.size > 1;

  // Host-level info (shared between both replicas, reported once).
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const host = {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    hostname: os.hostname(),
    os_uptime_sec: Math.round(os.uptime()),
    total_mem_mb: Math.round(totalMem / 1024 / 1024),
    free_mem_mb: Math.round(freeMem / 1024 / 1024),
    used_mem_pct: Math.round(((totalMem - freeMem) / totalMem) * 100),
  };

  return NextResponse.json(
    {
      timestamp: new Date().toISOString(),
      version_mismatch: versionMismatch,
      host,
      replicas: results,
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    }
  );
}
