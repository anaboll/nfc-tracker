import { NextResponse } from "next/server";

/**
 * Lightweight healthcheck endpoint for Docker HEALTHCHECK + nginx upstream probes.
 *
 * Intentionally does NOT touch the database — we want to know the Next.js process
 * is up and serving requests, NOT whether Postgres happens to be healthy right now.
 * A short Postgres blip (restart, migration) shouldn't cause Docker to kill-and-restart
 * the app replica.
 *
 * Returns 200 {ok: true, pid, uptime} so deploy scripts can also verify this is a
 * fresh process (pid changes after restart).
 */
export const dynamic = "force-dynamic"; // don't cache
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      pid: process.pid,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    }
  );
}
