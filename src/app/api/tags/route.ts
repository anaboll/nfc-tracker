import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET all tags
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tags = await prisma.tag.findMany({
    include: {
      _count: { select: { scans: true } },
      client: { select: { id: true, name: true, slug: true, color: true } },
      campaign: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tags);
}

// POST create new tag
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, name, targetUrl, description, tagType, links, clientId, campaignId } = body;

  if (!id || !name) {
    return NextResponse.json({ error: "ID i nazwa akcji sa wymagane" }, { status: 400 });
  }

  // B1: clientId is mandatory
  if (!clientId) {
    return NextResponse.json({ error: "Wybor klienta jest wymagany przed utworzeniem akcji" }, { status: 400 });
  }

  // Verify client exists
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.json({ error: "Wybrany klient nie istnieje" }, { status: 404 });
  }

  // B2: if campaignId provided, it must belong to the same client
  if (campaignId) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      return NextResponse.json({ error: "Wybrana kampania nie istnieje" }, { status: 404 });
    }
    if (campaign.clientId !== clientId) {
      return NextResponse.json(
        { error: "Kampania nie nalezy do wybranego klienta. Wybierz kampanie z tej samej firmy." },
        { status: 400 }
      );
    }
  }

  const type = tagType || "url";

  // Auto-set targetUrl based on type
  const cleanId = id.toLowerCase().replace(/[^a-z0-9\-_.+]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  let finalUrl = targetUrl || "";
  if (type === "video") finalUrl = `/watch/${cleanId}`;
  if (type === "multilink") finalUrl = `/link/${cleanId}`;
  if (type === "vcard") finalUrl = `/vcard/${cleanId}`;
  if ((type === "url" || type === "google-review") && !finalUrl) {
    return NextResponse.json({ error: "targetUrl wymagane dla tego typu" }, { status: 400 });
  }

  const existing = await prisma.tag.findUnique({ where: { id: cleanId } });
  if (existing) {
    return NextResponse.json({ error: "Tag o tym ID juz istnieje" }, { status: 409 });
  }

  const tag = await prisma.tag.create({
    data: {
      id: cleanId,
      name,
      tagType: type,
      targetUrl: finalUrl,
      description: description || null,
      links: (type === "multilink" || type === "vcard") && links ? links : undefined,
      clientId,
      ...(campaignId ? { campaignId } : {}),
    },
  });

  return NextResponse.json(tag, { status: 201 });
}

// PUT update tag
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, name, targetUrl, description, isActive, videoFile, tagType, links, clientId, campaignId } = body;

  if (!id) return NextResponse.json({ error: "id wymagane" }, { status: 400 });

  // B2: if campaignId is being set, verify it belongs to the resolved client
  if (campaignId !== undefined && campaignId !== null) {
    const existingTag = await prisma.tag.findUnique({ where: { id } });
    if (!existingTag) return NextResponse.json({ error: "Tag nie istnieje" }, { status: 404 });

    const resolvedClientId = clientId !== undefined ? (clientId || null) : existingTag.clientId;

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      return NextResponse.json({ error: "Wybrana kampania nie istnieje" }, { status: 404 });
    }
    if (resolvedClientId && campaign.clientId !== resolvedClientId) {
      return NextResponse.json(
        { error: "Kampania nie nalezy do klienta tej akcji. Zmiana zablokowana." },
        { status: 400 }
      );
    }
  }

  const tag = await prisma.tag.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(targetUrl !== undefined && { targetUrl }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive }),
      ...(videoFile !== undefined && { videoFile }),
      ...(tagType !== undefined && { tagType }),
      ...(links !== undefined && { links }),
      ...(clientId !== undefined && { clientId: clientId || null }),
      ...(campaignId !== undefined && { campaignId: campaignId || null }),
    },
  });

  return NextResponse.json(tag);
}

// DELETE tag
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id wymagane" }, { status: 400 });

  // Delete related records first
  await Promise.all([
    prisma.scan.deleteMany({ where: { tagId: id } }),
    prisma.linkClick.deleteMany({ where: { tagId: id } }),
    prisma.videoEvent.deleteMany({ where: { tagId: id } }),
  ]);
  await prisma.tag.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
