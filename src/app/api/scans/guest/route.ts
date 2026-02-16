import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET all scans for a specific guest (by ipHash)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const ipHash = url.searchParams.get("ipHash");

  if (!ipHash) {
    return NextResponse.json({ error: "ipHash is required" }, { status: 400 });
  }

  const scans = await prisma.scan.findMany({
    where: { ipHash },
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
