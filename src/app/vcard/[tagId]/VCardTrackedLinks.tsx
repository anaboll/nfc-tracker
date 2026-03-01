"use client";

import React from "react";
import TrackedLink from "@/components/shared/TrackedLink";
import {
  PhoneIcon, EmailIcon, WebsiteIcon, AddressIcon,
  InstagramIcon, FacebookIcon, LinkedInIcon, WhatsAppIcon,
  TikTokIcon, YouTubeIcon, TelegramIcon,
  SOCIAL_COLORS,
} from "@/components/vcard/SocialIcons";

export interface RenderItem {
  type: "field" | "header";
  key: string;
  text?: string;    // header text
  url?: string;     // field URL
  label?: string;   // field display text
}

interface Props {
  tagId: string;
  items: RenderItem[];
  linkCardStyle: React.CSSProperties;
  iconBoxStyleFn: Record<string, React.CSSProperties>;
  textPrimary: string;
  textMuted: string;
  isMinimal: boolean;
  primaryColor: string;
  websiteLogo?: string;
  contactDisplayMode?: "value" | "label";
}

const ICON_MAP: Record<string, React.FC<{ size?: number; color?: string }>> = {
  phone: PhoneIcon, email: EmailIcon, website: WebsiteIcon, address: AddressIcon,
  instagram: InstagramIcon, facebook: FacebookIcon, linkedin: LinkedInIcon,
  whatsapp: WhatsAppIcon, tiktok: TikTokIcon, youtube: YouTubeIcon, telegram: TelegramIcon,
};

const CONTACT_KEYS = new Set(["phone", "email", "website", "address"]);
const SOCIAL_KEYS = new Set(["instagram", "facebook", "linkedin", "whatsapp", "tiktok", "youtube", "telegram"]);
const CONTACT_LABELS: Record<string, string> = {
  phone: "Telefon", email: "E-mail", website: "Strona WWW", address: "Adres",
};

function photoSrc(p: string): string {
  if (!p) return "";
  if (p.startsWith("/api/uploads/")) return p;
  if (p.startsWith("/uploads/")) return `/api${p}`;
  return p;
}

interface Section {
  header?: RenderItem;
  fields: RenderItem[];
}

export default function VCardTrackedLinks({
  tagId, items, linkCardStyle, iconBoxStyleFn, textPrimary, textMuted,
  isMinimal, primaryColor, websiteLogo, contactDisplayMode = "value",
}: Props) {
  // Group items into sections (header + following fields)
  const sections: Section[] = [];
  let current: Section = { fields: [] };

  for (const item of items) {
    if (item.type === "header") {
      if (current.header || current.fields.length > 0) {
        sections.push(current);
      }
      current = { header: item, fields: [] };
    } else {
      current.fields.push(item);
    }
  }
  if (current.header || current.fields.length > 0) {
    sections.push(current);
  }

  if (sections.length === 0) return null;

  return (
    <>
      {sections.map((section, sIdx) => {
        if (section.fields.length === 0) return null;

        const allSocial = section.fields.every(f => SOCIAL_KEYS.has(f.key));

        return (
          <div key={section.header?.key || `s-${sIdx}`} style={{ marginTop: sIdx === 0 ? 24 : (section.header ? 16 : 8) }}>
            {/* Section header */}
            {!isMinimal && section.header && (
              <div style={{
                fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                color: textMuted, marginBottom: 10, paddingLeft: 4,
              }}>
                {section.header.text}
              </div>
            )}

            {/* Fields */}
            {allSocial && isMinimal ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                {section.fields.map(field => {
                  const Icon = ICON_MAP[field.key];
                  const color = SOCIAL_COLORS[field.key] || primaryColor;
                  const iboxStyle = iconBoxStyleFn[field.key] || {};
                  return (
                    <TrackedLink
                      key={field.key} tagId={tagId}
                      linkUrl={field.url!} linkLabel={field.label!} linkIcon={field.key}
                      style={iboxStyle}
                    >
                      {Icon && <Icon size={20} color={color} />}
                    </TrackedLink>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {section.fields.map(field => {
                  const Icon = ICON_MAP[field.key];
                  const color = SOCIAL_COLORS[field.key] || primaryColor;
                  const iboxStyle = iconBoxStyleFn[field.key] || {};
                  const isContact = CONTACT_KEYS.has(field.key);
                  const showLogo = field.key === "website" && websiteLogo;
                  const displayLabel = contactDisplayMode === "label" && isContact
                    ? (CONTACT_LABELS[field.key] || field.label)
                    : field.label;

                  return (
                    <TrackedLink
                      key={field.key} tagId={tagId}
                      linkUrl={field.url!} linkLabel={field.label!} linkIcon={field.key}
                      target={field.key === "phone" ? "_self" : "_blank"}
                      style={linkCardStyle}
                    >
                      {showLogo ? (
                        <div style={{ ...iboxStyle, overflow: "hidden", padding: 0 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photoSrc(websiteLogo!)} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </div>
                      ) : (
                        <div style={iboxStyle}>
                          {Icon && <Icon size={20} color={color} />}
                        </div>
                      )}
                      <span style={{ color: textPrimary, fontSize: 14, fontWeight: 500, flex: 1, wordBreak: "break-all" }}>
                        {displayLabel}
                      </span>
                      {isContact ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      )}
                    </TrackedLink>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
