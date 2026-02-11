import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { parseUserAgent, hashIp, getGeoLocation, extractIp } from "@/lib/utils";
import TrackedVideoPlayer from "./TrackedVideoPlayer";

export default async function WatchPage({ params }: { params: { tagId: string } }) {
  const tag = await prisma.tag.findUnique({
    where: { id: params.tagId, isActive: true },
  });

  if (!tag || !tag.videoFile) {
    notFound();
  }

  // Record view ONLY if accessed directly (not via /s/ redirect)
  // Check: no recent scan for same tag+IP in last 30s to prevent double counting
  const hdrs = headers();
  const referer = hdrs.get("referer") || "";
  const isFromRedirect = referer.includes(`/s/${params.tagId}`) || referer.includes(`/s/${params.tagId}:`);

  if (!isFromRedirect) {
    try {
      const rawIp = extractIp(
        hdrs.get("x-forwarded-for"),
        hdrs.get("x-real-ip"),
        hdrs.get("cf-connecting-ip")
      );
      const ipHash = hashIp(rawIp);

      // Check if scan already recorded in last 30 seconds (from /s/ redirect)
      const recentScan = await prisma.scan.findFirst({
        where: {
          tagId: params.tagId,
          ipHash,
          timestamp: { gte: new Date(Date.now() - 30000) },
        },
      });

      if (!recentScan) {
        const userAgent = hdrs.get("user-agent") || "";
        const browserLang = hdrs.get("accept-language")?.split(",")[0]?.split(";")[0]?.trim() || null;
        const parsed = parseUserAgent(userAgent);
        // Per-tag returning: has this IP scanned THIS specific tag before?
        const isReturning = (await prisma.scan.count({ where: { ipHash, tagId: params.tagId } })) > 0;

        let geo = { city: null as string | null, country: null as string | null, region: null as string | null };
        try { geo = await getGeoLocation(rawIp); } catch { /* geo failed */ }

        await prisma.scan.create({
          data: {
            tagId: params.tagId,
            ipHash,
            deviceType: parsed.deviceType,
            userAgent: userAgent || null,
            browserLang,
            city: geo.city,
            country: geo.country,
            region: geo.region,
            isReturning,
            referrer: referer || null,
            eventSource: "direct-watch",
          },
        });
      }
    } catch (err) {
      console.error("Watch page scan record failed:", err);
    }
  }

  // Transform /uploads/filename.mp4 -> /api/video/filename.mp4
  const videoSrc = tag.videoFile.replace(/^\/uploads\//, "/api/video/");

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: "#0a0a0a" }}
    >
      <div className="w-full max-w-2xl">
        {/* Video Player */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ background: "#111" }}>
          <TrackedVideoPlayer tagId={params.tagId} videoSrc={videoSrc} />
        </div>

        {/* Info */}
        <div className="mt-6 text-center">
          <h1 className="text-xl font-bold text-white mb-2">{tag.name}</h1>
          {tag.description && (
            <p className="text-gray-400 text-sm">{tag.description}</p>
          )}
        </div>

        {/* Branding */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-600">
            Powered by TwojeNFC.pl
          </p>
        </div>
      </div>
    </main>
  );
}
