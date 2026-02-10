import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import TrackedLink from "./TrackedLink";

interface LinkItem {
  label: string;
  url: string;
  icon: string;
}

const ICON_MAP: Record<string, { emoji: string; color: string }> = {
  instagram: { emoji: "\u{1F4F8}", color: "#E1306C" },
  whatsapp: { emoji: "\u{1F4AC}", color: "#25D366" },
  facebook: { emoji: "\u{1F44D}", color: "#1877F2" },
  twitter: { emoji: "\u{1F426}", color: "#1DA1F2" },
  x: { emoji: "\u{1F426}", color: "#000000" },
  youtube: { emoji: "\u{1F3AC}", color: "#FF0000" },
  tiktok: { emoji: "\u{1F3B5}", color: "#010101" },
  linkedin: { emoji: "\u{1F4BC}", color: "#0A66C2" },
  email: { emoji: "\u{1F4E7}", color: "#EA4335" },
  phone: { emoji: "\u{1F4DE}", color: "#34B7F1" },
  website: { emoji: "\u{1F310}", color: "#7c3aed" },
  map: { emoji: "\u{1F4CD}", color: "#FF6B6B" },
  spotify: { emoji: "\u{1F3B6}", color: "#1DB954" },
  telegram: { emoji: "\u{2708}\u{FE0F}", color: "#0088cc" },
  link: { emoji: "\u{1F517}", color: "#7c3aed" },
};

function getIcon(icon: string) {
  const lower = icon.toLowerCase();
  return ICON_MAP[lower] || ICON_MAP["link"];
}

export default async function MultiLinkPage({ params }: { params: { tagId: string } }) {
  const tag = await prisma.tag.findUnique({
    where: { id: params.tagId, isActive: true },
  });

  if (!tag || !tag.links) {
    notFound();
  }

  const links = tag.links as unknown as LinkItem[];

  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-12"
      style={{ background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)" }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 text-3xl"
            style={{ background: "linear-gradient(135deg, #7c3aed, #10b981)" }}
          >
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{tag.name}</h1>
          {tag.description && (
            <p className="text-sm" style={{ color: "#a0a0c0" }}>{tag.description}</p>
          )}
        </div>

        {/* Links */}
        <div className="space-y-3">
          {links.map((link, idx) => {
            const iconInfo = getIcon(link.icon);
            return (
              <TrackedLink
                key={idx}
                tagId={params.tagId}
                linkUrl={link.url}
                linkLabel={link.label}
                linkIcon={link.icon}
                className="flex items-center gap-4 w-full p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                style={{
                  background: "rgba(22, 33, 62, 0.8)",
                  border: "1px solid rgba(42, 42, 74, 0.8)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-xl text-xl flex-shrink-0"
                  style={{ background: `${iconInfo.color}22`, border: `1px solid ${iconInfo.color}44` }}
                >
                  {iconInfo.emoji}
                </div>
                <span className="text-white font-medium text-base flex-1">{link.label}</span>
                <svg className="w-5 h-5 flex-shrink-0" style={{ color: "#6060a0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </TrackedLink>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs" style={{ color: "#6060a0" }}>
            Powered by TwojeNFC.pl
          </p>
        </div>
      </div>
    </main>
  );
}
