import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserAccess } from "@/lib/user-access";

// GET all campaigns (optionally filtered by clientId)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getUserAccess();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const clientId = url.searchParams.get("clientId");

  const where: Record<string, unknown> = clientId ? { clientId } : {};
  if (!access.isAdmin && access.allowedClientIds) {
    where.clientId = clientId
      ? (access.allowedClientIds.includes(clientId) ? clientId : "__none__")
      : { in: access.allowedClientIds };
  }

  const campaigns = await prisma.campaign.findMany({
    where,
    include: {
      _count: { select: { tags: true } },
      client: { select: { id: true, name: true, slug: true, color: true } },
    },
    orderBy: { name: "asc" },
  });

  // Enrich with total scan count per campaign
  const enriched = await Promise.all(
    campaigns.map(async (campaign) => {
      const tagIds = await prisma.tag.findMany({
        where: { campaignId: campaign.id },
        select: { id: true },
      });
      const ids = tagIds.map((t) => t.id);
      const scanCount = ids.length > 0
        ? await prisma.scan.count({ where: { tagId: { in: ids } } })
        : 0;
      return {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        clientId: campaign.clientId,
        client: campaign.client,
        isActive: campaign.isActive,
        createdAt: campaign.createdAt,
        tagCount: campaign._count.tags,
        scanCount,
      };
    })
  );

  return NextResponse.json(enriched);
}

// POST create new campaign (admin only)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const access = await getUserAccess();
  if (!access?.isAdmin) return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });

  const body = await request.json();
  const { name, description, clientId } = body;

  if (!name || !clientId) {
    return NextResponse.json({ error: "Nazwa kampanii i klient sa wymagane" }, { status: 400 });
  }

  // Verify client exists
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.json({ error: "Klient nie istnieje" }, { status: 404 });
  }

  const campaign = await prisma.campaign.create({
    data: {
      name,
      description: description || null,
      clientId,
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}

// PUT update campaign (admin only)
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const access = await getUserAccess();
  if (!access?.isAdmin) return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });

  const body = await request.json();
  const { id, name, description, isActive } = body;

  if (!id) return NextResponse.json({ error: "id wymagane" }, { status: 400 });

  const campaign = await prisma.campaign.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json(campaign);
}

// DELETE campaign (admin only)
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const access = await getUserAccess();
  if (!access?.isAdmin) return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id wymagane" }, { status: 400 });

  // Unlink tags from campaign (don't delete them)
  await prisma.tag.updateMany({
    where: { campaignId: id },
    data: { campaignId: null },
  });

  await prisma.campaign.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
