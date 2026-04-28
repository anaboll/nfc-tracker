"use client";

import React, { useState } from "react";
import TrackedLink from "@/components/shared/TrackedLink";
import EmailActionSheet from "@/components/vcard/EmailActionSheet";
import { fireLinkClick } from "@/lib/track-link-click";
import {
  PhoneIcon, EmailIcon, WebsiteIcon, AddressIcon,
  InstagramIcon, FacebookIcon, LinkedInIcon, WhatsAppIcon,
  TikTokIcon, YouTubeIcon, TelegramIcon,
  SOCIAL_COLORS,
} from "@/components/vcard/SocialIcons";

export interface RenderItem {
  type: "field" | "header" | "custom-link";
  key: string;
  text?: string;    // header text
  url?: string;     // field URL or custom link URL
  label?: string;   // field display text
  logo?: string;    // custom link logo
}

interface Props {
  tagId: string;
  items: RenderItem[];
  linkCardStyle: React.CSSProperties;
  iconBoxStyleFn: Record<string, React.CSSProperties>;
  defaultIconBoxStyle: React.CSSProperties;
  textPrimary: string;
  textMuted: string;
  isMinimal: boolean;
  primaryColor: string;
  /* Tlo vCarda (solid color albo from-color gradientu) — uzywane przez
   * EmailActionSheet zeby modal mial spojny kolor z wizytowka. */
  bgColor?: string;
  websiteLogo?: string;
  /* Row customization (all optional for backward compat) */
  rowFontSize?: number;    // default 14
  rowIconInner?: number;   // size of SVG icon inside the icon box, default 20
  buttonRowGap?: number;   // space between "Zapisz kontakt" and first row, default 24
  rowGap?: number;         // space between consecutive rows, default 8
}

const ICON_MAP: Record<string, React.FC<{ size?: number; color?: string }>> = {
  phone: PhoneIcon, email: EmailIcon, website: WebsiteIcon, address: AddressIcon,
  instagram: InstagramIcon, facebook: FacebookIcon, linkedin: LinkedInIcon,
  whatsapp: WhatsAppIcon, tiktok: TikTokIcon, youtube: YouTubeIcon, telegram: TelegramIcon,
};

const CONTACT_KEYS = new Set(["phone", "email", "website", "address"]);
const SOCIAL_KEYS = new Set(["instagram", "facebook", "linkedin", "whatsapp", "tiktok", "youtube", "telegram"]);

function photoSrc(p: string): string {
  if (!p) return "";
  if (p.startsWith("/api/uploads/")) return p;
  if (p.startsWith("/uploads/")) return `/api${p}`;
  return p;
}

/* External link icon (for social + custom links) */
const ExternalLinkIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

/* Chevron icon (for contact fields) */
const ChevronIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

