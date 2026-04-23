import { NextResponse } from "next/server";
import os from "os";

/**
 * Lightweight healthcheck + self-report endpoint.
 *
 * Purpose 1 — Docker HEALTHCHECK: just needs a 200 to know the Node process
 * is up. Does NOT touch the database so transient Postgres blips don't cause
 * container restarts.
 *
 * Purpose 2 — /dashboard/status aggregator: reports build metadata + memory
 * + load so the admin dashboard can show which branch/commit each replica
 * is running, how much RAM each uses, etc. All values are read from the
 * running process itself (cheap: ~1ms).
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const mem = process.memoryUsage();
  const loadAvg = os.loadavg(); // [1min, 5min, 15min]

  return NextResponse.json(
    {
      ok: true,
      replica_id: process.env.REPLICA_ID || "unknown",
      pid: process.pid,
      uptime_sec: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      /* Build metadata (baked in by Dockerfile ARGs during rolling-deploy.sh) */
      build: {
        commit: process.env.BUILD_COMMIT || "unknown",
        branch: process.env.BUILD_BRANCH || "unknown",
        time: process.env.BUILD_TIME || "unknown",
      },
      /* Process memory footprint — rss is total, heapUsed is the live JS heap */
      memory_mb: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heap_used: Math.round(mem.heapUsed / 1024 / 1024),
        heap_total: Math.round(mem.heapTotal / 1024 / 1024),
      },
      /* System-level load (visible from inside the container — reflects host load) */
      load_avg: {
        "1m": Number(loadAvg[0].toFixed(2)),
        "5m": Number(loadAvg[1].toFixed(2)),
        "15m": Number(loadAvg[2].toFixed(2)),
      },
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    }
  );
}
