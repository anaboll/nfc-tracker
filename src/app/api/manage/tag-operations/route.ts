import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT: Reassign tag to a different campaign (within same client)
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { tagId, newCampaignId } = body;

  if (!tagId) {
    return NextResponse.json({ error: "tagId is required" }, { status: 400 });
  }

  const tag = await prisma.tag.findUnique({ where: { id: tagId } });
  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  // If newCampaignId is provided, verify it belongs to the same client
  if (newCampaignId) {
    const campaign = await prisma.campaign.findUnique({ where: { id: newCampaignId } });
    if (!campaign) {
      return NextResponse.json({ error: "Target campaign not found" }, { status: 404 });
    }
    if (tag.clientId && campaign.clientId !== tag.clientId) {
      return NextResponse.json({ error: "Cannot move tag to a campaign of a different client" }, { status: 400 });
    }
  }

  const updated = await prisma.tag.update({
    where: { id: tagId },
    data: { campaignId: newCampaignId || null },
  });

  return NextResponse.json({ ok: true, tag: { id: updated.id, name: updated.name, campaignId: updated.campaignId } });
}

// POST: Clone tag to another client/campaign (config only, no scan data)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { sourceTagId, newId, targetClientId, targetCampaignId } = body;

  if (!sourceTagId || !newId) {
    return NextResponse.json({ error: "sourceTagId and newId are required" }, { status: 400 });
  }

  // Validate new ID format
  const sanitized = newId.toLowerCase().replace(/[^a-z0-9\-_.+]/g, "");
  if (sanitized !== newId) {
    return NextResponse.json({ error: "Invalid tag ID. Use only lowercase letters, numbers, hyphens, dots, underscores, plus signs." }, { status: 400 });
  }

  // Check uniqueness
  const existing = await prisma.tag.findUnique({ where: { id: newId } });
  if (existing) {
    return NextResponse.json({ error: `Tag ID "${newId}" already exists` }, { status: 409 });
  }

  // Get source tag
  const source = await prisma.tag.findUnique({ where: { id: sourceTagId } });
  if (!source) {
    return NextResponse.json({ error: "Source tag not found" }, { status: 404 });
  }

  // Validate target campaign belongs to target client
  if (targetCampaignId) {
    const campaign = await prisma.campaign.findUnique({ where: { id: targetCampaignId } });
    if (!campaign) {
      return NextResponse.json({ error: "Target campaign not found" }, { status: 404 });
    }
    if (targetClientId && campaign.clientId !== targetClientId) {
      return NextResponse.json({ error: "Target campaign does not belong to target client" }, { status: 400 });
    }
  }

  // Clone: copy config, no scan data
  const cloned = await prisma.tag.create({
    data: {
      id: newId,
      name: source.name + " (kopia)",
      tagType: source.tagType,
      targetUrl: source.targetUrl,
      description: source.description,
      videoFile: source.videoFile,
      links: source.links ?? undefined,
      isActive: true,
      clientId: targetClientId || source.clientId,
      campaignId: targetCampaignId || null,
    },
  });

  return NextResponse.json({ ok: true, clonedTag: { id: cloned.id, name: cloned.name, clientId: cloned.clientId, campaignId: cloned.campaignId } });
}
