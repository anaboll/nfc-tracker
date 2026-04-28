import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { CertificateData } from "@/types/certificate";
import CertificateView from "./CertificateView";

/* ------------------------------------------------------------------ */
/*  Publiczna strona certyfikatu autentycznosci.                       */
/*                                                                     */
/*  Route: /cert/<slug>. NFC tag lub QR kod prowadzi tu (po redirect   */
/*  z /s/<slug>). Strona jest:                                         */
/*    - mobile-first ladnie renderowana w telefonie (web view)         */
/*    - A4 portret z ozdobna ramka po kliknieciu "Pobierz PDF"         */
/*      (faktycznie window.print z @media print styles)                */
/*                                                                     */
/*  Skany dla tego tagId liczy /s/<slug> handler PRZED redirectem,     */
/*  wiec tu nie powielamy trackingu (jak w /vcard).                    */
/* ------------------------------------------------------------------ */

export const dynamic = "force-dynamic";

export default async function CertificatePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { from?: string };
}) {
  const fromDashboard = searchParams.from === "dashboard";
  const hdrs = headers();

  // Support "slug::chipId" syntax (direct NFC tap)
  const decoded = decodeURIComponent(params.slug);
  const tagId = decoded.includes("::") ? decoded.substring(0, decoded.indexOf("::")) : decoded;

  const tag = await prisma.tag.findUnique({ where: { id: tagId, isActive: true } });
  if (!tag || tag.tagType !== "certificate") notFound();

  const cert = tag.links as unknown as CertificateData;
  if (!cert || !cert.title) notFound();

  // Build full URL for QR code (back-reference)
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const host = hdrs.get("host") || "twojenfc.pl";
  const publicUrl = `${proto}://${host}/cert/${tagId}`;

  return (
    <CertificateView
      cert={cert}
      tagId={tagId}
      publicUrl={publicUrl}
      fromDashboard={fromDashboard}
    />
  );
}
