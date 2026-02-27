import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { THEME_VALID_VALUES } from "@/types/vcard";
import type { VCardTheme } from "@/types/vcard";

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
/*  Theme validation & sanitization                                    */
/* ------------------------------------------------------------------ */
function sanitizeTheme(raw: unknown): VCardTheme | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Record<string, unknown>;
  const cleaned: Record<string, unknown> = {};

  // String enum fields
  const enumFields = [
    "bgMode", "bgPattern", "buttonStyle", "buttonVariant",
    "fontFamily", "layoutVariant", "avatarShape", "socialIconStyle",
  ] as const;

  for (const key of enumFields) {
    if (key in input) {
      const allowed = THEME_VALID_VALUES[key] as readonly string[];
      if (allowed.includes(input[key] as string)) {
        cleaned[key] = input[key];
      }
    }
  }

  // Color fields (hex format)
  const colorFields = [
    "primaryColor", "bgGradientFrom", "bgGradientTo",
    "bgSolidColor", "avatarBorderColor",
  ];
  const hexPattern = /^#[0-9a-fA-F]{3,8}$/;

  for (const key of colorFields) {
    if (key in input && typeof input[key] === "string") {
      const val = input[key] as string;
      if (val === "" || hexPattern.test(val)) {
        cleaned[key] = val;
      }
    }
  }

  // Numeric fields
  if ("avatarBorderWidth" in input) {
    const w = Number(input.avatarBorderWidth);
    if (!isNaN(w) && w >= 0 && w <= 6) {
      cleaned.avatarBorderWidth = Math.round(w);
    }
  }

  return Object.keys(cleaned).length > 0 ? (cleaned as VCardTheme) : null;
}

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

  /* Handle theme separately — validate and merge */
  if ("theme" in body) {
    const sanitized = sanitizeTheme(body.theme);
    if (sanitized) {
      const currentTheme = (currentLinks.theme as Record<string, unknown>) || {};
      updatedLinks.theme = { ...currentTheme, ...sanitized };
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
