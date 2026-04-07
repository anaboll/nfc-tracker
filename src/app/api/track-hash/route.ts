import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashIp, getGeoLocation } from "@/lib/utils";
import {
  collectTelemetry,
  telemetryFields,
  isSchemaMismatchError,
} from "@/lib/telemetry";

/**
 * Public POST endpoint to track clicks from email campaigns that use
 * hash-based tracking codes (e.g. twojenfc.pl/#jak-to-dziala/DJ3L).
 *
 * Client-side JS reads the hash, extracts the code, and POSTs here.
 * We record a Scan to the Tag with id = code, with full telemetry.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = typeof body?.code === "string" ? body.code.toUpperCase().trim() : null;

    if (!code || !/^[A-Z0-9]{4,}$/.test(code)) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    // Tag ID is the code itself
    const tag = await prisma.tag.findUnique({
      where: { id: code, isActive: true },
    });

    if (!tag) {
      // Code doesn't exist - silently accept to avoid info leak
      return NextResponse.json({ ok: true });
    }

    // Collect telemetry
    const { data: tele, rawIp } = collectTelemetry(request);
    const ipHash = hashIp(rawIp);

    // Geo lookup
    let geo = { city: null as string | null, country: null as string | null, region: null as string | null };
    try {
      geo = await getGeoLocation(rawIp);
    } catch {
      /* ignore */
    }

    // Per-tag returning check
    const isReturning = (await prisma.scan.count({ where: { ipHash, tagId: code } })) > 0;

    try {
      await prisma.scan.create({
        data: {
          tagId: code,
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
        // Retry without new telemetry fields
        await prisma.scan.create({
          data: {
            tagId: code,
            ipHash,
            deviceType: tele.deviceType,
            userAgent: tele.userAgent,
            isReturning,
            referrer: tele.referrer,
            eventSource: "email",
          },
        });
      } else {
        console.error("track-hash scan create failed:", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("track-hash error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
