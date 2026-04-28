import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { headers } from "next/headers";
import type { CertificateData } from "@/types/certificate";
import { CertificatePDF } from "@/lib/certificate-pdf";
import React from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import { readFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");

/**
 * Dla zdjec /api/uploads/<filename> — czytamy plik z dysku i konwertujemy
 * na data: URI (base64). @react-pdf wspiera data: URI bezposrednio, bez
 * potrzeby fetcha (ktory w kontenerze moze trafic na sciany firewalla).
 * Dla external URL (http://...) zostawiamy bez zmian — @react-pdf sprobuje fetch.
 */
async function inlineAsset(p: string | undefined): Promise<string | undefined> {
  if (!p) return undefined;
  // /api/uploads/<filename> -> read from disk -> data URI
  const m = /^\/api\/uploads\/([a-zA-Z0-9._-]+)$/.exec(p);
  if (m) {
    try {
      const filename = m[1];
      const ext = path.extname(filename).toLowerCase();
      /* @react-pdf Image component wspiera tylko PNG i JPEG (raster).
       * SVG jest renderowany w komponencie Svg/Path ale nie przez Image.
       * Dla PDF pomijamy SVG — zdjecie zostanie z pusta wersja (signature
       * line zamiast obrazka podpisu). Web view nadal pokazuje SVG. */
      if (ext === ".svg") return undefined;

      const buf = await readFile(path.join(UPLOAD_DIR, filename));
      const mime = ext === ".png" ? "image/png"
        : ext === ".webp" ? "image/webp"
        : "image/jpeg";
      return `data:${mime};base64,${buf.toString("base64")}`;
    } catch {
      return undefined;
    }
  }
  return p;   // external URL, @react-pdf sprobuje fetch
}

/* ------------------------------------------------------------------ */
/*  GET /api/cert/[slug]/pdf                                           */
/*                                                                     */
/*  Generuje prawdziwy plik PDF certyfikatu i serwuje go jako          */
/*  attachment. Dziala na WSZYSTKICH urzadzeniach (iOS Chrome rowniez),*/
/*  co rozwiazuje problem ze window.print() silent fail-uje na mobile. */
/*                                                                     */
/*  Renderuje komponent @react-pdf/renderer do bufora PDF, zwraca z   */
/*  Content-Disposition: attachment zeby browser sam sciagnal plik.    */
/*                                                                     */
/*  Cache: no-store — certyfikat moze byc edytowany (data, tytul),    */
/*  zawsze chcemy swieza wersje.                                      */
/* ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  // Obsluga "slug::chipId" — strip chipId, korzystamy tylko z slug
  const decoded = decodeURIComponent(params.slug);
  const tagId = decoded.includes("::") ? decoded.substring(0, decoded.indexOf("::")) : decoded;

  const tag = await prisma.tag.findUnique({ where: { id: tagId, isActive: true } });
  if (!tag || tag.tagType !== "certificate") {
    return NextResponse.json({ error: "Nie znaleziono certyfikatu" }, { status: 404 });
  }

  const cert = tag.links as unknown as CertificateData;
  if (!cert || !cert.title) {
    return NextResponse.json({ error: "Uszkodzone dane certyfikatu" }, { status: 500 });
  }

  // Publiczny URL (do wyswietlenia na stopce PDF "Verify online")
  const hdrs = headers();
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const host = hdrs.get("host") || "twojenfc.pl";
  const publicUrl = `${proto}://${host}/cert/${tagId}`;

  /* Wstepne inlining zdjec do base64 data URI — @react-pdf moze wtedy
   * embeddowac je bezposrednio bez fetcha po siec. Fetch z kontenera na
   * wlasnego hosta Docker potrafi robic problemy (zwlaszcza gdy nginx
   * przed nim ma rate limit). Inlining = prostsze i szybsze. */
  const inlinedPhotos: string[] = [];
  for (const p of cert.photos || []) {
    const inl = await inlineAsset(p);
    if (inl) inlinedPhotos.push(inl);
  }
  const inlinedCert: CertificateData = {
    ...cert,
    photos: inlinedPhotos,
    signaturePhoto: await inlineAsset(cert.signaturePhoto),
    artistLogo: await inlineAsset(cert.artistLogo),
  };

  try {
    /* Cast na React.ReactElement<DocumentProps> bo @react-pdf renderToBuffer
     * ma scisle typy DocumentProps a nasze FunctionComponentElement tego nie
     * spelnia w TS — runtime OK, TS nie widzi. */
    const pdfElement = React.createElement(CertificatePDF, {
      cert: inlinedCert, tagId, publicUrl,
    }) as unknown as React.ReactElement<DocumentProps>;

    const pdfBuffer = await renderToBuffer(pdfElement);

    // Safe filename — tytul pracy + serial, bez polskich znakow
    const safeTitle = cert.title
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase()
      .slice(0, 40);
    const filename = `certyfikat-${safeTitle || tagId}-${cert.serialNumber || tagId}.pdf`;

    /* Node Buffer != Uint8Array w stricter TS — przekazujemy Uint8Array zeby
     * pasowalo do BodyInit. Runtime tak czy inaczej to sie same bajty. */
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err) {
    console.error("PDF generation failed:", err);
    return NextResponse.json(
      { error: "Blad generowania PDF", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
