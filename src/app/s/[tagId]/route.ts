import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseUserAgent, hashIp, getGeoLocation, extractIp } from "@/lib/utils";

function getRealBaseUrl(headers: Headers): string {
  const proto = headers.get("x-forwarded-proto") || "https";
  const host = headers.get("host") || headers.get("x-forwarded-host") || "twojenfc.pl";
  return `${proto}://${host}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tagId: string } }
) {
  const { tagId } = params;

  try {
    const tag = await prisma.tag.findUnique({
      where: { id: tagId, isActive: true },
    });

    if (!tag) {
      return NextResponse.redirect(`${getRealBaseUrl(request.headers)}/`, { status: 302 });
    }

    // Collect data
    const headers = request.headers;
    const rawIp = extractIp(
      headers.get("x-forwarded-for"),
      headers.get("x-real-ip"),
      headers.get("cf-connecting-ip")
    );
    const userAgent = headers.get("user-agent") || "";
    const browserLang = headers.get("accept-language")?.split(",")[0]?.split(";")[0]?.trim() || null;
    const referrer = headers.get("referer") || null;
    const url = new URL(request.url);
    const eventSource = url.searchParams.get("event") || null;
    const nfcId = url.searchParams.get("nfc") || null;

    const ipHash = hashIp(rawIp);
    const parsed = parseUserAgent(userAgent);

    // Record scan BEFORE redirect
    try {
      const isReturning = (await prisma.scan.count({ where: { ipHash } })) > 0;

      let geo = { city: null as string | null, country: null as string | null, region: null as string | null };
      try {
        geo = await getGeoLocation(rawIp);
      } catch { /* geo failed, use empty */ }

      await prisma.scan.create({
        data: {
          tagId,
          ipHash,
          deviceType: parsed.deviceType,
          userAgent: userAgent || null,
          browserLang,
          city: geo.city,
          country: geo.country,
          region: geo.region,
          isReturning,
          referrer,
          eventSource,
          ...(nfcId ? { nfcId } : {}),
        },
      });
    } catch (err) {
      // If it failed (e.g. nfcId column missing), try without nfcId
      console.error("Scan create failed, retrying without nfcId:", err);
      try {
        await prisma.scan.create({
          data: {
            tagId,
            ipHash,
            deviceType: parsed.deviceType,
            userAgent: userAgent || null,
            browserLang,
            isReturning: false,
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

    return NextResponse.redirect(targetUrl, { status: 302 });
  } catch (error) {
    console.error("Scan route error:", error);
    return NextResponse.redirect(`${getRealBaseUrl(request.headers)}/`, { status: 302 });
  }
}
