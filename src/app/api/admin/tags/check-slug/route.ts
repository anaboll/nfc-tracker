import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET /api/admin/tags/check-slug?slug=<slug>                         */
/*                                                                     */
/*  Read-only weryfikacja: czy podany slug istnieje w bazie Tag.       */
/*  Wywoływane przez programmer (nfc-tools) PO udanej weryfikacji      */
/*  NDEF — żeby potwierdzić że zaprogramowany URL prowadzi do          */
/*  realnego, skonfigurowanego taga w admin DB.                        */
/*                                                                     */
/*  Auth: header X-NFC-Programmer-Token == env NFC_PROGRAMMER_TOKEN.   */
/*  Token random 64-hex, trzymany w prod .env i w nfc-tools/.env.local */
/*                                                                     */
/*  Response codes:                                                    */
/*    200 { exists: true, slug, type, label, isActive } — znaleziony   */
/*    200 { exists: false, slug }                       — nieznaleziony*/
/*    400 — brak query param ?slug=                                    */
/*    401 — brak/zły token                                             */
/*    500 — wewnętrzny błąd                                            */
/*                                                                     */
/*  Uwaga: "slug nie istnieje" zwraca 200 + exists:false (NIE 404).    */
/*  Programmer (nfc-tools) traktuje 4xx jako "real bug, instant fail"  */
/*  bez retry — slug-not-found to legalna odpowiedź, nie błąd.         */
/* ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  /* ---- Auth ---- */
  const expectedToken = process.env.NFC_PROGRAMMER_TOKEN;
  if (!expectedToken) {
    console.error("check-slug: NFC_PROGRAMMER_TOKEN nie ustawione w env");
    return NextResponse.json(
      { error: "Endpoint nie skonfigurowany (brak token w env)" },
      { status: 500 }
    );
  }
  const providedToken = request.headers.get("X-NFC-Programmer-Token");
  if (!providedToken || providedToken !== expectedToken) {
    return NextResponse.json({ error: "Brak lub nieprawidlowy token" }, { status: 401 });
  }

  /* ---- Parse query ---- */
  const slug = request.nextUrl.searchParams.get("slug")?.trim() || "";
  if (!slug) {
    return NextResponse.json({ error: "Query param 'slug' wymagany" }, { status: 400 });
  }

  /* ---- Lookup Tag ---- */
  try {
    const tag = await prisma.tag.findUnique({
      where: { id: slug },
      select: { id: true, name: true, tagType: true, isActive: true },
    });
    if (!tag) {
      return NextResponse.json({ exists: false, slug }, { status: 200 });
    }
    return NextResponse.json(
      {
        exists: true,
        slug: tag.id,
        type: tag.tagType,
        label: tag.name,
        isActive: tag.isActive,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("check-slug: prisma findUnique failed", err);
    return NextResponse.json(
      {
        error: "Blad zapytania do bazy",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
