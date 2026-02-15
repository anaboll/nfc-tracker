import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { headers, cookies } from "next/headers";
import { hashIp, getGeoLocation } from "@/lib/utils";
import {
  resolveVisitorSessionFromCookies,
  extractCleanIp,
  ipVersion,
  ipPrefix,
  detectDeviceType,
  buildRawMeta,
  extractUtm,
  isSchemaMismatchError,
  truncateField,
} from "@/lib/telemetry";
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
      // Unified IP extraction – same cleanedIp for legacy hash AND telemetry
      const cleanedIp = extractCleanIp(
        hdrs.get("x-forwarded-for"),
        hdrs.get("x-real-ip"),
        hdrs.get("cf-connecting-ip")
      );
      const ipHash = hashIp(cleanedIp);

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
        // Per-tag returning: has this IP scanned THIS specific tag before?
        const isReturning = (await prisma.scan.count({ where: { ipHash, tagId: params.tagId } })) > 0;

        let geo = { city: null as string | null, country: null as string | null, region: null as string | null };
        try { geo = await getGeoLocation(cleanedIp); } catch { /* geo failed */ }

        // P0 telemetry from cookies (server component can read but not set)
        const cookieStore = cookies();
        const { visitorId, sessionId } = resolveVisitorSessionFromCookies(cookieStore);

        // IP telemetry
        const ipVer = ipVersion(cleanedIp);
        const ipPfx = ipPrefix(cleanedIp);

        // Device & rawMeta
        const device = detectDeviceType(userAgent);

        // Build a URL object for UTM/rawMeta (server component doesn't have request.url easily)
        let pageUrl: URL;
        try {
          const proto = hdrs.get("x-forwarded-proto") || "https";
          const host = hdrs.get("host") || "twojenfc.pl";
          pageUrl = new URL(`${proto}://${host}/watch/${params.tagId}`);
        } catch {
          pageUrl = new URL(`https://twojenfc.pl/watch/${params.tagId}`);
        }
        const utm = extractUtm(pageUrl);
        const rawMeta = buildRawMeta(hdrs, pageUrl);

        try {
          await prisma.scan.create({
            data: {
              tagId: params.tagId,
              ipHash,
              deviceType: device,
              userAgent: truncateField(userAgent) || null,
              browserLang,
              city: geo.city,
              country: geo.country,
              region: geo.region,
              isReturning,
              referrer: truncateField(referer) || null,
              eventSource: "direct-watch",
              // P0 telemetry
              visitorId,
              sessionId,
              ...utm,
              acceptLanguage: truncateField(hdrs.get("accept-language"), 500) || null,
              path: `/watch/${params.tagId}`,
              query: null,
              rawMeta,
              ipPrefix: ipPfx,
              ipVersion: ipVer,
            },
          });
        } catch (err) {
          if (isSchemaMismatchError(err)) {
            // Fallback without telemetry fields
            await prisma.scan.create({
              data: {
                tagId: params.tagId,
                ipHash,
                deviceType: device,
                userAgent: truncateField(userAgent) || null,
                browserLang,
                city: geo.city,
                country: geo.country,
                region: geo.region,
                isReturning,
                referrer: truncateField(referer) || null,
                eventSource: "direct-watch",
              },
            });
          } else {
            console.error("Watch page scan create failed (non-schema error):", err);
          }
        }
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
