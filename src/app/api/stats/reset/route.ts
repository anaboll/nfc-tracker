import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { tagId } = body;

  if (tagId) {
    // Reset stats for specific tag
    const [deletedScans, deletedClicks, deletedVideoEvents] = await Promise.all([
      prisma.scan.deleteMany({ where: { tagId } }),
      prisma.linkClick.deleteMany({ where: { tagId } }),
      prisma.videoEvent.deleteMany({ where: { tagId } }),
    ]);
    return NextResponse.json({ ok: true, deletedScans: deletedScans.count, deletedClicks: deletedClicks.count, deletedVideoEvents: deletedVideoEvents.count, scope: tagId });
  } else {
    // Reset ALL stats
    const [deletedScans, deletedClicks, deletedVideoEvents] = await Promise.all([
      prisma.scan.deleteMany(),
      prisma.linkClick.deleteMany(),
      prisma.videoEvent.deleteMany(),
    ]);
    return NextResponse.json({ ok: true, deletedScans: deletedScans.count, deletedClicks: deletedClicks.count, deletedVideoEvents: deletedVideoEvents.count, scope: "all" });
  }
}
