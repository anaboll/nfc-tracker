import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeDeleteVideoFile } from "@/lib/video-utils";
import { getUserAccess } from "@/lib/user-access";
import { isValidSlug } from "@/lib/slugify";

// GET all tags
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getUserAccess();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where = access.isAdmin ? {} : { clientId: { in: access.allowedClientIds || [] } };

  const tags = await prisma.tag.findMany({
    where,
    include: {
      _count: { select: { scans: true } },
      client: { select: { id: true, name: true, slug: true, color: true } },
      campaign: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tags);
}

// POST create new tag (admin only)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const access = await getUserAccess();
  if (!access?.isAdmin) return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });

  const body = await request.json();
  const { id, name, targetUrl, description, tagType, links, clientId, campaignId } = body;

  if (!id || !name) {
    return NextResponse.json({ error: "ID i nazwa akcji sa wymagane" }, { status: 400 });
  }

  // B1: clientId is mandatory
  if (!clientId) {
    return NextResponse.json({ error: "Wybor klienta jest wymagany przed utworzeniem akcji" }, { status: 400 });
  }

  // B1b: campaignId is mandatory
  if (!campaignId) {
    return NextResponse.json({ error: "Wybor kampanii jest wymagany przed utworzeniem akcji" }, { status: 400 });
  }

  // Verify client exists
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.json({ error: "Wybrany klient nie istnieje" }, { status: 404 });
  }

  // B2: campaignId must belong to the same client
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

// PUT update tag (admin only)
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const access = await getUserAccess();
  if (!access?.isAdmin) return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });

  const body = await request.json();
  const { id, newId, name, targetUrl, description, isActive, videoFile, tagType, links, clientId, campaignId } = body;

  if (!id) return NextResponse.json({ error: "id wymagane" }, { status: 400 });

  /* ------------------------------------------------------------------ */
  /*  Obsluga zmiany URL/slug (newId) — opcjonalna                       */
  /*                                                                     */
  /*  Gdy user na froncie odblokowal pole URL + potwierdzil warning,    */
  /*  przesyla `newId` rozne od `id`. Renameujemy primary key + CASCADE  */
  /*  na FK (Scan/LinkClick/VideoEvent) ma juz `ON UPDATE CASCADE` wiec  */
  /*  historia skanow zostaje zachowana. Jedynym ryzykiem sa fizyczne    */
  /*  NFC tagi/QR kody ktore admin rozdal z poprzednim slug-iem —       */
  /*  te stracie i trzeba zeby klient tego byl swiadomy (frontend        */
  /*  wymusza checkbox przed wyslaniem).                                */
  /* ------------------------------------------------------------------ */
  let effectiveId = id;   // pod ta kolumna beda wszystkie dalsze update'y
  if (typeof newId === "string" && newId.trim() && newId !== id) {
    const desired = newId.trim();
    if (!isValidSlug(desired)) {
      return NextResponse.json(
        { error: "Nieprawidlowy URL. Dozwolone: male litery, cyfry, kropka, mysnik (min. 2 znaki)." },
        { status: 400 }
      );
    }
    const existing = await prisma.tag.findUnique({ where: { id: desired }, select: { id: true } });
    if (existing) {
      return NextResponse.json(
        { error: `URL "${desired}" jest juz zajety przez inna akcje.` },
        { status: 409 }
      );
    }
    /* Rename primary key. Prisma wykonuje UPDATE na kolumnie id, CASCADE
     * robi reszte. Oddzielny update zeby nie miesac z main update'em     * ponizej — w razie blednego rename'u, main update sie nie wykona.    */
    await prisma.tag.update({ where: { id }, data: { id: desired } });
    effectiveId = desired;
  }

  // B2: if campaignId is being set, verify it belongs to the resolved client
  if (campaignId !== undefined && campaignId !== null) {
    const existingTag = await prisma.tag.findUnique({ where: { id: effectiveId } });
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

  // Video lifecycle: if caller is explicitly clearing videoFile (null), capture the old
  // path before the update so we can delete it from disk afterward.
  let oldVideoFile: string | null = null;
  if (videoFile === null) {
    const current = await prisma.tag.findUnique({ where: { id: effectiveId }, select: { videoFile: true } });
    oldVideoFile = current?.videoFile ?? null;
  }

  const tag = await prisma.tag.update({
    where: { id: effectiveId },
    data: {
      ...(name !== undefined && { name }),
      ...(targetUrl !== undefined && { targetUrl }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive }),
      ...(videoFile !== undefined && { videoFile: videoFile ?? null }),
      ...(tagType !== undefined && { tagType }),
      ...(links !== undefined && { links }),
      ...(clientId !== undefined && { clientId: clientId || null }),
      ...(campaignId !== undefined && { campaignId: campaignId || null }),
    },
  });

  // Delete old file from disk only after DB is updated (DB is source of truth).
  // safeDeleteVideoFile re-checks refCount so it only deletes if no tag references it.
  if (videoFile === null && oldVideoFile) {
    await safeDeleteVideoFile(oldVideoFile);
  }

  return NextResponse.json(tag);
}

// DELETE tag (admin only)
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const access = await getUserAccess();
  if (!access?.isAdmin) return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id wymagane" }, { status: 400 });

  // Capture videoFile before deleting the row — needed for disk cleanup below.
  const tag = await prisma.tag.findUnique({ where: { id }, select: { videoFile: true } });
  const videoFileToDelete = tag?.videoFile ?? null;

  // Delete related records first
  await Promise.all([
    prisma.scan.deleteMany({ where: { tagId: id } }),
    prisma.linkClick.deleteMany({ where: { tagId: id } }),
    prisma.videoEvent.deleteMany({ where: { tagId: id } }),
  ]);
  await prisma.tag.delete({ where: { id } });

  // Now the DB row is gone, safeDeleteVideoFile's refCount check will return 0
  // (unless another tag shares the same file), so the file is safe to remove.
  if (videoFileToDelete) {
    await safeDeleteVideoFile(videoFileToDelete);
  }

  return NextResponse.json({ ok: true });
}
