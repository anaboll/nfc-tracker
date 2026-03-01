"use client";

import React from "react";
import TrackedLink from "@/components/shared/TrackedLink";

interface LinkItem {
  key: string;
  label: string;
  url: string;
}

interface Props {
  tagId: string;
  contactLinks: LinkItem[];
  socialLinks: LinkItem[];
  /* Style params from server component */
  linkCardStyle: React.CSSProperties;
  iconBoxStyleFn: Record<string, React.CSSProperties>;
  textPrimary: string;
  textMuted: string;
  isMinimal: boolean;
  iconMap: Record<string, string>; // key → serialized SVG color
  socialColors: Record<string, string>;
  primaryColor: string;
}

/* Re-import icons client-side (they're tiny SVG components) */
import {
  PhoneIcon, EmailIcon, WebsiteIcon, AddressIcon,
  InstagramIcon, FacebookIcon, LinkedInIcon, WhatsAppIcon,
  TikTokIcon, YouTubeIcon, TelegramIcon,
  SOCIAL_COLORS,
} from "@/components/vcard/SocialIcons";

const ICON_MAP: Record<string, React.FC<{ size?: number; color?: string }>> = {
  phone: PhoneIcon, email: EmailIcon, website: WebsiteIcon, address: AddressIcon,
  instagram: InstagramIcon, facebook: FacebookIcon, linkedin: LinkedInIcon,
  whatsapp: WhatsAppIcon, tiktok: TikTokIcon, youtube: YouTubeIcon, telegram: TelegramIcon,
};

export default function VCardTrackedLinks({
  tagId,
  contactLinks,
  socialLinks,
  linkCardStyle,
  iconBoxStyleFn,
  textPrimary,
  textMuted,
  isMinimal,
  primaryColor,
}: Props) {
  return (
    <>
      {/* CONTACT section */}
      {contactLinks.length > 0 && (
        <div style={{ marginTop: 24 }}>
          {!isMinimal && (
            <div style={{
              fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
              color: textMuted, marginBottom: 10, paddingLeft: 4,
            }}>
              Kontakt
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {contactLinks.map((link) => {
              const Icon = ICON_MAP[link.key];
              const color = SOCIAL_COLORS[link.key] || primaryColor;
              const iboxStyle = iconBoxStyleFn[link.key] || {};
              return (
                <TrackedLink
                  key={link.key}
                  tagId={tagId}
                  linkUrl={link.url}
                  linkLabel={link.label}
                  linkIcon={link.key}
                  target={link.key === "phone" ? "_self" : "_blank"}
                  style={linkCardStyle}
                >
                  <div style={iboxStyle}>
                    {Icon && <Icon size={20} color={color} />}
                  </div>
                  <span style={{ color: textPrimary, fontSize: 14, fontWeight: 500, flex: 1, wordBreak: "break-all" }}>
                    {link.label}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </TrackedLink>
              );
            })}
          </div>
        </div>
      )}

      {/* SOCIAL MEDIA section */}
      {socialLinks.length > 0 && (
        <div style={{ marginTop: 24 }}>
          {!isMinimal && (
            <div style={{
              fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
              color: textMuted, marginBottom: 10, paddingLeft: 4,
            }}>
              Social Media
            </div>
          )}

          {isMinimal ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {socialLinks.map((link) => {
                const Icon = ICON_MAP[link.key];
                const color = SOCIAL_COLORS[link.key] || primaryColor;
                const iboxStyle = iconBoxStyleFn[link.key] || {};
                return (
                  <TrackedLink
                    key={link.key}
                    tagId={tagId}
                    linkUrl={link.url}
                    linkLabel={link.label}
                    linkIcon={link.key}
                    style={iboxStyle}
                  >
                    {Icon && <Icon size={20} color={color} />}
                  </TrackedLink>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {socialLinks.map((link) => {
                const Icon = ICON_MAP[link.key];
                const color = SOCIAL_COLORS[link.key] || primaryColor;
                const iboxStyle = iconBoxStyleFn[link.key] || {};
                return (
                  <TrackedLink
                    key={link.key}
                    tagId={tagId}
                    linkUrl={link.url}
                    linkLabel={link.label}
                    linkIcon={link.key}
                    style={linkCardStyle}
                  >
                    <div style={iboxStyle}>
                      {Icon && <Icon size={20} color={color} />}
                    </div>
                    <span style={{ color: textPrimary, fontSize: 14, fontWeight: 500, flex: 1 }}>
                      {link.label}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </TrackedLink>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
