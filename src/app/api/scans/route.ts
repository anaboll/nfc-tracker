import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET raw scan data with pagination, sorting, filtering
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
  const sortBy = url.searchParams.get("sortBy") || "timestamp";
  const sortDir = url.searchParams.get("sortDir") === "asc" ? "asc" : "desc";
  const tagFilter = url.searchParams.get("tagId") || null;
  const clientFilter = url.searchParams.get("clientId") || null;
  const campaignFilter = url.searchParams.get("campaignId") || null;
  const nfcFilter = url.searchParams.get("nfcId") || null;
  const sourceFilter = url.searchParams.get("source") || null;
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  // Build where clause
  const where: Record<string, unknown> = {};

  if (fromParam || toParam) {
    const ts: Record<string, Date> = {};
    if (fromParam) ts.gte = new Date(fromParam);
    if (toParam) {
      const to = new Date(toParam);
      // Only set to end-of-day if no time was specified
      if (!toParam.includes("T")) {
        to.setHours(23, 59, 59, 999);
      }
      ts.lte = to;
    }
    where.timestamp = ts;
  }

  if (tagFilter) {
    where.tagId = tagFilter;
  } else if (campaignFilter) {
    const campaignTags = await prisma.tag.findMany({
      where: { campaignId: campaignFilter },
      select: { id: true },
    });
    where.tagId = { in: campaignTags.map(t => t.id) };
  } else if (clientFilter) {
    const clientTags = await prisma.tag.findMany({
      where: { clientId: clientFilter },
      select: { id: true },
    });
    where.tagId = { in: clientTags.map(t => t.id) };
  }

  if (nfcFilter) {
    where.nfcId = nfcFilter;
  }

  // source filter: QR = eventSource="qr", NFC = eventSource != "qr" (includes null)
  if (sourceFilter === "qr") {
    where.eventSource = "qr";
  } else if (sourceFilter === "nfc") {
    where.eventSource = { not: "qr" };
  }

  // Build orderBy
  const validSortFields = ["timestamp", "tagId", "deviceType", "country", "city", "nfcId"];
  const orderField = validSortFields.includes(sortBy) ? sortBy : "timestamp";
  const orderBy = { [orderField]: sortDir };

  const [scans, total] = await Promise.all([
    prisma.scan.findMany({
      where,
      include: {
        tag: {
          select: { id: true, name: true, tagType: true, clientId: true, campaignId: true },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.scan.count({ where }),
  ]);

  // Assign sequential numbers (global position)
  const offset = (page - 1) * limit;

  const rows = scans.map((scan, idx) => ({
    seq: sortDir === "desc" ? total - offset - idx : offset + idx + 1,
    id: scan.id,
    tagId: scan.tagId,
    tagName: scan.tag.name,
    tagType: scan.tag.tagType,
    timestamp: scan.timestamp,
    nfcId: scan.nfcId,
    deviceType: scan.deviceType,
    country: scan.country,
    city: scan.city,
    region: scan.region,
    browserLang: scan.browserLang,
    isReturning: scan.isReturning,
    eventSource: scan.eventSource,
  }));

  return NextResponse.json({
    rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
