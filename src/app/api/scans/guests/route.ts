import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET top guests aggregated by ipHash, respecting current filters
export async function GET(request: NextRequest) {
  try {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const tagFilter = url.searchParams.get("tagId") || null;
  const tagsParam = url.searchParams.get("tags");
  const tagIdsFilter: string[] | null = tagsParam ? tagsParam.split(",").filter(Boolean) : null;
  const clientFilter = url.searchParams.get("clientId") || null;
  const campaignFilter = url.searchParams.get("campaignId") || null;
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);

  // Build where clause (same logic as /api/scans)
  const where: Record<string, unknown> = {};

  if (fromParam || toParam) {
    const ts: Record<string, Date> = {};
    if (fromParam) ts.gte = new Date(fromParam);
    if (toParam) {
      const to = new Date(toParam);
      if (!toParam.includes("T")) to.setHours(23, 59, 59, 999);
      ts.lte = to;
    }
    where.timestamp = ts;
  }

  if (tagIdsFilter && tagIdsFilter.length > 0) {
    where.tagId = tagIdsFilter.length === 1 ? tagIdsFilter[0] : { in: tagIdsFilter };
  } else if (tagFilter) {
    where.tagId = tagFilter;
  } else if (campaignFilter) {
    const campaignTags = await prisma.tag.findMany({
      where: { campaignId: campaignFilter },
      select: { id: true },
    });
    where.tagId = { in: campaignTags.map((t) => t.id) };
  } else if (clientFilter) {
    const clientTags = await prisma.tag.findMany({
      where: { clientId: clientFilter },
      select: { id: true },
    });
    where.tagId = { in: clientTags.map((t) => t.id) };
  }

  // Only scans where ipHash is known (Prisma: string filter excludes nulls automatically via isSet check in JS)
  // We filter out null ipHash in the aggregation loop below

  // Fetch all matching scans (select only what we need for aggregation)
  const scans = await prisma.scan.findMany({
    where,
    select: {
      ipHash: true,
      tagId: true,
      timestamp: true,
      deviceType: true,
      city: true,
      country: true,
      eventSource: true,
      nfcId: true,
    },
    orderBy: { timestamp: "desc" },
    take: 5000,
  });

  // Aggregate by ipHash
  const guestMap = new Map<string, {
    ipHash: string;
    guestKey: string;
    scanCount: number;
    uniqueTagIds: Set<string>;
    lastSeen: string;
    deviceType: string;
    city: string | null;
    country: string | null;
    sources: Set<string>;
  }>();

  for (const scan of scans) {
    if (!scan.ipHash) continue;
    const existing = guestMap.get(scan.ipHash);
    const source = scan.eventSource === "qr" ? "qr" : scan.nfcId ? "nfc" : "unknown";
    if (!existing) {
      guestMap.set(scan.ipHash, {
        ipHash: scan.ipHash,
        guestKey: scan.ipHash.slice(0, 7),
        scanCount: 1,
        uniqueTagIds: new Set([scan.tagId]),
        lastSeen: new Date(scan.timestamp).toISOString(),
        deviceType: scan.deviceType,
        city: scan.city,
        country: scan.country,
        sources: new Set([source]),
      });
    } else {
      existing.scanCount++;
      existing.uniqueTagIds.add(scan.tagId);
      existing.sources.add(source);
      // lastSeen is already the most recent (scans ordered desc)
    }
  }

  // Sort by scanCount desc, take top N
  const guests = Array.from(guestMap.values())
    .sort((a, b) => b.scanCount - a.scanCount || b.uniqueTagIds.size - a.uniqueTagIds.size)
    .slice(0, limit)
    .map((g, idx) => ({
      rank: idx + 1,
      ipHash: g.ipHash,
      guestKey: g.guestKey,
      scanCount: g.scanCount,
      uniqueActions: g.uniqueTagIds.size,
      lastSeen: g.lastSeen,
      deviceType: g.deviceType,
      city: g.city,
      country: g.country,
      source: g.sources.has("qr") && g.sources.has("nfc") ? "mixed"
        : g.sources.has("qr") ? "qr"
        : g.sources.has("nfc") ? "nfc"
        : "unknown",
    }));

  return NextResponse.json({ guests, total: guestMap.size });
  } catch (e) {
    console.error("[/api/scans/guests] error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

