import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashIp, getGeoLocation } from "@/lib/utils";
import {
  collectTelemetry,
  applyTelemetryCookies,
  telemetryFields,
  isSchemaMismatchError,
} from "@/lib/telemetry";

/**
 * Tracked redirect to Marcin's personal vCard for email campaigns.
 *
 * URL pattern: /s/wizytowka/CODE
 *   - CODE is a 4-char unique identifier per recipient (e.g. 2BPE)
 *   - Records a Scan to tag with id "wizytowka-CODE"
 *   - Redirects to /vcard/wizytowka
 *
 * Looks similar to the regular /s/wizytowka link, but trackable per recipient.
 */

function getRealBaseUrl(headers: Headers): string {
  const proto = headers.get("x-forwarded-proto") || "https";
  const host = headers.get("host") || headers.get("x-forwarded-host") || "twojenfc.pl";
  return `${proto}://${host}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code?.toUpperCase().trim();
  const baseUrl = getRealBaseUrl(request.headers);
  const fallbackRedirect = `${baseUrl}/vcard/wizytowka`;

  if (!code || !/^[A-Z0-9]{4,}$/.test(code)) {
    return NextResponse.redirect(fallbackRedirect, { status: 302 });
  }

  const tagId = `wizytowka-${code}`;

  try {
    // Find the per-recipient tracking tag
    const tag = await prisma.tag.findUnique({
      where: { id: tagId, isActive: true },
    });

    if (!tag) {
      // Code doesn't exist - just redirect to vCard without tracking
      return NextResponse.redirect(fallbackRedirect, { status: 302 });
    }

    // Telemetry collection
    const { data: tele, setCookies, rawIp } = collectTelemetry(request);
    const ipHash = hashIp(rawIp);

    let geo = { city: null as string | null, country: null as string | null, region: null as string | null };
    try {
      geo = await getGeoLocation(rawIp);
    } catch { /* ignore */ }

    const isReturning = (await prisma.scan.count({ where: { ipHash, tagId } })) > 0;

    try {
      await prisma.scan.create({
        data: {
          tagId,
          ipHash,
          deviceType: tele.deviceType,
          userAgent: tele.userAgent,
          browserLang: request.headers.get("accept-language")?.split(",")[0]?.split(";")[0]?.trim() || null,
          city: geo.city,
          country: geo.country,
          region: geo.region,
          isReturning,
          referrer: tele.referrer,
          eventSource: "email",
          ...telemetryFields(tele),
        },
      });
    } catch (err) {
      if (isSchemaMismatchError(err)) {
        await prisma.scan.create({
          data: {
            tagId,
            ipHash,
            deviceType: tele.deviceType,
            userAgent: tele.userAgent,
            isReturning,
            referrer: tele.referrer,
            eventSource: "email",
          },
        });
      } else {
        console.error("wizytowka tracked redirect: scan create failed:", err);
      }
    }

    // Redirect to the actual vCard page
    const response = NextResponse.redirect(fallbackRedirect, { status: 302 });
    applyTelemetryCookies(response, setCookies, request);
    return response;
  } catch (error) {
    console.error("wizytowka tracked redirect error:", error);
    return NextResponse.redirect(fallbackRedirect, { status: 302 });
  }
}
