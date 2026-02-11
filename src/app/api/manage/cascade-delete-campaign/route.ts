import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { campaignId } = body;

  if (!campaignId) {
    return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
  }

  // Get campaign info first
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { tags: { select: { id: true } } },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const tagIds = campaign.tags.map(t => t.id);

  // Cascade delete in transaction: scans → linkClicks → videoEvents → tags → campaign
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

    const deletedTags = await tx.tag.deleteMany({ where: { campaignId } });
    await tx.campaign.delete({ where: { id: campaignId } });

    return {
      deletedScans,
      deletedClicks,
      deletedVideoEvents,
      deletedTags: deletedTags.count,
      campaignName: campaign.name,
    };
  });

  return NextResponse.json({ ok: true, ...result });
}

// Preview: get counts before deleting
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { campaignId } = body;

  if (!campaignId) {
    return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { tags: { select: { id: true, name: true } } },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const tagIds = campaign.tags.map(t => t.id);

  const [scanCount, clickCount, eventCount] = tagIds.length > 0
    ? await Promise.all([
        prisma.scan.count({ where: { tagId: { in: tagIds } } }),
        prisma.linkClick.count({ where: { tagId: { in: tagIds } } }),
        prisma.videoEvent.count({ where: { tagId: { in: tagIds } } }),
      ])
    : [0, 0, 0];

  return NextResponse.json({
    campaignName: campaign.name,
    tagsCount: tagIds.length,
    tagNames: campaign.tags.map(t => t.name),
    scanCount,
    clickCount,
    eventCount,
  });
}
