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
import VCardActions from "./VCardActions";
import VCardTrackedLinks from "./VCardTrackedLinks";
import type { VCardData, VCardTheme } from "@/types/vcard";
import { DEFAULT_VCARD_THEME, FIELD_LABELS, computeDisplayItems } from "@/types/vcard";
import type { RenderItem } from "./VCardTrackedLinks";
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
  searchParams: { from?: string; source?: string };
}) {
  const fromDashboard = searchParams.from === "dashboard";

  // Support "tagId::nfcChipId" — strip NFC UID suffix if present
  const decoded = decodeURIComponent(params.tagId);
  const hasChipId = decoded.includes("::");
  const tagId = hasChipId ? decoded.substring(0, decoded.indexOf("::")) : decoded;
  const nfcId = hasChipId ? decoded.substring(decoded.indexOf("::") + 2) : null;

  const tag = await prisma.tag.findUnique({
    where: { id: tagId, isActive: true },
  });

  if (!tag || tag.tagType !== "vcard") {
    notFound();
  }

  /* ------------------------------------------------------------------ */
  /*  Record scan for direct NFC/QR access (not from /s/ redirect)       */
  /* ------------------------------------------------------------------ */
  const isDirectAccess = hasChipId || searchParams.source === "qr";
  if (isDirectAccess && !fromDashboard) {
    try {
      const hdrs = headers();
      const referer = hdrs.get("referer") || "";
      const isFromRedirect = referer.includes(`/s/${tagId}`);

      if (!isFromRedirect) {
        const cleanedIp = extractCleanIp(
          hdrs.get("x-forwarded-for"),
          hdrs.get("x-real-ip"),
          hdrs.get("cf-connecting-ip"),
        );
        const ipHash = hashIp(cleanedIp);

        // 30-second dedup window
        const recentScan = await prisma.scan.findFirst({
          where: { tagId, ipHash, timestamp: { gte: new Date(Date.now() - 30000) } },
        });

        if (!recentScan) {
          const userAgent = hdrs.get("user-agent") || "";
          const browserLang = hdrs.get("accept-language")?.split(",")[0]?.split(";")[0]?.trim() || null;
          const isReturning = (await prisma.scan.count({ where: { ipHash, tagId } })) > 0;
          let geo = { city: null as string | null, country: null as string | null, region: null as string | null };
          try { geo = await getGeoLocation(cleanedIp); } catch { /* geo failed */ }

          const cookieStore = cookies();
          const { visitorId, sessionId } = resolveVisitorSessionFromCookies(cookieStore);
          const ipVer = ipVersion(cleanedIp);
          const ipPfx = ipPrefix(cleanedIp);
          const device = detectDeviceType(userAgent);
          const eventSource = hasChipId ? "nfc" : (searchParams.source || null);

          let pageUrl: URL;
          try {
            const proto = hdrs.get("x-forwarded-proto") || "https";
            const host = hdrs.get("host") || "twojenfc.pl";
            pageUrl = new URL(`${proto}://${host}/vcard/${decoded}`);
          } catch { pageUrl = new URL(`https://twojenfc.pl/vcard/${decoded}`); }
          const utm = extractUtm(pageUrl);
          const rawMeta = buildRawMeta(hdrs, pageUrl);

          try {
            await prisma.scan.create({
              data: {
                tagId, ipHash,
                deviceType: device,
                userAgent: truncateField(userAgent) || null,
                browserLang,
                city: geo.city, country: geo.country, region: geo.region,
                isReturning,
                referrer: truncateField(referer) || null,
                eventSource,
                ...(nfcId ? { nfcId } : {}),
                visitorId, sessionId,
                ...utm,
                acceptLanguage: truncateField(hdrs.get("accept-language"), 500) || null,
                path: `/vcard/${decoded}`,
                query: null,
                rawMeta,
                ipPrefix: ipPfx,
                ipVersion: ipVer,
              },
            });
          } catch (err) {
            if (isSchemaMismatchError(err)) {
              await prisma.scan.create({
                data: {
                  tagId, ipHash,
                  deviceType: device,
                  userAgent: truncateField(userAgent) || null,
                  browserLang,
                  isReturning: false,
                  referrer: truncateField(referer) || null,
                  eventSource,
                },
              });
            } else {
              console.error("vCard scan record error:", err);
            }
          }
        }
      }
    } catch (err) {
      console.error("vCard direct scan tracking error:", err);
    }
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

  /* -- Build field data map -- */
  const fieldData: Record<string, { label: string; url: string }> = {};
  if (vcard.phone) fieldData.phone = { label: vcard.phone, url: `tel:${vcard.phone}` };
  if (vcard.email) fieldData.email = { label: vcard.email, url: `mailto:${vcard.email}` };
  if (vcard.website) fieldData.website = { label: vcard.website.replace(/^https?:\/\//, ""), url: vcard.website.startsWith("http") ? vcard.website : `https://${vcard.website}` };
  if (vcard.address) fieldData.address = { label: vcard.address, url: `https://maps.google.com/?q=${encodeURIComponent(vcard.address)}` };
  if (vcard.instagram) fieldData.instagram = { label: "Instagram", url: vcard.instagram.startsWith("http") ? vcard.instagram : `https://instagram.com/${vcard.instagram.replace(/^@/, "")}` };
  if (vcard.facebook) fieldData.facebook = { label: "Facebook", url: vcard.facebook.startsWith("http") ? vcard.facebook : `https://facebook.com/${vcard.facebook}` };
  if (vcard.linkedin) fieldData.linkedin = { label: "LinkedIn", url: vcard.linkedin.startsWith("http") ? vcard.linkedin : `https://linkedin.com/in/${vcard.linkedin}` };
  if (vcard.whatsapp) fieldData.whatsapp = { label: "WhatsApp", url: `https://wa.me/${vcard.whatsapp.replace(/[^0-9+]/g, "")}` };
  if (vcard.tiktok) fieldData.tiktok = { label: "TikTok", url: vcard.tiktok.startsWith("http") ? vcard.tiktok : `https://tiktok.com/@${vcard.tiktok.replace(/^@/, "")}` };
  if (vcard.youtube) fieldData.youtube = { label: "YouTube", url: vcard.youtube.startsWith("http") ? vcard.youtube : `https://youtube.com/@${vcard.youtube.replace(/^@/, "")}` };
  if (vcard.telegram) fieldData.telegram = { label: "Telegram", url: vcard.telegram.startsWith("http") ? vcard.telegram : `https://t.me/${vcard.telegram.replace(/^@/, "")}` };

  /* -- Compute unified render items -- */
  const displayItems = computeDisplayItems(vcard);
  const renderItems: RenderItem[] = [];
  for (const item of displayItems) {
    if (item.visible === false) continue;
    if (item.type === "header") {
      renderItems.push({ type: "header", key: item.key, text: item.text });
    } else if (item.type === "custom-link") {
      if (item.url) {
        // Allow absolute http(s) URLs, site-relative paths ("/api/uploads/...pdf"),
        // tel:/mailto: protocols as-is. Only bare domains get auto-prefixed.
        const u = item.url;
        const isAlreadyAbsolute = /^(https?:\/\/|\/|mailto:|tel:)/i.test(u);
        renderItems.push({
          type: "custom-link", key: item.key,
          url: isAlreadyAbsolute ? u : `https://${u}`,
          label: item.label || u,
          logo: item.logo,
        });
      }
    } else {
      const data = fieldData[item.key];
      if (data) {
        // showLabel: true (default) → use custom label or FIELD_LABELS; false → show raw value
        const useLabel = item.showLabel !== undefined ? item.showLabel : true;
        const displayLabel = useLabel
          ? (item.label || FIELD_LABELS[item.key] || data.label)
          : data.label;
        renderItems.push({ type: "field", key: item.key, url: data.url, label: displayLabel });
      }
    }
  }

  /* All field keys for icon box styles */
  const allFieldKeys = renderItems.filter(i => i.type === "field" || i.type === "custom-link");

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

  /* -- Row customization (fallback to defaults when theme fields are missing) -- */
  const rowPadding = theme.rowPadding ?? 14;
  const rowIconSize = theme.rowIconSize ?? 44;
  const rowFontSize = theme.rowFontSize ?? 14;
  const rowFontStack = getFontStack(theme.rowFontFamily || theme.fontFamily);

  /* -- Link card styles -- */
  const linkCardStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: `${rowPadding}px 16px`,
    borderRadius: linkRadius,
    background: cardBg,
    border: `1px solid ${cardBorder}`,
    textDecoration: "none",
    transition: "all 0.2s",
    backdropFilter: "blur(8px)",
    fontFamily: rowFontStack,
    fontSize: rowFontSize,
  };

  const iconBoxStyle = (color: string): React.CSSProperties => ({
    width: rowIconSize,
    height: rowIconSize,
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

          {/* Main heading: full name if available, otherwise company as big headline */}
          <h1 style={{
            fontSize: isModern ? 30 : 26,
            fontWeight: 700,
            color: textPrimary,
            marginBottom: 4,
            letterSpacing: "-0.01em",
          }}>
            {fullName || vcard.company || ""}
          </h1>
          {vcard.jobTitle && (
            <p style={{ fontSize: 14, color: textSecondary, marginBottom: 2 }}>{vcard.jobTitle}</p>
          )}
          {/* Company only shown as accent subtitle when a person name is present above */}
          {fullName && vcard.company && (
            <p style={{ fontSize: 14, fontWeight: 600, color: theme.primaryColor }}>{vcard.company}</p>
          )}
          {vcard.slogan && (
            <p style={{ fontSize: 13, color: textSecondary, marginTop: 4, fontStyle: "italic" }}>{vcard.slogan}</p>
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
          tagId={tagId}
          items={renderItems}
          linkCardStyle={linkCardStyle}
          iconBoxStyleFn={
            allFieldKeys.reduce((acc, item) => {
              const color = SOCIAL_COLORS[item.key] || theme.primaryColor;
              acc[item.key] = iconBoxStyle(color);
              return acc;
            }, {} as Record<string, React.CSSProperties>)
          }
          defaultIconBoxStyle={iconBoxStyle(theme.primaryColor)}
          textPrimary={textPrimary}
          textMuted={textMuted}
          isMinimal={isMinimal}
          primaryColor={theme.primaryColor}
          websiteLogo={vcard.websiteLogo || ""}
          rowFontSize={rowFontSize}
          rowIconInner={Math.round(rowIconSize * 0.45)}
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
