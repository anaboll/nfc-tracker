import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { clientId } = body;

  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      campaigns: { select: { id: true, name: true } },
      tags: { select: { id: true } },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const tagIds = client.tags.map(t => t.id);
  const campaignIds = client.campaigns.map(c => c.id);

  // Cascade delete in transaction: scans → clicks → events → tags → campaigns → client
  const result = await prisma.$transaction(async (tx) => {
    let deletedScans = 0;
    let deletedClicks = 0;
    let deletedVideoEvents = 0;

    if (tagIds.length > 0) {
      const [scans, clicks, events] = await Promise.all([
        tx.scan.deleteMany({ where: { tagId: { in: tagIds } } }),
        tx.linkClick.deleteMany({ where: { tagId: { in: tagIds } } }),
        tx.videoEvent.deleteMany({ where: { tagId: { in: tagIds } } }),
      ]);
      deletedScans = scans.count;
      deletedClicks = clicks.count;
      deletedVideoEvents = events.count;
    }

    const deletedTags = await tx.tag.deleteMany({ where: { clientId } });
    const deletedCampaigns = await tx.campaign.deleteMany({ where: { clientId } });
    await tx.client.delete({ where: { id: clientId } });

    return {
      deletedScans,
      deletedClicks,
      deletedVideoEvents,
      deletedTags: deletedTags.count,
      deletedCampaigns: deletedCampaigns.count,
      clientName: client.name,
    };
  });

  return NextResponse.json({ ok: true, ...result });
}

// Preview: get counts before deleting
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
    include: {
      campaigns: { select: { id: true, name: true } },
      tags: { select: { id: true, name: true } },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const tagIds = client.tags.map(t => t.id);

  const [scanCount, clickCount, eventCount] = tagIds.length > 0
    ? await Promise.all([
        prisma.scan.count({ where: { tagId: { in: tagIds } } }),
        prisma.linkClick.count({ where: { tagId: { in: tagIds } } }),
        prisma.videoEvent.count({ where: { tagId: { in: tagIds } } }),
      ])
    : [0, 0, 0];

  return NextResponse.json({
    clientName: client.name,
    campaignsCount: client.campaigns.length,
    campaignNames: client.campaigns.map(c => c.name),
    tagsCount: tagIds.length,
    tagNames: client.tags.map(t => t.name),
    scanCount,
    clickCount,
    eventCount,
  });
}
