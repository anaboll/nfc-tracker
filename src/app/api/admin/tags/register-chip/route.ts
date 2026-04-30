import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  POST /api/admin/tags/register-chip                                 */
/*                                                                     */
/*  Wywoływane przez programmer (nfc-tools) PO udanej weryfikacji NDEF */
/*  na chipie. Tworzy wpis w NfcChipRegistry — mapowanie slug ↔ UID.   */
/*                                                                     */
/*  Auth: header X-NFC-Programmer-Token == env NFC_PROGRAMMER_TOKEN.   */
/*  Token jest random 64-hex generowany jednorazowo, trzymany w        */
/*  prod .env i w nfc-tools/.env.local. Programmer po stronie klienta  */
/*  loaduje go z .env i strzela w nagłówku.                            */
/*                                                                     */
/*  Response codes:                                                    */
/*    201 — utworzono nowy wpis                                        */
/*    200 — idempotent replay (UID już zarejestrowany na ten sam slug) */
/*    400 — walidacja body (brak slug/nfcUid, zła forma)               */
/*    401 — brak/zły token                                             */
/*    404 — slug nie istnieje w Tag                                    */
/*    409 — UID już przypisany do INNEGO sluga (anti-klon)             */
/*    500 — wewnętrzny błąd                                            */
/* ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RegisterBody {
  slug?: unknown;
  nfcUid?: unknown;
  locked?: unknown;
  programmedBy?: unknown;
}

export async function POST(request: NextRequest) {
  /* ---- Auth ---- */
  const expectedToken = process.env.NFC_PROGRAMMER_TOKEN;
  if (!expectedToken) {
    console.error("register-chip: NFC_PROGRAMMER_TOKEN nie ustawione w env");
    return NextResponse.json({ error: "Endpoint nie skonfigurowany (brak token w env)" }, { status: 500 });
  }
  const providedToken = request.headers.get("X-NFC-Programmer-Token");
  if (!providedToken || providedToken !== expectedToken) {
    return NextResponse.json({ error: "Brak lub nieprawidlowy token" }, { status: 401 });
  }

  /* ---- Parse body ---- */
  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: "Body musi byc poprawnym JSON" }, { status: 400 });
  }

  /* ---- Walidacja ---- */
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const nfcUidRaw = typeof body.nfcUid === "string" ? body.nfcUid.trim().toUpperCase() : "";
  const locked = typeof body.locked === "boolean" ? body.locked : false;
  const programmedBy = typeof body.programmedBy === "string" ? body.programmedBy.trim() || null : null;

  if (!slug) {
    return NextResponse.json({ error: "slug wymagany" }, { status: 400 });
  }
  if (!nfcUidRaw) {
    return NextResponse.json({ error: "nfcUid wymagany" }, { status: 400 });
  }
  /* NFC UID format: hex z dwukropkami lub bez. NTAG21x ma 7 bajtów (14 hex)
   * lub czasem dodatkowy padding (16 hex). Akceptujemy [0-9A-F:] długości 8-32. */
  if (!/^[0-9A-F:]{8,32}$/.test(nfcUidRaw)) {
    return NextResponse.json(
      { error: "nfcUid musi byc hex (np. 53CD0010630001 lub 53:CD:00:10:63:00:01)" },
      { status: 400 }
    );
  }
  /* Normalizujemy: usuwamy dwukropki dla spójności w bazie. */
  const nfcUid = nfcUidRaw.replace(/:/g, "");

  /* ---- Walidacja slug istnieje w Tag ---- */
  const tag = await prisma.tag.findUnique({ where: { id: slug } });
  if (!tag) {
    return NextResponse.json({ error: `Slug "${slug}" nie istnieje w bazie tagow` }, { status: 404 });
  }

  /* ---- Sprawdz czy UID juz zarejestrowany ---- */
  const existing = await prisma.nfcChipRegistry.findUnique({ where: { nfcUid } });
  if (existing) {
    if (existing.tagId === slug) {
      /* Replay tej samej operacji — programmer mogl miec retry. Zwracamy 200 idempotent. */
      return NextResponse.json(
        {
          ok: true,
          idempotent: true,
          registryId: existing.id,
          programmedAt: existing.programmedAt,
        },
        { status: 200 }
      );
    }
    /* UID przypisany do INNEGO sluga — potencjalny klon lub blad konfiguracji. */
    return NextResponse.json(
      {
        error: "Ten UID jest juz przypisany do innego tagu",
        existingSlug: existing.tagId,
        existingProgrammedAt: existing.programmedAt,
      },
      { status: 409 }
    );
  }

  /* ---- Utworz wpis ---- */
  try {
    const registry = await prisma.nfcChipRegistry.create({
      data: {
        tagId: slug,
        nfcUid,
        locked,
        programmedBy,
      },
    });
    return NextResponse.json(
      {
        ok: true,
        registryId: registry.id,
        programmedAt: registry.programmedAt,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("register-chip: prisma create failed", err);
    return NextResponse.json(
      { error: "Blad zapisu rejestru", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
