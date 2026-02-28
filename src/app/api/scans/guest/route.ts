import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET all scans for a specific guest (by ipHash), with full filter support
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const ipHash = url.searchParams.get("ipHash");

  if (!ipHash) {
    return NextResponse.json({ error: "ipHash is required" }, { status: 400 });
  }

  // Parse optional filters (same as other scan APIs)
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");
  const sourceParam = url.searchParams.get("source");
  const tagFilter = url.searchParams.get("tagId") || null;
  const tagsParam = url.searchParams.get("tags");
  const tagIdsFilter: string[] | null = tagsParam ? tagsParam.split(",").filter(Boolean) : null;
  const clientFilter = url.searchParams.get("clientId") || null;
  const campaignFilter = url.searchParams.get("campaignId") || null;

  // Build where clause
  const where: Record<string, unknown> = { ipHash };

  // Date range
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

  // Source filter
  if (sourceParam === "nfc") {
    where.eventSource = "nfc";
  } else if (sourceParam === "qr") {
    where.eventSource = "qr";
  }

  // Tag filters
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

  const scans = await prisma.scan.findMany({
    where,
    include: {
      tag: {
        select: { id: true, name: true, tagType: true },
      },
    },
    orderBy: { timestamp: "desc" },
    take: 100,
  });

  const rows = scans.map((scan) => ({
    id: scan.id,
    tagId: scan.tagId,
    tagName: scan.tag.name,
    tagType: scan.tag.tagType,
    timestamp: scan.timestamp,
    nfcId: scan.nfcId,
    deviceType: scan.deviceType,
    country: scan.country,
    city: scan.city,
    browserLang: scan.browserLang,
    isReturning: scan.isReturning,
    eventSource: scan.eventSource,
    guestKey: scan.ipHash ? scan.ipHash.slice(0, 7) : null,
  }));

  return NextResponse.json({ rows, total: rows.length });
}
