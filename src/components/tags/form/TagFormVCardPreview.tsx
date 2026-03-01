"use client";

import React, { useDeferredValue, useEffect } from "react";
import type { VCardData, VCardTheme } from "@/types/vcard";
import { DEFAULT_VCARD_THEME } from "@/types/vcard";
import { SOCIAL_ICONS, SOCIAL_COLORS } from "@/components/vcard/SocialIcons";

interface Props {
  tagType: string;
  vcard: VCardData;
  tagId: string;
}

/* ------------------------------------------------------------------ */
/*  Theme helpers (mirror public vcard page logic)                     */
/* ------------------------------------------------------------------ */

type ResolvedTheme = Required<VCardTheme>;

function resolveTheme(raw?: VCardTheme): ResolvedTheme {
  const t = { ...DEFAULT_VCARD_THEME, ...(raw || {}) };
  if (!t.avatarBorderColor) t.avatarBorderColor = t.primaryColor + "40";
  return t;
}

function getBackground(t: ResolvedTheme): string {
  if (t.bgMode === "solid") return t.bgSolidColor || t.bgGradientFrom;
  return `linear-gradient(135deg, ${t.bgGradientFrom} 0%, ${t.bgGradientTo} 100%)`;
}

function getPatternOverlay(t: ResolvedTheme): React.CSSProperties | null {
  if (t.bgPattern === "none") return null;
  const base: React.CSSProperties = { position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 };
  switch (t.bgPattern) {
    case "dots": return { ...base, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "14px 14px" };
    case "grid": return { ...base, backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "16px 16px" };
    case "waves": return { ...base, backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.015) 6px, rgba(255,255,255,0.015) 12px)" };
    default: return null;
  }
}

function isLightBg(t: ResolvedTheme): boolean {
  const hex = t.bgMode === "solid" ? (t.bgSolidColor || t.bgGradientFrom) : t.bgGradientFrom;
  if (!hex || !hex.startsWith("#")) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
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
    case "inter": return "'Inter', system-ui, sans-serif";
    case "serif": return "'Georgia', 'Times New Roman', serif";
    case "poppins": return "'Poppins', system-ui, sans-serif";
    case "montserrat": return "'Montserrat', system-ui, sans-serif";
    case "playfair": return "'Playfair Display', Georgia, serif";
    case "raleway": return "'Raleway', system-ui, sans-serif";
    case "dm-sans": return "'DM Sans', system-ui, sans-serif";
    default: return "var(--font-geist-sans), system-ui, sans-serif";
  }
}

function photoSrc(photo: string): string {
  if (!photo) return "";
  if (photo.startsWith("/api/uploads/")) return photo;
  if (photo.startsWith("/uploads/")) return `/api${photo}`;
  return photo;
}

