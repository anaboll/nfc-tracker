import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import VCardActions from "./VCardActions";
import type { VCardData } from "@/types/vcard";
import { DEFAULT_VCARD_THEME } from "@/types/vcard";
import {
  PhoneIcon, EmailIcon, WebsiteIcon, AddressIcon,
  InstagramIcon, FacebookIcon, LinkedInIcon, WhatsAppIcon,
  TikTokIcon, YouTubeIcon, TelegramIcon, NoteIcon,
  SOCIAL_COLORS,
} from "@/components/vcard/SocialIcons";

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

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
  const theme = {
    ...DEFAULT_VCARD_THEME,
    ...(vcard.theme || {}),
  };

  /* -- Build contact links -- */
  const contactLinks = [
    vcard.phone && { key: "phone", label: vcard.phone, url: `tel:${vcard.phone}` },
    vcard.email && { key: "email", label: vcard.email, url: `mailto:${vcard.email}` },
    vcard.website && { key: "website", label: vcard.website.replace(/^https?:\/\//, ""), url: vcard.website.startsWith("http") ? vcard.website : `https://${vcard.website}` },
    vcard.address && { key: "address", label: vcard.address, url: `https://maps.google.com/?q=${encodeURIComponent(vcard.address)}` },
  ].filter(Boolean) as { key: string; label: string; url: string }[];

  const socialLinks = [
    vcard.instagram && { key: "instagram", label: "Instagram", url: vcard.instagram.startsWith("http") ? vcard.instagram : `https://instagram.com/${vcard.instagram.replace(/^@/, "")}` },
    vcard.facebook && { key: "facebook", label: "Facebook", url: vcard.facebook.startsWith("http") ? vcard.facebook : `https://facebook.com/${vcard.facebook}` },
    vcard.linkedin && { key: "linkedin", label: "LinkedIn", url: vcard.linkedin.startsWith("http") ? vcard.linkedin : `https://linkedin.com/in/${vcard.linkedin}` },
    vcard.whatsapp && { key: "whatsapp", label: "WhatsApp", url: `https://wa.me/${vcard.whatsapp.replace(/[^0-9+]/g, "")}` },
    vcard.tiktok && { key: "tiktok", label: "TikTok", url: vcard.tiktok.startsWith("http") ? vcard.tiktok : `https://tiktok.com/@${vcard.tiktok.replace(/^@/, "")}` },
    vcard.youtube && { key: "youtube", label: "YouTube", url: vcard.youtube.startsWith("http") ? vcard.youtube : `https://youtube.com/@${vcard.youtube.replace(/^@/, "")}` },
    vcard.telegram && { key: "telegram", label: "Telegram", url: vcard.telegram.startsWith("http") ? vcard.telegram : `https://t.me/${vcard.telegram.replace(/^@/, "")}` },
  ].filter(Boolean) as { key: string; label: string; url: string }[];

  /* -- Build vCard (.vcf) -- */
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

  /* -- Icon resolver -- */
  const ICON_MAP: Record<string, React.FC<{ size?: number; color?: string }>> = {
    phone: PhoneIcon, email: EmailIcon, website: WebsiteIcon, address: AddressIcon,
    instagram: InstagramIcon, facebook: FacebookIcon, linkedin: LinkedInIcon,
    whatsapp: WhatsAppIcon, tiktok: TikTokIcon, youtube: YouTubeIcon, telegram: TelegramIcon,
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center px-4 py-8"
      style={{ background: `linear-gradient(135deg, ${theme.bgGradientFrom} 0%, ${theme.bgGradientTo} 100%)` }}
    >
      <div className="w-full" style={{ maxWidth: 440 }}>

        {/* ============================================================ */}
        {/*  HEADER — photo/initials + name + title                      */}
        {/* ============================================================ */}
        <div className="text-center" style={{ marginBottom: 24 }}>
          {/* Avatar */}
          {vcard.photo ? (
            <div style={{
              width: 120, height: 120, borderRadius: "50%", margin: "0 auto 16px",
              overflow: "hidden", border: `3px solid ${theme.primaryColor}40`,
              boxShadow: `0 0 30px ${theme.primaryColor}20`,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={vcard.photo} alt={fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ) : (
            <div
              style={{
                width: 120, height: 120, borderRadius: "50%", margin: "0 auto 16px",
                background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.primaryColor}88)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 42, fontWeight: 700, color: "#fff",
                boxShadow: `0 0 30px ${theme.primaryColor}20`,
              }}
            >
              {vcard.firstName?.[0]?.toUpperCase() || ""}{vcard.lastName?.[0]?.toUpperCase() || ""}
            </div>
          )}

          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 4, letterSpacing: "-0.01em" }}>
            {fullName}
          </h1>
          {vcard.jobTitle && (
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 2 }}>{vcard.jobTitle}</p>
          )}
          {vcard.company && (
            <p style={{ fontSize: 14, fontWeight: 600, color: theme.primaryColor }}>{vcard.company}</p>
          )}
        </div>

        {/* ============================================================ */}
        {/*  SAVE CONTACT BUTTON                                         */}
        {/* ============================================================ */}
        <VCardActions vcfBase64={vcfBase64} fullName={fullName} primaryColor={theme.primaryColor} />

        {/* ============================================================ */}
        {/*  CONTACT section                                             */}
        {/* ============================================================ */}
        {contactLinks.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.35)", marginBottom: 10, paddingLeft: 4,
            }}>
              Kontakt
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {contactLinks.map((link) => {
                const Icon = ICON_MAP[link.key];
                const color = SOCIAL_COLORS[link.key] || theme.primaryColor;
                return (
                  <a
                    key={link.key}
                    href={link.url}
                    target={link.key === "phone" ? "_self" : "_blank"}
                    rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 16px", borderRadius: 14,
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                      textDecoration: "none", transition: "all 0.2s",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: `${color}15`, border: `1px solid ${color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {Icon && <Icon size={20} color={color} />}
                    </div>
                    <span style={{ color: "#fff", fontSize: 14, fontWeight: 500, flex: 1, wordBreak: "break-all" }}>
                      {link.label}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/*  SOCIAL MEDIA section                                        */}
        {/* ============================================================ */}
        {socialLinks.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.35)", marginBottom: 10, paddingLeft: 4,
            }}>
              Social Media
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {socialLinks.map((link) => {
                const Icon = ICON_MAP[link.key];
                const color = SOCIAL_COLORS[link.key] || theme.primaryColor;
                return (
                  <a
                    key={link.key}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 16px", borderRadius: 14,
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                      textDecoration: "none", transition: "all 0.2s",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: `${color}15`, border: `1px solid ${color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {Icon && <Icon size={20} color={color} />}
                    </div>
                    <span style={{ color: "#fff", fontSize: 14, fontWeight: 500, flex: 1 }}>
                      {link.label}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/*  NOTE section                                                */}
        {/* ============================================================ */}
        {vcard.note && (
          <div style={{ marginTop: 24 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.35)", marginBottom: 10, paddingLeft: 4,
            }}>
              O mnie
            </div>
            <div style={{
              padding: "16px 18px", borderRadius: 14,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.7)",
              whiteSpace: "pre-wrap",
            }}>
              {vcard.note}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/*  FOOTER                                                      */}
        {/* ============================================================ */}
        <div style={{ marginTop: 40, textAlign: "center", paddingBottom: 16 }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontWeight: 500 }}>
            Powered by{" "}
            <a href="https://twojenfc.pl" style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>
              TwojeNFC.pl
            </a>
          </p>
        </div>

      </div>
    </main>
  );
}
