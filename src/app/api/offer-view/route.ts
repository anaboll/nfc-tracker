import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const salt = process.env.IP_HASH_SALT || "twojenfc-offer-salt";
    const ipHash = crypto
      .createHmac("sha256", salt)
      .update(ip)
      .digest("hex")
      .slice(0, 16);

    const ua = request.headers.get("user-agent") || "";
    let deviceType = "Desktop";
    if (/iPhone|iPad|iPod/i.test(ua)) deviceType = "iOS";
    else if (/Android/i.test(ua)) deviceType = "Android";

    const entry = {
      timestamp: new Date().toISOString(),
      page: body.page || "/oferta/nieruchomosci",
      utm_source: body.utm_source || "",
      utm_medium: body.utm_medium || "",
      utm_campaign: body.utm_campaign || "",
      utm_content: body.utm_content || "",
      utm_term: body.utm_term || "",
      referrer: body.referrer || "",
      ipHash,
      deviceType,
      userAgent: ua.slice(0, 200),
      acceptLanguage: request.headers.get("accept-language")?.slice(0, 50) || "",
    };

    const dataDir = path.join(process.cwd(), "data");
    await mkdir(dataDir, { recursive: true });

    const logPath = path.join(dataDir, "offer-views.jsonl");
    await writeFile(logPath, JSON.stringify(entry) + "\n", { flag: "a" });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Offer view tracking error:", error);
    return NextResponse.json({ ok: true }); // fail silently for tracking
  }
}