/* Google Fonts loader for preview */
const GOOGLE_FONTS: Record<string, string> = {
  poppins: "Poppins:wght@300;400;500;600;700;800",
  montserrat: "Montserrat:wght@300;400;500;600;700;800",
  playfair: "Playfair+Display:wght@400;500;600;700;800",
  raleway: "Raleway:wght@300;400;500;600;700;800",
  "dm-sans": "DM+Sans:wght@300;400;500;600;700;800",
  inter: "Inter:wght@300;400;500;600;700;800",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function TagFormVCardPreview({ tagType, vcard, tagId }: Props) {
  const deferred = useDeferredValue(vcard);

  if (tagType !== "vcard") return null;

  const theme = resolveTheme(deferred.theme);
  const light = isLightBg(theme);

  const textPrimary = light ? "#1e293b" : "#fff";
  const textSecondary = light ? "rgba(30,41,59,0.6)" : "rgba(255,255,255,0.6)";
  const textMuted = light ? "rgba(30,41,59,0.35)" : "rgba(255,255,255,0.35)";
  const cardBg = light ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.05)";
  const cardBorder = light ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";

  const linkRadius = getLinkRadius(theme.buttonStyle);
  const iconRadius = getIconBoxRadius(theme.socialIconStyle);
  const avatarRadius = getAvatarRadius(theme.avatarShape);
  const fontStack = getFontStack(theme.fontFamily);
  const patternStyle = getPatternOverlay(theme);

  const fullName = [deferred.firstName, deferred.lastName].filter(Boolean).join(" ") || "Imie Nazwisko";
  const initials = [deferred.firstName?.[0], deferred.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";

  const isMinimal = theme.layoutVariant === "minimal";
  const isModern = theme.layoutVariant === "modern";

  const CONTACT_LABELS: Record<string, string> = { phone: "Telefon", email: "E-mail", website: "Strona WWW", address: "Adres" };

  const allSocial = [
    { key: "instagram", label: "Instagram" },
    { key: "facebook", label: "Facebook" },
    { key: "linkedin", label: "LinkedIn" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "tiktok", label: "TikTok" },
    { key: "youtube", label: "YouTube" },
    { key: "telegram", label: "Telegram" },
  ];

  const allContact = [
    { key: "phone", label: "Telefon" },
    { key: "email", label: "Email" },
    { key: "website", label: "Strona" },
    { key: "address", label: "Adres" },
  ];

  const hiddenFields = deferred.hiddenFields || [];
  const contactOrder = deferred.contactOrder || ["phone", "email", "website", "address"];
  const contactItems = contactOrder
    .map((k) => allContact.find((c) => c.key === k))
    .filter((c) => c && (deferred as unknown as Record<string, string>)[c.key] && !hiddenFields.includes(c.key)) as { key: string; label: string }[];

  const socialOrder = deferred.socialOrder || ["instagram", "facebook", "linkedin", "whatsapp", "tiktok", "youtube", "telegram"];
  const socialLinks = socialOrder
    .map((k) => allSocial.find((s) => s.key === k))
    .filter((s) => s && (deferred as unknown as Record<string, string>)[s.key] && !hiddenFields.includes(s.key)) as { key: string; label: string }[];

  const displayMode = deferred.contactDisplayMode || "value";
  const contactHeader = deferred.contactHeaderText ?? "Kontakt";
  const socialHeader = deferred.socialHeaderText ?? "Social Media";

  const iconBoxStyle = (color: string): React.CSSProperties => ({
    width: 30,
    height: 30,
    borderRadius: iconRadius,
    background: `${color}15`,
    border: `1px solid ${color}30`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  });

  const linkCardStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    borderRadius: linkRadius,
    background: cardBg,
    border: `1px solid ${cardBorder}`,
    backdropFilter: "blur(8px)",
  };

  /* Load Google Font dynamically */
  const fontKey = theme.fontFamily;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!GOOGLE_FONTS[fontKey]) return;
    const id = `gf-preview-${fontKey}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${GOOGLE_FONTS[fontKey]}&display=swap`;
    document.head.appendChild(link);
  }, [fontKey]);

  return (
    <div style={{ position: "sticky", top: 80 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
        color: "#555c6e", marginBottom: 10, textAlign: "center",
      }}>
        Podglad wizytowki
      </div>

      <div style={{
        background: getBackground(theme),
        borderRadius: 20,
        padding: "24px 16px 12px",
        border: "1px solid #2a2e38",
        textAlign: "center",
        fontFamily: fontStack,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        transition: "all 0.3s ease",
      }}>
        {/* Pattern overlay */}
        {patternStyle && <div style={{ ...patternStyle, borderRadius: 20 }} />}

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Avatar */}
          {deferred.photo ? (
            <div style={{
              width: 80,
              height: 80,
              borderRadius: avatarRadius,
              margin: "0 auto 10px",
              overflow: "hidden",
              border: `${theme.avatarBorderWidth}px solid ${theme.avatarBorderColor}`,
              boxShadow: `0 0 20px ${theme.primaryColor}20`,
              transition: "all 0.3s ease",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoSrc(deferred.photo)}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          ) : (
            <div style={{
              width: 80,
              height: 80,
              borderRadius: avatarRadius,
              margin: "0 auto 10px",
              background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.primaryColor}88)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: isModern ? 28 : 22,
              fontWeight: 700,
              color: "#fff",
              boxShadow: `0 0 20px ${theme.primaryColor}20`,
              transition: "all 0.3s ease",
            }}>
              {initials}
            </div>
          )}

          {/* Name */}
          <div style={{
            fontSize: isModern ? 18 : 15,
            fontWeight: 700,
            color: textPrimary,
            marginBottom: 2,
            letterSpacing: "-0.01em",
            transition: "all 0.3s ease",
          }}>
            {fullName}
          </div>
          {deferred.jobTitle && (
            <div style={{ fontSize: 11, color: textSecondary }}>{deferred.jobTitle}</div>
          )}
          {deferred.company && (
            <div style={{ fontSize: 11, fontWeight: 600, color: theme.primaryColor, marginTop: 1 }}>
              {deferred.company}
            </div>
          )}

          {/* Save contact button */}
          <div style={{ marginTop: 12 }}>
            <div style={{
              padding: "6px 0",
              borderRadius: linkRadius,
              background: theme.buttonVariant === "filled" ? theme.primaryColor :
                         theme.buttonVariant === "outline" ? "transparent" : "transparent",
              border: theme.buttonVariant === "outline" ? `1.5px solid ${theme.primaryColor}` : "1.5px solid transparent",
              color: theme.buttonVariant === "filled" ? "#fff" : theme.primaryColor,
              fontSize: 11,
              fontWeight: 700,
              transition: "all 0.3s ease",
            }}>
              Zapisz kontakt
            </div>
          </div>

          {/* Contact */}
          {contactItems.length > 0 && (
            <div style={{ marginTop: contactHeader ? 12 : 8, textAlign: "left" }}>
              {!isMinimal && contactHeader && (
                <div style={{
                  fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                  color: textMuted, marginBottom: 6, paddingLeft: 2,
                }}>
                  {contactHeader}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {contactItems.map((item) => {
                  const IconComp = SOCIAL_ICONS[item.key];
                  const color = SOCIAL_COLORS[item.key] || theme.primaryColor;
                  const value = (deferred as unknown as Record<string, string>)[item.key];
                  const showLogo = item.key === "website" && deferred.websiteLogo;
                  return (
                    <div key={item.key} style={linkCardStyle}>
                      {showLogo ? (
                        <div style={{ ...iconBoxStyle(color), overflow: "hidden", padding: 0 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photoSrc(deferred.websiteLogo!)} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </div>
                      ) : (
                        <div style={iconBoxStyle(color)}>
                          {IconComp && <IconComp size={13} color={color} />}
                        </div>
                      )}
                      <span style={{
                        fontSize: 11, color: textPrimary, fontWeight: 500,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
                      }}>
                        {displayMode === "label" ? (CONTACT_LABELS[item.key] || item.label) : value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Social */}
          {socialLinks.length > 0 && (
            <div style={{ marginTop: socialHeader ? 12 : 6, textAlign: "left" }}>
              {!isMinimal && socialHeader && (
                <div style={{
                  fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                  color: textMuted, marginBottom: 6, paddingLeft: 2,
                }}>
                  {socialHeader}
                </div>
              )}
              {isMinimal ? (
                <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
                  {socialLinks.map((s) => {
                    const IconComp = SOCIAL_ICONS[s.key];
                    const color = SOCIAL_COLORS[s.key] || theme.primaryColor;
                    return (
                      <div key={s.key} style={iconBoxStyle(color)} title={s.label}>
                        {IconComp && <IconComp size={13} color={color} />}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {socialLinks.map((s) => {
                    const IconComp = SOCIAL_ICONS[s.key];
                    const color = SOCIAL_COLORS[s.key] || theme.primaryColor;
                    return (
                      <div key={s.key} style={linkCardStyle}>
                        <div style={iconBoxStyle(color)}>
                          {IconComp && <IconComp size={13} color={color} />}
                        </div>
                        <span style={{ fontSize: 11, color: textPrimary, fontWeight: 500, flex: 1 }}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Note */}
          {deferred.note && (
            <div style={{
              marginTop: 12, padding: "8px 10px", borderRadius: linkRadius,
              background: cardBg, border: `1px solid ${cardBorder}`,
              fontSize: 10, lineHeight: 1.5, color: textSecondary,
              whiteSpace: "pre-wrap", textAlign: "left",
            }}>
              {deferred.note}
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 14, paddingBottom: 4 }}>
            <p style={{
              fontSize: 9, color: textMuted, fontWeight: 500,
            }}>
              Powered by TwojeNFC.pl
            </p>
          </div>

          {tagId && (
            <div style={{ fontSize: 9, color: textMuted, marginTop: 4, fontFamily: "var(--font-mono)" }}>
              /vcard/{tagId}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
