import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserAccess } from "@/lib/user-access";
import crypto from "crypto";

/* ------------------------------------------------------------------ */
/*  POST — Generate / regenerate edit token (admin or assigned viewer)  */
/* ------------------------------------------------------------------ */
export async function POST(req: Request) {
  const access = await getUserAccess();
  if (!access) {
    return NextResponse.json({ error: "Brak uprawnien" }, { status: 403 });
  }

  const body = await req.json();
  const { tagId, expiresInDays } = body;

  if (!tagId) {
    return NextResponse.json({ error: "tagId wymagany" }, { status: 400 });
  }

  const tag = await prisma.tag.findUnique({ where: { id: tagId } });
  if (!tag) {
    return NextResponse.json({ error: "Tag nie znaleziony" }, { status: 404 });
  }
  if (tag.tagType !== "vcard") {
    return NextResponse.json({ error: "Token edycji dostepny tylko dla wizytowek (vCard)" }, { status: 400 });
  }

  /* Viewer can only generate tokens for their assigned clients */
  if (!access.isAdmin) {
    if (!access.allowedClientIds || !tag.clientId || !access.allowedClientIds.includes(tag.clientId)) {
      return NextResponse.json({ error: "Brak uprawnien do tego tagu" }, { status: 403 });
    }
  }

  const editToken = crypto.randomBytes(24).toString("base64url");
  const editTokenExp = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  await prisma.tag.update({
    where: { id: tagId },
    data: { editToken, editTokenExp },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "https://twojenfc.pl";
  const editUrl = `${baseUrl}/vcard/${tagId}/edit?token=${editToken}`;

  return NextResponse.json({
    editToken,
    editUrl,
    expiresAt: editTokenExp?.toISOString() || null,
  });
}

/* ------------------------------------------------------------------ */
/*  DELETE — Revoke edit token (admin only)                            */
/* ------------------------------------------------------------------ */
export async function DELETE(req: Request) {
  const access = await getUserAccess();
  if (!access?.isAdmin) {
    return NextResponse.json({ error: "Brak uprawnien" }, { status: 403 });
  }

  const body = await req.json();
  const { tagId } = body;

  if (!tagId) {
    return NextResponse.json({ error: "tagId wymagany" }, { status: 400 });
  }

  await prisma.tag.update({
    where: { id: tagId },
    data: { editToken: null, editTokenExp: null },
  });

  return NextResponse.json({ ok: true });
}
