import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserAccess } from "@/lib/user-access";

/* ------------------------------------------------------------------ */
/*  GET /api/tags/[id] — fetch single tag with relations               */
/* ------------------------------------------------------------------ */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await getUserAccess();
  if (!access) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tag = await prisma.tag.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { scans: true } },
      client: { select: { id: true, name: true, slug: true, color: true } },
      campaign: { select: { id: true, name: true } },
    },
  });

  if (!tag) {
    return NextResponse.json({ error: "Tag nie znaleziony" }, { status: 404 });
  }

  /* Viewer access check: only allowed if tag's clientId is in their allowedClientIds */
  if (!access.isAdmin && access.allowedClientIds) {
    if (!tag.clientId || !access.allowedClientIds.includes(tag.clientId)) {
      return NextResponse.json({ error: "Brak dostepu" }, { status: 403 });
    }
  }

  return NextResponse.json(tag);
}
