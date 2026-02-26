import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  Allowed vCard fields for self-service editing                      */
/* ------------------------------------------------------------------ */
const ALLOWED_FIELDS = [
  "firstName", "lastName", "company", "jobTitle",
  "phone", "email", "website", "address",
  "instagram", "facebook", "linkedin", "whatsapp",
  "tiktok", "youtube", "telegram", "note", "photo",
];

/* ------------------------------------------------------------------ */
/*  PUT — Self-service vCard update (token auth)                       */
/* ------------------------------------------------------------------ */
export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url);
  const tagId = searchParams.get("tagId");
  const token = searchParams.get("token");

  if (!tagId || !token) {
    return NextResponse.json({ error: "tagId i token wymagane" }, { status: 400 });
  }

  /* Find tag and validate token */
  const tag = await prisma.tag.findUnique({ where: { id: tagId } });

  if (!tag || tag.tagType !== "vcard") {
    return NextResponse.json({ error: "Tag nie znaleziony" }, { status: 404 });
  }

  if (!tag.editToken || tag.editToken !== token) {
    return NextResponse.json({ error: "Nieprawidlowy token" }, { status: 403 });
  }

  if (tag.editTokenExp && new Date() > tag.editTokenExp) {
    return NextResponse.json({ error: "Token wygasl" }, { status: 403 });
  }

  /* Parse body and whitelist fields */
  const body = await req.json();
  const currentLinks = (tag.links as Record<string, unknown>) || {};
  const updatedLinks: Record<string, unknown> = { ...currentLinks };

  for (const field of ALLOWED_FIELDS) {
    if (field in body) {
      updatedLinks[field] = body[field];
    }
  }

  /* Update tag */
  await prisma.tag.update({
    where: { id: tagId },
    data: {
      links: updatedLinks as unknown as Record<string, string>,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}

/* ------------------------------------------------------------------ */
/*  GET — Fetch vCard data for self-service editor (token auth)        */
/* ------------------------------------------------------------------ */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tagId = searchParams.get("tagId");
  const token = searchParams.get("token");

  if (!tagId || !token) {
    return NextResponse.json({ error: "tagId i token wymagane" }, { status: 400 });
  }

  const tag = await prisma.tag.findUnique({ where: { id: tagId } });

  if (!tag || tag.tagType !== "vcard") {
    return NextResponse.json({ error: "Tag nie znaleziony" }, { status: 404 });
  }

  if (!tag.editToken || tag.editToken !== token) {
    return NextResponse.json({ error: "Nieprawidlowy token" }, { status: 403 });
  }

  if (tag.editTokenExp && new Date() > tag.editTokenExp) {
    return NextResponse.json({ error: "Token wygasl" }, { status: 403 });
  }

  return NextResponse.json({
    tagId: tag.id,
    name: tag.name,
    vcard: tag.links,
  });
}
