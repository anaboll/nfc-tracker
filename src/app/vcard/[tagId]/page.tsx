import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import VCardActions from "./VCardActions";
import VCardTrackedLinks from "./VCardTrackedLinks";
import type { VCardData, VCardTheme } from "@/types/vcard";
import { DEFAULT_VCARD_THEME } from "@/types/vcard";
import {
  PhoneIcon, EmailIcon, WebsiteIcon, AddressIcon,
  InstagramIcon, FacebookIcon, LinkedInIcon, WhatsAppIcon,
  TikTokIcon, YouTubeIcon, TelegramIcon, NoteIcon,
  SOCIAL_COLORS,
} from "@/components/vcard/SocialIcons";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Normalize photo path: old "/uploads/x" → "/api/uploads/x" */
function photoSrc(photo: string | undefined | null): string {
  if (!photo) return "";
  if (photo.startsWith("/api/uploads/")) return photo;
  if (photo.startsWith("/uploads/")) return `/api${photo}`;
  return photo;
}

type ResolvedTheme = Required<VCardTheme>;

function resolveTheme(raw?: VCardTheme): ResolvedTheme {
  const t = { ...DEFAULT_VCARD_THEME, ...(raw || {}) };
  // Auto avatar border color from primary
  if (!t.avatarBorderColor) {
    t.avatarBorderColor = t.primaryColor + "40";
  }
  return t;
}

function getBackground(t: ResolvedTheme): string {
  if (t.bgMode === "solid") return t.bgSolidColor || t.bgGradientFrom;
  return `linear-gradient(135deg, ${t.bgGradientFrom} 0%, ${t.bgGradientTo} 100%)`;
}

function getPatternOverlay(t: ResolvedTheme): React.CSSProperties | null {
  if (t.bgPattern === "none") return null;
  const base: React.CSSProperties = {
    position: "absolute" as const,
    inset: 0,
    pointerEvents: "none" as const,
    zIndex: 0,
  };
  switch (t.bgPattern) {
    case "dots":
      return {
        ...base,
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      };
    case "grid":
      return {
        ...base,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      };
    case "waves":
      return {
        ...base,
        backgroundImage:
          `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.015) 10px, rgba(255,255,255,0.015) 20px)`,
      };
    default:
      return null;
  }
}

function getLinkRadius(style: string): number {
  switch (style) {
    case "pill": return 50;
    case "square": return 4;
    default: return 8;
  }
}

function getIconBoxRadius(style: string): number {
  switch (style) {
    case "circle": return 50;
    case "square": return 4;
    case "pill": return 12;
    default: return 8; // rounded
  }
}

function getAvatarRadius(shape: string): string {
  switch (shape) {
    case "rounded-square": return "16px";
    case "square": return "4px";
    default: return "50%";
  }
}

function getFontStack(family: string): string {
  switch (family) {
    case "inter": return "'Inter', system-ui, -apple-system, sans-serif";
    case "serif": return "'Georgia', 'Times New Roman', serif";
    case "poppins": return "'Poppins', system-ui, -apple-system, sans-serif";
    case "montserrat": return "'Montserrat', system-ui, -apple-system, sans-serif";
    case "playfair": return "'Playfair Display', Georgia, serif";
    case "raleway": return "'Raleway', system-ui, -apple-system, sans-serif";
    case "dm-sans": return "'DM Sans', system-ui, -apple-system, sans-serif";
    default: return "var(--font-geist-sans), system-ui, -apple-system, sans-serif";
  }
}

/** Google Fonts URL for premium fonts */
function getGoogleFontsUrl(family: string): string | null {
  const fontsMap: Record<string, string> = {
    poppins: "Poppins:wght@300;400;500;600;700;800",
    montserrat: "Montserrat:wght@300;400;500;600;700;800",
    playfair: "Playfair+Display:wght@400;500;600;700;800",
    raleway: "Raleway:wght@300;400;500;600;700;800",
    "dm-sans": "DM+Sans:wght@300;400;500;600;700;800",
    inter: "Inter:wght@300;400;500;600;700;800",
  };
  if (!fontsMap[family]) return null;
  return `https://fonts.googleapis.com/css2?family=${fontsMap[family]}&display=swap`;
}

