import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashIp, getGeoLocation, extractIp } from "@/lib/utils";
import {
  collectTelemetry,
  applyTelemetryCookies,
  telemetryFields,
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

    // Legacy IP hash (existing SHA-256 with IP_HASH_SALT for backward compat)
    const headers = request.headers;
    const legacyRawIp = extractIp(
      headers.get("x-forwarded-for"),
      headers.get("x-real-ip"),
      headers.get("cf-connecting-ip")
    );
    const ipHash = hashIp(legacyRawIp);

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
        geo = await getGeoLocation(legacyRawIp);
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
      // If it failed (e.g. new columns missing), try without telemetry fields
      console.error("Scan create failed, retrying without telemetry:", err);
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
