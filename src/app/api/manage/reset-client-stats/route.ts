import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { clientId } = body;

  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { tags: { select: { id: true } } },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const tagIds = client.tags.map(t => t.id);

  if (tagIds.length === 0) {
    return NextResponse.json({ ok: true, deletedScans: 0, deletedClicks: 0, deletedVideoEvents: 0, clientName: client.name });
  }

  const [deletedScans, deletedClicks, deletedVideoEvents] = await Promise.all([
    prisma.scan.deleteMany({ where: { tagId: { in: tagIds } } }),
    prisma.linkClick.deleteMany({ where: { tagId: { in: tagIds } } }),
    prisma.videoEvent.deleteMany({ where: { tagId: { in: tagIds } } }),
  ]);

  return NextResponse.json({
    ok: true,
    deletedScans: deletedScans.count,
    deletedClicks: deletedClicks.count,
    deletedVideoEvents: deletedVideoEvents.count,
    clientName: client.name,
    tagsAffected: tagIds.length,
  });
}
