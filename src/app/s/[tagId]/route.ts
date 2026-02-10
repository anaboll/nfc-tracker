import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseUserAgent, hashIp, getGeoLocation, extractIp } from "@/lib/utils";

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
      return NextResponse.redirect(new URL("/", request.url), { status: 302 });
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

    const ipHash = hashIp(rawIp);
    const parsed = parseUserAgent(userAgent);

    // Fire-and-forget scan logging
    (async () => {
      try {
        const isReturning = (await prisma.scan.count({ where: { ipHash } })) > 0;
        const geo = await getGeoLocation(rawIp);

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
          },
        });
      } catch (err) {
        console.error("Failed to record scan:", err);
      }
    })();

    // Build redirect URL
    let targetUrl = tag.targetUrl;
    if (targetUrl.startsWith("/")) {
      targetUrl = new URL(targetUrl, request.url).toString();
    }

    return NextResponse.redirect(targetUrl, { status: 302 });
  } catch (error) {
    console.error("Scan route error:", error);
    return NextResponse.redirect(new URL("/", request.url), { status: 302 });
  }
}
