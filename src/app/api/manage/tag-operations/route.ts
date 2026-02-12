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

  // B2: if assigning to a campaign, always enforce client consistency
  if (newCampaignId) {
    const campaign = await prisma.campaign.findUnique({ where: { id: newCampaignId } });
    if (!campaign) {
      return NextResponse.json({ error: "Wybrana kampania nie istnieje" }, { status: 404 });
    }
    // Block if tag has a client and campaign belongs to a different client
    if (tag.clientId && campaign.clientId !== tag.clientId) {
      return NextResponse.json(
        { error: "Nie mozna przenosic akcji do kampanii innego klienta. Zmiana zablokowana." },
        { status: 400 }
      );
    }
    // Block if tag has no client but campaign has one — would silently mis-assign
    if (!tag.clientId && campaign.clientId) {
      return NextResponse.json(
        { error: "Akcja nie ma przypisanego klienta. Najpierw przypisz klienta do akcji." },
        { status: 400 }
      );
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

  // B1: cloned tag must have a client
  const resolvedClientId = targetClientId || null;
  if (!resolvedClientId) {
    return NextResponse.json(
      { error: "Wybor klienta docelowego jest wymagany przy klonowaniu akcji" },
      { status: 400 }
    );
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

  // B2: validate target campaign belongs to target client
  if (targetCampaignId) {
    const campaign = await prisma.campaign.findUnique({ where: { id: targetCampaignId } });
    if (!campaign) {
      return NextResponse.json({ error: "Wybrana kampania docelowa nie istnieje" }, { status: 404 });
    }
    if (campaign.clientId !== resolvedClientId) {
      return NextResponse.json(
        { error: "Kampania docelowa nie nalezy do wybranego klienta. Zmiana zablokowana." },
        { status: 400 }
      );
    }
  }

  // Verify target client exists
  const targetClient = await prisma.client.findUnique({ where: { id: resolvedClientId } });
  if (!targetClient) {
    return NextResponse.json({ error: "Docelowy klient nie istnieje" }, { status: 404 });
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
      clientId: resolvedClientId,
      campaignId: targetCampaignId || null,
    },
  });

  return NextResponse.json({ ok: true, clonedTag: { id: cloned.id, name: cloned.name, clientId: cloned.clientId, campaignId: cloned.campaignId } });
}
