"use client";

import React from "react";
import type { VCardData, VCardTheme, ButtonStyle, ButtonVariant } from "@/types/vcard";
import { DEFAULT_VCARD_THEME } from "@/types/vcard";
import {
  PhoneIcon, EmailIcon, WebsiteIcon, AddressIcon,
  InstagramIcon, FacebookIcon, LinkedInIcon, WhatsAppIcon,
  TikTokIcon, YouTubeIcon, TelegramIcon,
  SOCIAL_COLORS,
} from "@/components/vcard/SocialIcons";
import { getContrastTextColor } from "@/lib/color-contrast";

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
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    zIndex: 0,
  };
  switch (t.bgPattern) {
    case "dots":
      return { ...base, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "20px 20px" };
    case "grid":
      return { ...base, backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "24px 24px" };
    case "waves":
      return { ...base, backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.015) 10px, rgba(255,255,255,0.015) 20px)" };
    default:
      return null;
  }
}

function getLinkRadius(style: string): number {
  switch (style) { case "pill": return 50; case "square": return 4; default: return 8; }
}

function getIconBoxRadius(style: string): number {
  switch (style) { case "circle": return 50; case "square": return 4; case "pill": return 12; default: return 8; }
}

function getAvatarRadius(shape: string): string {
  switch (shape) { case "rounded-square": return "16px"; case "square": return "4px"; default: return "50%"; }
}

function getFontStack(family: string): string {
  switch (family) {
    case "inter": return "'Inter', system-ui, -apple-system, sans-serif";
    case "serif": return "'Georgia', 'Times New Roman', serif";
    default: return "var(--font-geist-sans), system-ui, -apple-system, sans-serif";
  }
}

