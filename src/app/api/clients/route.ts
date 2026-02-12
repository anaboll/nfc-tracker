import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET all clients
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clients = await prisma.client.findMany({
    include: {
      // _count counts ALL tags (active + inactive) for the tagCount badge
      _count: { select: { tags: true } },
      // Fetch ALL tag IDs — active AND inactive — so scanCount is never under-reported.
      // Previously filtered to isActive:true, hiding scans from deactivated tags (Bug B3).
      tags: {
        select: { id: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // Enrich with total scan count per client (all-time, all tags active + inactive)
  const enriched = await Promise.all(
    clients.map(async (client) => {
      const tagIds = client.tags.map((t) => t.id);
      const scanCount = tagIds.length > 0
        ? await prisma.scan.count({ where: { tagId: { in: tagIds } } })
        : 0;
      return {
        id: client.id,
        name: client.name,
        slug: client.slug,
        description: client.description,
        color: client.color,
        isActive: client.isActive,
        createdAt: client.createdAt,
        tagCount: client._count.tags,
        scanCount,
      };
    })
  );

  return NextResponse.json(enriched);
}

// POST create new client
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, description, color } = body;

  if (!name) {
    return NextResponse.json({ error: "Nazwa klienta jest wymagana" }, { status: 400 });
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const existing = await prisma.client.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Klient o tej nazwie juz istnieje" }, { status: 409 });
  }

  const client = await prisma.client.create({
    data: {
      name,
      slug,
      description: description || null,
      color: color || null,
    },
  });

  return NextResponse.json(client, { status: 201 });
}

// PUT update client
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, name, description, color, isActive } = body;

  if (!id) return NextResponse.json({ error: "id wymagane" }, { status: 400 });

  const client = await prisma.client.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(color !== undefined && { color }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json(client);
}

// DELETE client
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id wymagane" }, { status: 400 });

  // Unlink tags from client (don't delete them)
  await prisma.tag.updateMany({
    where: { clientId: id },
    data: { clientId: null },
  });

  await prisma.client.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
