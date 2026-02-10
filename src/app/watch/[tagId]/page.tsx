import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function WatchPage({ params }: { params: { tagId: string } }) {
  const tag = await prisma.tag.findUnique({
    where: { id: params.tagId, isActive: true },
  });

  if (!tag || !tag.videoFile) {
    notFound();
  }

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
            <source src={tag.videoFile} type="video/mp4" />
            <source src={tag.videoFile} type="video/webm" />
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