function isLightBg(t: ResolvedTheme): boolean {
  const hex = t.bgMode === "solid" ? (t.bgSolidColor || t.bgGradientFrom) : t.bgGradientFrom;
  if (!hex || !hex.startsWith("#") || hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

function getButtonRadius(style: ButtonStyle): number {
  switch (style) { case "pill": return 50; case "square": return 4; default: return 8; }
}

/* ------------------------------------------------------------------ */
/*  Build links arrays                                                 */
/* ------------------------------------------------------------------ */

function buildContactLinks(vcard: VCardData) {
  return [
    vcard.phone && { key: "phone", label: vcard.phone, url: `tel:${vcard.phone}` },
    vcard.email && { key: "email", label: vcard.email, url: `mailto:${vcard.email}` },
    vcard.website && { key: "website", label: vcard.website.replace(/^https?:\/\//, ""), url: vcard.website.startsWith("http") ? vcard.website : `https://${vcard.website}` },
    vcard.address && { key: "address", label: vcard.address, url: `https://maps.google.com/?q=${encodeURIComponent(vcard.address)}` },
  ].filter(Boolean) as { key: string; label: string; url: string }[];
}

function buildSocialLinks(vcard: VCardData) {
  return [
    vcard.instagram && { key: "instagram", label: "Instagram", url: vcard.instagram.startsWith("http") ? vcard.instagram : `https://instagram.com/${vcard.instagram.replace(/^@/, "")}` },
    vcard.facebook && { key: "facebook", label: "Facebook", url: vcard.facebook.startsWith("http") ? vcard.facebook : `https://facebook.com/${vcard.facebook}` },
    vcard.linkedin && { key: "linkedin", label: "LinkedIn", url: vcard.linkedin.startsWith("http") ? vcard.linkedin : `https://linkedin.com/in/${vcard.linkedin}` },
    vcard.whatsapp && { key: "whatsapp", label: "WhatsApp", url: `https://wa.me/${vcard.whatsapp.replace(/[^0-9+]/g, "")}` },
    vcard.tiktok && { key: "tiktok", label: "TikTok", url: vcard.tiktok.startsWith("http") ? vcard.tiktok : `https://tiktok.com/@${vcard.tiktok.replace(/^@/, "")}` },
    vcard.youtube && { key: "youtube", label: "YouTube", url: vcard.youtube.startsWith("http") ? vcard.youtube : `https://youtube.com/@${vcard.youtube.replace(/^@/, "")}` },
    vcard.telegram && { key: "telegram", label: "Telegram", url: vcard.telegram.startsWith("http") ? vcard.telegram : `https://t.me/${vcard.telegram.replace(/^@/, "")}` },
  ].filter(Boolean) as { key: string; label: string; url: string }[];
}

/* ------------------------------------------------------------------ */
/*  Icon map                                                           */
/* ------------------------------------------------------------------ */

const ICON_MAP: Record<string, React.FC<{ size?: number; color?: string }>> = {
  phone: PhoneIcon, email: EmailIcon, website: WebsiteIcon, address: AddressIcon,
  instagram: InstagramIcon, facebook: FacebookIcon, linkedin: LinkedInIcon,
  whatsapp: WhatsAppIcon, tiktok: TikTokIcon, youtube: YouTubeIcon, telegram: TelegramIcon,
};

/* ------------------------------------------------------------------ */
/*  Save Contact Button (inline — no server-side vcf needed)           */
/* ------------------------------------------------------------------ */

function SaveContactButton({
  vcard,
  primaryColor,
  buttonStyle,
  buttonVariant,
  textColor,
}: {
  vcard: VCardData;
  primaryColor: string;
  buttonStyle: ButtonStyle;
  buttonVariant: ButtonVariant;
  textColor: string;
}) {
  const fullName = [vcard.firstName, vcard.lastName].filter(Boolean).join(" ");

  const handleSave = () => {
    const vcfLines = [
      "BEGIN:VCARD", "VERSION:3.0",
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
    const blob = new Blob([vcfLines], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fullName.replace(/\s+/g, "_")}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const radius = getButtonRadius(buttonStyle);
  const base: React.CSSProperties = {
    width: "100%", padding: "14px 0", borderRadius: radius,
    fontWeight: 700, fontSize: 15, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    transition: "opacity 0.2s, transform 0.2s",
  };
  const variant: React.CSSProperties =
    buttonVariant === "outline"
      ? { background: "transparent", border: `2px solid ${primaryColor}`, color: primaryColor, boxShadow: "none" }
      : buttonVariant === "ghost"
      ? { background: `${primaryColor}15`, border: "1px solid transparent", color: primaryColor, boxShadow: "none" }
      : { background: primaryColor, border: "none", color: getContrastTextColor(primaryColor), boxShadow: `0 4px 20px ${primaryColor}40` };

  void textColor; // available for future use

  return (
    <button onClick={handleSave} style={{ ...base, ...variant }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
      Zapisz kontakt
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  VCardRenderer — shared between public page & live preview          */
/* ------------------------------------------------------------------ */

interface VCardRendererProps {
  vcard: VCardData;
  themeOverride?: VCardTheme;
  /** If true, don't show the save contact button (for preview) */
  hideSaveButton?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function VCardRenderer({
  vcard,
  themeOverride,
  hideSaveButton = false,
  className,
  style: extraStyle,
}: VCardRendererProps) {
  const theme = resolveTheme(themeOverride || vcard.theme);
  const light = isLightBg(theme);
  const fullName = [vcard.firstName, vcard.lastName].filter(Boolean).join(" ");

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
  const isMinimal = theme.layoutVariant === "minimal";
  const isModern = theme.layoutVariant === "modern";

  const contactLinks = buildContactLinks(vcard);
  const socialLinks = buildSocialLinks(vcard);

  const linkCardStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 14,
    padding: "14px 16px", borderRadius: linkRadius,
    background: cardBg, border: `1px solid ${cardBorder}`,
    textDecoration: "none", transition: "all 0.2s",
    backdropFilter: "blur(8px)",
  };

  const iconBoxStyle = (color: string): React.CSSProperties => ({
    width: 44, height: 44, borderRadius: iconRadius,
    background: `${color}15`, border: `1px solid ${color}30`,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  });

  return (
    <div
      className={className}
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: theme.avatarTopGap,   // ABSOLUTE top padding (0 = top edge, 32 = default)
        paddingBottom: 32,
        paddingLeft: 16,
        paddingRight: 16,
        background: getBackground(theme),
        fontFamily: fontStack,
        position: "relative",
        ...extraStyle,
      }}
    >
      {patternStyle && <div style={patternStyle} />}

      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: theme.headerBottomGap }}>
          {vcard.photo ? (
            <div style={{
              width: isModern ? 140 : 120, height: isModern ? 140 : 120,
              borderRadius: avatarRadius, margin: `0 auto ${theme.avatarNameGap}px`,
              overflow: "hidden",
              border: `${theme.avatarBorderWidth}px solid ${theme.avatarBorderColor}`,
              boxShadow: `0 0 30px ${theme.primaryColor}20`,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoSrc(vcard.photo)}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          ) : (
            <div style={{
              width: isModern ? 140 : 120, height: isModern ? 140 : 120,
              borderRadius: avatarRadius, margin: `0 auto ${theme.avatarNameGap}px`,
              background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.primaryColor}88)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: isModern ? 48 : 42, fontWeight: 700, color: "#fff",
              boxShadow: `0 0 30px ${theme.primaryColor}20`,
            }}>
              {vcard.firstName?.[0]?.toUpperCase() || ""}{vcard.lastName?.[0]?.toUpperCase() || ""}
            </div>
          )}

          <h1 style={{ fontSize: isModern ? 30 : 26, fontWeight: 700, color: textPrimary, marginBottom: 4, letterSpacing: "-0.01em" }}>
            {fullName || "Imie Nazwisko"}
          </h1>
          {vcard.jobTitle && <p style={{ fontSize: 14, color: textSecondary, marginBottom: 2 }}>{vcard.jobTitle}</p>}
          {vcard.company && <p style={{ fontSize: 14, fontWeight: 600, color: theme.primaryColor }}>{vcard.company}</p>}
        </div>

        {/* Save Contact */}
        {!hideSaveButton && (
          <SaveContactButton
            vcard={vcard}
            primaryColor={theme.primaryColor}
            buttonStyle={theme.buttonStyle}
            buttonVariant={theme.buttonVariant}
            textColor={textPrimary}
          />
        )}

        {/* Contact */}
        {contactLinks.length > 0 && (
          <div style={{ marginTop: theme.buttonRowGap }}>
            {!isMinimal && (
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: textMuted, marginBottom: 10, paddingLeft: 4 }}>
                Kontakt
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: theme.rowGap }}>
              {contactLinks.map((link) => {
                const Icon = ICON_MAP[link.key];
                const color = SOCIAL_COLORS[link.key] || theme.primaryColor;
                return (
                  <a key={link.key} href={link.url} target={link.key === "phone" ? "_self" : "_blank"} rel="noopener noreferrer" style={linkCardStyle}>
                    <div style={iconBoxStyle(color)}>{Icon && <Icon size={20} color={color} />}</div>
                    <span style={{ color: textPrimary, fontSize: 14, fontWeight: 500, flex: 1, wordBreak: "break-all" }}>{link.label}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Social */}
        {socialLinks.length > 0 && (
          <div style={{ marginTop: contactLinks.length > 0 ? 16 : theme.buttonRowGap }}>
            {!isMinimal && (
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: textMuted, marginBottom: 10, paddingLeft: 4 }}>
                Social Media
              </div>
            )}
            {isMinimal ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                {socialLinks.map((link) => {
                  const Icon = ICON_MAP[link.key];
                  const color = SOCIAL_COLORS[link.key] || theme.primaryColor;
                  return (
                    <a key={link.key} href={link.url} target="_blank" rel="noopener noreferrer" style={iconBoxStyle(color)} title={link.label}>
                      {Icon && <Icon size={20} color={color} />}
                    </a>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: theme.rowGap }}>
                {socialLinks.map((link) => {
                  const Icon = ICON_MAP[link.key];
                  const color = SOCIAL_COLORS[link.key] || theme.primaryColor;
                  return (
                    <a key={link.key} href={link.url} target="_blank" rel="noopener noreferrer" style={linkCardStyle}>
                      <div style={iconBoxStyle(color)}>{Icon && <Icon size={20} color={color} />}</div>
                      <span style={{ color: textPrimary, fontSize: 14, fontWeight: 500, flex: 1 }}>{link.label}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Note */}
        {vcard.note && (
          <div style={{ marginTop: 24 }}>
            {!isMinimal && (
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: textMuted, marginBottom: 10, paddingLeft: 4 }}>
                O mnie
              </div>
            )}
            <div style={{
              padding: "16px 18px", borderRadius: linkRadius,
              background: cardBg, border: `1px solid ${cardBorder}`,
              fontSize: 14, lineHeight: 1.7, color: textSecondary, whiteSpace: "pre-wrap",
            }}>
              {vcard.note}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 40, textAlign: "center", paddingBottom: 16 }}>
          <p style={{ fontSize: 11, color: footerColor, fontWeight: 500 }}>
            Powered by{" "}
            <a href="https://twojenfc.pl" style={{ color: footerLinkColor, textDecoration: "none" }}>TwojeNFC.pl</a>
          </p>
        </div>
      </div>
    </div>
  );
}
