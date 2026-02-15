import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashIp, getGeoLocation } from "@/lib/utils";
import {
  collectTelemetry,
  applyTelemetryCookies,
  telemetryFields,
  isSchemaMismatchError,
} from "@/lib/telemetry";

function getRealBaseUrl(headers: Headers): string {
  const proto = headers.get("x-forwarded-proto") || "https";
  const host = headers.get("host") || headers.get("x-forwarded-host") || "twojenfc.pl";
  return `${proto}://${host}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tagId: string } }
) {
  const rawTagId = params.tagId;

  // Parse tag ID: support "tagId::nfcChipId" separator format
  // e.g. "bulderownia-ulotka::04:F2:94:70:CC:2A:81"
  let tagId: string;
  let chipId: string | null = null;
  if (rawTagId.includes("::")) {
    const sepIdx = rawTagId.indexOf("::");
    tagId = rawTagId.substring(0, sepIdx);
    chipId = rawTagId.substring(sepIdx + 2); // everything after ::
  } else {
    tagId = rawTagId;
  }

  try {
    const tag = await prisma.tag.findUnique({
      where: { id: tagId, isActive: true },
    });

    if (!tag) {
      return NextResponse.redirect(`${getRealBaseUrl(request.headers)}/`, { status: 302 });
    }

    // --- Telemetry: cookies + meta ---
    const { data: tele, setCookies, rawIp } = collectTelemetry(request);

    // Use same cleaned IP for legacy hash (unified extraction)
    const ipHash = hashIp(rawIp);

    const headers = request.headers;
    const url = new URL(request.url);
    // Accept ?source=qr (QR code scans) or ?event=... (legacy). ?source takes precedence.
    const sourceParam = url.searchParams.get("source"); // "qr" from QR code links
    const eventSource = sourceParam || url.searchParams.get("event") || null;
    // NFC chip ID: from :: separator in URL or ?nfc= query param
    const nfcId = chipId || url.searchParams.get("nfc") || null;

    // Record scan BEFORE redirect
    try {
      // Per-tag returning: has this IP scanned THIS specific tag before?
      const isReturning = (await prisma.scan.count({ where: { ipHash, tagId } })) > 0;

      let geo = { city: null as string | null, country: null as string | null, region: null as string | null };
      try {
        geo = await getGeoLocation(rawIp);
      } catch { /* geo failed, use empty */ }

      await prisma.scan.create({
        data: {
          tagId,
          ipHash,
          deviceType: tele.deviceType,
          userAgent: tele.userAgent,
          browserLang: headers.get("accept-language")?.split(",")[0]?.split(";")[0]?.trim() || null,
          city: geo.city,
          country: geo.country,
          region: geo.region,
          isReturning,
          referrer: tele.referrer,
          eventSource,
          ...(nfcId ? { nfcId } : {}),
          // P0 telemetry fields (visitorId, sessionId, UTM, rawMeta, ipPrefix, ipVersion, etc.)
          ...telemetryFields(tele),
        },
      });
    } catch (err) {
      if (isSchemaMismatchError(err)) {
        // Schema mismatch (columns not yet added) – retry without telemetry fields
        console.warn("Scan create: schema mismatch, retrying without telemetry:", (err as Error).message);
        try {
          await prisma.scan.create({
            data: {
              tagId,
              ipHash,
              deviceType: tele.deviceType,
              userAgent: tele.userAgent,
              browserLang: headers.get("accept-language")?.split(",")[0]?.split(";")[0]?.trim() || null,
              isReturning: false,
              referrer: tele.referrer,
              eventSource,
            },
          });
        } catch (err2) {
          console.error("Scan create retry also failed:", err2);
        }
      } else {
        // Real error (connection, constraint, etc.) – don't silently drop data
        console.error("Scan create failed (non-schema error):", err);
      }
    }

    // Build redirect URL using the real host (not Docker 0.0.0.0)
    let targetUrl = tag.targetUrl;

    // For vcard type, redirect to the vcard page
    if (tag.tagType === "vcard") {
      targetUrl = `/vcard/${tagId}`;
    }

    if (targetUrl.startsWith("/")) {
      targetUrl = `${getRealBaseUrl(headers)}${targetUrl}`;
    }

    const response = NextResponse.redirect(targetUrl, { status: 302 });

    // Apply telemetry cookies to redirect response
    applyTelemetryCookies(response, setCookies);

    return response;
  } catch (error) {
    console.error("Scan route error:", error);
    return NextResponse.redirect(`${getRealBaseUrl(request.headers)}/`, { status: 302 });
  }
}
