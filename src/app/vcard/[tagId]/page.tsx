import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import VCardActions from "./VCardActions";

interface VCardData {
  firstName: string;
  lastName: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  photo?: string; // URL to photo
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  tiktok?: string;
  youtube?: string;
  whatsapp?: string;
  telegram?: string;
  note?: string;
}

export default async function VCardPage({ params }: { params: { tagId: string } }) {
  const tag = await prisma.tag.findUnique({
    where: { id: params.tagId, isActive: true },
  });

  if (!tag || tag.tagType !== "vcard") {
    notFound();
  }

  const vcard = tag.links as unknown as VCardData;
  if (!vcard) notFound();

  const fullName = [vcard.firstName, vcard.lastName].filter(Boolean).join(" ");

  const socialLinks = [
    vcard.phone && { icon: "\u{1F4DE}", label: vcard.phone, url: `tel:${vcard.phone}`, color: "#34B7F1" },
    vcard.email && { icon: "\u{1F4E7}", label: vcard.email, url: `mailto:${vcard.email}`, color: "#EA4335" },
    vcard.website && { icon: "\u{1F310}", label: vcard.website.replace(/^https?:\/\//, ""), url: vcard.website, color: "#7c3aed" },
    vcard.instagram && { icon: "\u{1F4F8}", label: "Instagram", url: vcard.instagram.startsWith("http") ? vcard.instagram : `https://instagram.com/${vcard.instagram}`, color: "#E1306C" },
    vcard.facebook && { icon: "\u{1F44D}", label: "Facebook", url: vcard.facebook.startsWith("http") ? vcard.facebook : `https://facebook.com/${vcard.facebook}`, color: "#1877F2" },
    vcard.linkedin && { icon: "\u{1F4BC}", label: "LinkedIn", url: vcard.linkedin.startsWith("http") ? vcard.linkedin : `https://linkedin.com/in/${vcard.linkedin}`, color: "#0A66C2" },
    vcard.tiktok && { icon: "\u{1F3B5}", label: "TikTok", url: vcard.tiktok.startsWith("http") ? vcard.tiktok : `https://tiktok.com/@${vcard.tiktok}`, color: "#010101" },
    vcard.youtube && { icon: "\u{1F3AC}", label: "YouTube", url: vcard.youtube.startsWith("http") ? vcard.youtube : `https://youtube.com/@${vcard.youtube}`, color: "#FF0000" },
    vcard.whatsapp && { icon: "\u{1F4AC}", label: "WhatsApp", url: `https://wa.me/${vcard.whatsapp.replace(/[^0-9+]/g, "")}`, color: "#25D366" },
    vcard.telegram && { icon: "\u{2708}\u{FE0F}", label: "Telegram", url: vcard.telegram.startsWith("http") ? vcard.telegram : `https://t.me/${vcard.telegram}`, color: "#0088cc" },
  ].filter(Boolean) as { icon: string; label: string; url: string; color: string }[];

  // Build vCard string for download
  const vcfLines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${vcard.lastName || ""};${vcard.firstName || ""};;;`,
    `FN:${fullName}`,
    vcard.company && `ORG:${vcard.company}`,
    vcard.jobTitle && `TITLE:${vcard.jobTitle}`,
    vcard.phone && `TEL;TYPE=CELL:${vcard.phone}`,
    vcard.email && `EMAIL:${vcard.email}`,
    vcard.website && `URL:${vcard.website}`,
    vcard.address && `ADR;TYPE=WORK:;;${vcard.address};;;;`,
    vcard.note && `NOTE:${vcard.note}`,
    "END:VCARD",
  ].filter(Boolean).join("\n");

  const vcfBase64 = Buffer.from(vcfLines, "utf-8").toString("base64");

  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-8"
      style={{ background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)" }}
    >
      <div className="w-full max-w-md">
        {/* Avatar / Header */}
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 text-4xl font-bold text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #10b981)" }}
          >
            {vcard.firstName?.[0]?.toUpperCase() || ""}{vcard.lastName?.[0]?.toUpperCase() || ""}
          </div>
          <h1 className="text-2xl font-bold text-white">{fullName}</h1>
          {vcard.jobTitle && (
            <p className="text-sm mt-1" style={{ color: "#a0a0c0" }}>{vcard.jobTitle}</p>
          )}
          {vcard.company && (
            <p className="text-sm mt-1 font-semibold" style={{ color: "#9f67ff" }}>{vcard.company}</p>
          )}
        </div>

        {/* Save Contact button */}
        <VCardActions vcfBase64={vcfBase64} fullName={fullName} />

        {/* Contact Info & Social Links */}
        <div className="space-y-3 mt-6">
          {socialLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 w-full p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg no-underline"
              style={{
                background: "rgba(22, 33, 62, 0.8)",
                border: "1px solid rgba(42, 42, 74, 0.8)",
                backdropFilter: "blur(10px)",
                textDecoration: "none",
              }}
            >
              <div
                className="flex items-center justify-center w-12 h-12 rounded-xl text-xl flex-shrink-0"
                style={{ background: `${link.color}22`, border: `1px solid ${link.color}44` }}
              >
                {link.icon}
              </div>
              <span className="text-white font-medium text-sm flex-1">{link.label}</span>
              <svg className="w-5 h-5 flex-shrink-0" style={{ color: "#6060a0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          ))}
        </div>

        {/* Note */}
        {vcard.note && (
          <div
            className="mt-6 p-4 rounded-xl text-sm"
            style={{ background: "rgba(22, 33, 62, 0.6)", border: "1px solid rgba(42, 42, 74, 0.6)", color: "#a0a0c0" }}
          >
            {vcard.note}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-xs" style={{ color: "#6060a0" }}>
            Powered by TwojeNFC.pl
          </p>
        </div>
      </div>
    </main>
  );
}
