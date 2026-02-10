import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET all tags
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tags = await prisma.tag.findMany({
    include: { _count: { select: { scans: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tags);
}

// POST create new tag
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, name, targetUrl, description } = body;

  if (!id || !name || !targetUrl) {
    return NextResponse.json({ error: "id, name i targetUrl sa wymagane" }, { status: 400 });
  }

  // Sanitize ID
  const cleanId = id.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

  const existing = await prisma.tag.findUnique({ where: { id: cleanId } });
  if (existing) {
    return NextResponse.json({ error: "Tag o tym ID juz istnieje" }, { status: 409 });
  }

  const tag = await prisma.tag.create({
    data: { id: cleanId, name, targetUrl, description: description || null },
  });

  return NextResponse.json(tag, { status: 201 });
}

// PUT update tag
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, name, targetUrl, description, isActive, videoFile } = body;

  if (!id) return NextResponse.json({ error: "id wymagane" }, { status: 400 });

  const tag = await prisma.tag.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(targetUrl !== undefined && { targetUrl }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive }),
      ...(videoFile !== undefined && { videoFile }),
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

  // Delete scans first
  await prisma.scan.deleteMany({ where: { tagId: id } });
  await prisma.tag.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