/** Detect if background is light (for text color) */
function isLightBg(t: ResolvedTheme): boolean {
  const hex = t.bgMode === "solid" ? (t.bgSolidColor || t.bgGradientFrom) : t.bgGradientFrom;
  if (!hex || !hex.startsWith("#")) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function VCardPage({
  params,
  searchParams,
}: {
  params: { tagId: string };
  searchParams: { from?: string };
}) {
  const fromDashboard = searchParams.from === "dashboard";

  // Support "tagId::nfcChipId" separator (same as /s/ route)
  // Next.js may URL-encode the params, so decode first
  const rawTagId = decodeURIComponent(params.tagId);
  const baseTagId = rawTagId.includes("::") ? rawTagId.substring(0, rawTagId.indexOf("::")) : rawTagId;

  let tag = await prisma.tag.findUnique({
    where: { id: rawTagId, isActive: true },
  });
  // Fallback: try without NFC UID suffix
  if (!tag && baseTagId !== rawTagId) {
    tag = await prisma.tag.findUnique({
      where: { id: baseTagId, isActive: true },
    });
  }

  if (!tag || tag.tagType !== "vcard") {
    notFound();
  }

  const vcard = tag.links as unknown as VCardData;
  if (!vcard) notFound();

  const fullName = [vcard.firstName, vcard.lastName].filter(Boolean).join(" ");
  const theme = resolveTheme(vcard.theme);
  const light = isLightBg(theme);

  // Text colors adapt to light/dark background
  const textPrimary = light ? "#1e293b" : "#fff";
  const textSecondary = light ? "rgba(30,41,59,0.6)" : "rgba(255,255,255,0.6)";
  const textMuted = light ? "rgba(30,41,59,0.35)" : "rgba(255,255,255,0.35)";
  const cardBg = light ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.05)";
  const cardBorder = light ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const footerColor = light ? "rgba(30,41,59,0.2)" : "rgba(255,255,255,0.2)";
  const footerLinkColor = light ? "rgba(30,41,59,0.3)" : "rgba(255,255,255,0.3)";

  const linkRadius = getLinkRadius(theme.buttonStyle);
  const iconRadius = getIconBoxRadius(theme.socialIconStyle);
  const avatarRadius = getAvatarRadius(theme.avatarShape);
  const fontStack = getFontStack(theme.fontFamily);
  const patternStyle = getPatternOverlay(theme);

  /* -- Build contact links -- */
  const contactMap: Record<string, { key: string; label: string; url: string }> = {};
  if (vcard.phone) contactMap.phone = { key: "phone", label: vcard.phone, url: `tel:${vcard.phone}` };
  if (vcard.email) contactMap.email = { key: "email", label: vcard.email, url: `mailto:${vcard.email}` };
  if (vcard.website) contactMap.website = { key: "website", label: vcard.website.replace(/^https?:\/\//, ""), url: vcard.website.startsWith("http") ? vcard.website : `https://${vcard.website}` };
  if (vcard.address) contactMap.address = { key: "address", label: vcard.address, url: `https://maps.google.com/?q=${encodeURIComponent(vcard.address)}` };

  const contactOrder = vcard.contactOrder || ["phone", "email", "website", "address"];
  const contactLinks = contactOrder
    .filter((k) => contactMap[k])
    .map((k) => contactMap[k]);

  const socialMap: Record<string, { key: string; label: string; url: string }> = {};
  if (vcard.instagram) socialMap.instagram = { key: "instagram", label: "Instagram", url: vcard.instagram.startsWith("http") ? vcard.instagram : `https://instagram.com/${vcard.instagram.replace(/^@/, "")}` };
  if (vcard.facebook) socialMap.facebook = { key: "facebook", label: "Facebook", url: vcard.facebook.startsWith("http") ? vcard.facebook : `https://facebook.com/${vcard.facebook}` };
  if (vcard.linkedin) socialMap.linkedin = { key: "linkedin", label: "LinkedIn", url: vcard.linkedin.startsWith("http") ? vcard.linkedin : `https://linkedin.com/in/${vcard.linkedin}` };
  if (vcard.whatsapp) socialMap.whatsapp = { key: "whatsapp", label: "WhatsApp", url: `https://wa.me/${vcard.whatsapp.replace(/[^0-9+]/g, "")}` };
  if (vcard.tiktok) socialMap.tiktok = { key: "tiktok", label: "TikTok", url: vcard.tiktok.startsWith("http") ? vcard.tiktok : `https://tiktok.com/@${vcard.tiktok.replace(/^@/, "")}` };
  if (vcard.youtube) socialMap.youtube = { key: "youtube", label: "YouTube", url: vcard.youtube.startsWith("http") ? vcard.youtube : `https://youtube.com/@${vcard.youtube.replace(/^@/, "")}` };
  if (vcard.telegram) socialMap.telegram = { key: "telegram", label: "Telegram", url: vcard.telegram.startsWith("http") ? vcard.telegram : `https://t.me/${vcard.telegram.replace(/^@/, "")}` };

  const socialOrder = vcard.socialOrder || ["instagram", "facebook", "linkedin", "whatsapp", "tiktok", "youtube", "telegram"];
  const socialLinks = socialOrder
    .filter((k) => socialMap[k])
    .map((k) => socialMap[k]);

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

  /* -- Link card styles -- */
  const linkCardStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 16px",
    borderRadius: linkRadius,
    background: cardBg,
    border: `1px solid ${cardBorder}`,
    textDecoration: "none",
    transition: "all 0.2s",
    backdropFilter: "blur(8px)",
  };

  const iconBoxStyle = (color: string): React.CSSProperties => ({
    width: 44,
    height: 44,
    borderRadius: iconRadius,
    background: `${color}15`,
    border: `1px solid ${color}30`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  });

  /* -- Minimal layout: social links as icon row -- */
  const isMinimal = theme.layoutVariant === "minimal";
  const isModern = theme.layoutVariant === "modern";
  const googleFontsUrl = getGoogleFontsUrl(theme.fontFamily);

  return (
    <>
      {/* Load Google Fonts if premium font selected */}
      {googleFontsUrl && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={googleFontsUrl} />
      )}
      <main
        className="min-h-screen flex flex-col items-center px-4 py-8"
        style={{
          background: getBackground(theme),
          fontFamily: fontStack,
          position: "relative",
        }}
      >
      {/* Pattern overlay */}
      {patternStyle && <div style={patternStyle} />}

      {/* Back to dashboard button */}
      {fromDashboard && (
        <a href="/dashboard" className="vcard-edit-back-btn" style={{ position: "relative", zIndex: 2 }}>
          ← Wroc do panelu
        </a>
      )}

      <div className="w-full" style={{ maxWidth: 440, position: "relative", zIndex: 1 }}>

        {/* ============================================================ */}
        {/*  HEADER — photo/initials + name + title                      */}
        {/* ============================================================ */}
        <div className="text-center" style={{ marginBottom: isModern ? 32 : 24 }}>
          {/* Avatar */}
          {vcard.photo ? (
            <div style={{
              width: 140,
              height: 140,
              borderRadius: avatarRadius,
              margin: "0 auto 16px",
              overflow: "hidden",
              border: `${theme.avatarBorderWidth}px solid ${theme.avatarBorderColor}`,
              boxShadow: `0 0 30px ${theme.primaryColor}20`,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoSrc(vcard.photo)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ) : (
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: avatarRadius,
                margin: "0 auto 16px",
                background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.primaryColor}88)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
                fontWeight: 700,
                color: "#fff",
                boxShadow: `0 0 30px ${theme.primaryColor}20`,
              }}
            >
              {vcard.firstName?.[0]?.toUpperCase() || ""}{vcard.lastName?.[0]?.toUpperCase() || ""}
            </div>
          )}

          <h1 style={{
            fontSize: isModern ? 30 : 26,
            fontWeight: 700,
            color: textPrimary,
            marginBottom: 4,
            letterSpacing: "-0.01em",
          }}>
            {fullName}
          </h1>
          {vcard.jobTitle && (
            <p style={{ fontSize: 14, color: textSecondary, marginBottom: 2 }}>{vcard.jobTitle}</p>
          )}
          {vcard.company && (
            <p style={{ fontSize: 14, fontWeight: 600, color: theme.primaryColor }}>{vcard.company}</p>
          )}
        </div>

        {/* ============================================================ */}
        {/*  SAVE CONTACT BUTTON                                         */}
        {/* ============================================================ */}
        <VCardActions
          vcfBase64={vcfBase64}
          fullName={fullName}
          primaryColor={theme.primaryColor}
          buttonStyle={theme.buttonStyle}
          buttonVariant={theme.buttonVariant}
        />

        {/* ============================================================ */}
        {/*  CONTACT + SOCIAL MEDIA (tracked clicks)                     */}
        {/* ============================================================ */}
        <VCardTrackedLinks
          tagId={params.tagId}
          contactLinks={contactLinks}
          socialLinks={socialLinks}
          linkCardStyle={linkCardStyle}
          iconBoxStyleFn={
            [...contactLinks, ...socialLinks].reduce((acc, link) => {
              const color = SOCIAL_COLORS[link.key] || theme.primaryColor;
              acc[link.key] = iconBoxStyle(color);
              return acc;
            }, {} as Record<string, React.CSSProperties>)
          }
          textPrimary={textPrimary}
          textMuted={textMuted}
          isMinimal={isMinimal}
          iconMap={{}}
          socialColors={SOCIAL_COLORS}
          primaryColor={theme.primaryColor}
          websiteLogo={vcard.websiteLogo || ""}
          contactDisplayMode={vcard.contactDisplayMode || "value"}
          contactHeaderText={vcard.contactHeaderText}
          socialHeaderText={vcard.socialHeaderText}
          hiddenFields={vcard.hiddenFields || []}
        />

        {/* ============================================================ */}
        {/*  NOTE section                                                */}
        {/* ============================================================ */}
        {vcard.note && (
          <div style={{ marginTop: 24 }}>
            {!isMinimal && (
              <div style={{
                fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                color: textMuted, marginBottom: 10, paddingLeft: 4,
              }}>
                O mnie
              </div>
            )}
            <div style={{
              padding: "16px 18px",
              borderRadius: linkRadius,
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              fontSize: 14,
              lineHeight: 1.7,
              color: textSecondary,
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
          <p style={{ fontSize: 11, color: footerColor, fontWeight: 500 }}>
            Powered by{" "}
            <a href="https://twojenfc.pl" style={{ color: footerLinkColor, textDecoration: "none" }}>
              TwojeNFC.pl
            </a>
          </p>
        </div>

      </div>
    </main>
    </>
  );
}
