import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { parseUserAgent, hashIp, getGeoLocation, extractIp } from "@/lib/utils";

export default async function WatchPage({ params }: { params: { tagId: string } }) {
  const tag = await prisma.tag.findUnique({
    where: { id: params.tagId, isActive: true },
  });

  if (!tag || !tag.videoFile) {
    notFound();
  }

  // If someone accesses /watch/ directly (not via /s/ redirect), record the view
  const hdrs = headers();
  const referer = hdrs.get("referer") || "";
  const isDirectAccess = !referer.includes(`/s/${params.tagId}`);

  if (isDirectAccess) {
    try {
      const rawIp = extractIp(
        hdrs.get("x-forwarded-for"),
        hdrs.get("x-real-ip"),
        hdrs.get("cf-connecting-ip")
      );
      const userAgent = hdrs.get("user-agent") || "";
      const browserLang = hdrs.get("accept-language")?.split(",")[0]?.split(";")[0]?.trim() || null;
      const ipHash = hashIp(rawIp);
      const parsed = parseUserAgent(userAgent);
      const isReturning = (await prisma.scan.count({ where: { ipHash } })) > 0;

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
          <video
            className="w-full"
            controls
            autoPlay
            playsInline
            preload="metadata"
            style={{ maxHeight: "80vh" }}
          >
            <source src={videoSrc} type="video/mp4" />
            <source src={videoSrc} type="video/webm" />
            Twoja przegladarka nie wspiera odtwarzania wideo.
          </video>
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