/* Generic link icon for custom links */
const LinkIcon = ({ size = 20, color = "#fff" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
  </svg>
);

interface Section {
  header?: RenderItem;
  fields: RenderItem[];
}

export default function VCardTrackedLinks({
  tagId, items, linkCardStyle, iconBoxStyleFn, defaultIconBoxStyle, textPrimary, textMuted, rowFontSize = 14, rowIconInner = 20,
  buttonRowGap = 24, rowGap = 8,
  isMinimal, primaryColor, bgColor, websiteLogo,
}: Props) {
  /* Email belka: nie renderujemy mailto: jako <a>, bo iPhone bez ustawionego
   * default mail-app rzuca systemowy blad. Zamiast tego button -> action sheet
   * (Wyslij / Skopiuj). emailSheetAddr=null oznacza modal zamkniety. */
  const [emailSheetAddr, setEmailSheetAddr] = useState<string | null>(null);

  /* Wykrywamy czy tlo vCarda jest jasne czy ciemne — modal dopasowuje sie wizualnie.
   * Heurystyka: textPrimary "#1e293b" lub ciemny -> jasne tlo. Dla naszych palet:
   * dark navy/grafit -> textPrimary=#fff (jasny tekst, ciemne tlo). */
  const isDarkBg = !textPrimary.startsWith("#1") && !textPrimary.startsWith("#0");

  // Group items into sections (header + following fields/custom-links)
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
      {/* Modal akcji email — globalnie dla calego komponentu (jeden, niezaleznie od ilu pol email) */}
      {emailSheetAddr && (
        <EmailActionSheet
          email={emailSheetAddr}
          isOpen={!!emailSheetAddr}
          onClose={() => setEmailSheetAddr(null)}
          primaryColor={primaryColor}
          bgColor={bgColor}
          textColor={textPrimary}
          isDarkBg={isDarkBg}
        />
      )}

      {sections.map((section, sIdx) => {
        if (section.fields.length === 0) return null;

        const allSocial = section.fields.every(f => f.type === "field" && SOCIAL_KEYS.has(f.key));

        return (
          <div key={section.header?.key || `s-${sIdx}`} style={{ marginTop: sIdx === 0 ? buttonRowGap : (section.header ? 16 : rowGap) }}>
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
                  const iboxStyle = iconBoxStyleFn[field.key] || defaultIconBoxStyle;
                  return (
                    <TrackedLink
                      key={field.key} tagId={tagId}
                      linkUrl={field.url!} linkLabel={field.label!} linkIcon={field.key}
                      style={iboxStyle}
                    >
                      {Icon && <Icon size={rowIconInner} color={color} />}
                    </TrackedLink>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: rowGap }}>
                {section.fields.map(field => {
                  const isCustomLink = field.type === "custom-link";
                  const Icon = isCustomLink ? LinkIcon : ICON_MAP[field.key];
                  const color = isCustomLink ? primaryColor : (SOCIAL_COLORS[field.key] || primaryColor);
                  const iboxStyle = isCustomLink ? defaultIconBoxStyle : (iconBoxStyleFn[field.key] || defaultIconBoxStyle);
                  const isContact = !isCustomLink && CONTACT_KEYS.has(field.key);
                  const showLogo = (field.key === "website" && websiteLogo) || (isCustomLink && field.logo);
                  const logoUrl = isCustomLink ? field.logo : websiteLogo;

                  /* Wewnetrzna zawartosc belki — identyczna dla button (email)
                   * i TrackedLink (reszta). Wydzielona dla DRY. */
                  const rowContent = (
                    <>
                      {showLogo && logoUrl ? (
                        <div style={{ ...iboxStyle, overflow: "hidden", padding: 0 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photoSrc(logoUrl)} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </div>
                      ) : (
                        <div style={iboxStyle}>
                          {Icon && <Icon size={rowIconInner} color={color} />}
                        </div>
                      )}
                      <span style={{ color: textPrimary, fontSize: rowFontSize, fontWeight: 500, flex: 1, wordBreak: "break-all", textAlign: "left" }}>
                        {field.label}
                      </span>
                      {isContact ? (
                        <ChevronIcon color={textMuted} />
                      ) : (
                        <ExternalLinkIcon color={textMuted} />
                      )}
                    </>
                  );

                  /* Email: button + action sheet (zamiast mailto: ktore na iPhone
                   * bez mail-app rzuca systemowy blad). Tracking firowany inline
                   * przy kliknieciu — tak jak TrackedLink ale przed otwarciem modal. */
                  if (field.key === "email" && field.url) {
                    const emailAddr = field.url.replace(/^mailto:/i, "");
                    return (
                      <button
                        key={field.key}
                        type="button"
                        onClick={() => {
                          fireLinkClick({ tagId, linkUrl: field.url!, linkLabel: field.label!, linkIcon: field.key });
                          setEmailSheetAddr(emailAddr);
                        }}
                        style={{
                          ...linkCardStyle,
                          cursor: "pointer",
                          font: "inherit",
                          color: "inherit",
                          width: "100%",
                          textAlign: "left",
                        }}
                      >
                        {rowContent}
                      </button>
                    );
                  }

                  /* Pozostale pola (telefon, IG, FB, website, custom) — bez zmian */
                  return (
                    <TrackedLink
                      key={field.key} tagId={tagId}
                      linkUrl={field.url!} linkLabel={field.label!} linkIcon={field.key}
                      target={field.key === "phone" ? "_self" : "_blank"}
                      style={linkCardStyle}
                    >
                      {rowContent}
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
