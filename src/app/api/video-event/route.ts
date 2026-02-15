import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashIp, extractIp } from "@/lib/utils";
import {
  collectTelemetry,
  applyTelemetryCookies,
  telemetryFields,
} from "@/lib/telemetry";

// POST - record a video event (public endpoint, no auth required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tagId, event, watchTime } = body;

    if (!tagId || !event) {
      return NextResponse.json({ error: "tagId and event required" }, { status: 400 });
    }

    const validEvents = ["play", "pause", "ended", "progress_25", "progress_50", "progress_75", "progress_100"];
    if (!validEvents.includes(event)) {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
    }

    // --- Telemetry ---
    const { data: tele, setCookies } = collectTelemetry(request);

    // Legacy IP hash
    const headers = request.headers;
    const rawIp = extractIp(
      headers.get("x-forwarded-for"),
      headers.get("x-real-ip"),
      headers.get("cf-connecting-ip")
    );
    const ipHash = hashIp(rawIp);

    try {
      await prisma.videoEvent.create({
        data: {
          tagId,
          event,
          ipHash,
          watchTime: watchTime != null ? Number(watchTime) : null,
          // P0 telemetry
          userAgent: tele.userAgent,
          deviceType: tele.deviceType,
          referrer: tele.referrer,
          ...telemetryFields(tele),
        },
      });
    } catch {
      // Fallback without telemetry fields if columns don't exist yet
      await prisma.videoEvent.create({
        data: {
          tagId,
          event,
          ipHash,
          watchTime: watchTime != null ? Number(watchTime) : null,
        },
      });
    }

    const response = NextResponse.json({ ok: true });
    applyTelemetryCookies(response, setCookies);
    return response;
  } catch (error) {
    console.error("VideoEvent record error:", error);
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 });
  }
}

// GET - get video event stats for a tag (protected via middleware)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const tagId = url.searchParams.get("tagId");

    if (!tagId) {
      return NextResponse.json({ error: "tagId required" }, { status: 400 });
    }

    const events = await prisma.videoEvent.groupBy({
      by: ["event"],
      where: { tagId },
      _count: { id: true },
    });

    const eventsMap: Record<string, number> = {};
    events.forEach((e) => {
      eventsMap[e.event] = e._count.id;
    });

    // Average watch time from "ended" and "pause" events
    const avgWatch = await prisma.videoEvent.aggregate({
      where: { tagId, watchTime: { not: null } },
      _avg: { watchTime: true },
      _max: { watchTime: true },
    });

    return NextResponse.json({
      tagId,
      plays: eventsMap["play"] || 0,
      pauses: eventsMap["pause"] || 0,
      completions: eventsMap["ended"] || 0,
      progress25: eventsMap["progress_25"] || 0,
      progress50: eventsMap["progress_50"] || 0,
      progress75: eventsMap["progress_75"] || 0,
      progress100: eventsMap["progress_100"] || 0,
      avgWatchTime: avgWatch._avg.watchTime ? Math.round(avgWatch._avg.watchTime) : null,
      maxWatchTime: avgWatch._max.watchTime ? Math.round(avgWatch._max.watchTime) : null,
    });
  } catch (error) {
    console.error("VideoEvent stats error:", error);
    return NextResponse.json({ error: "Failed to get video stats" }, { status: 500 });
  }
}
