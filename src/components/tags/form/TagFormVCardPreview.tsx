"use client";

import React, { useDeferredValue } from "react";
import type { VCardData } from "@/types/vcard";
import { SOCIAL_ICONS, SOCIAL_COLORS } from "@/components/vcard/SocialIcons";

interface Props {
  tagType: string;
  vcard: VCardData;
  tagId: string;
}

export default function TagFormVCardPreview({ tagType, vcard, tagId }: Props) {
  const deferred = useDeferredValue(vcard);

  if (tagType !== "vcard") return null;

  const fullName = [deferred.firstName, deferred.lastName].filter(Boolean).join(" ") || "Imie Nazwisko";
  const initials = [deferred.firstName?.[0], deferred.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";

  const socialLinks = [
    { key: "instagram", label: "Instagram" },
    { key: "facebook", label: "Facebook" },
    { key: "linkedin", label: "LinkedIn" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "tiktok", label: "TikTok" },
    { key: "youtube", label: "YouTube" },
    { key: "telegram", label: "Telegram" },
  ].filter((s) => (deferred as unknown as Record<string, string>)[s.key]);

  const contactItems = [
    { key: "phone", label: "Telefon" },
    { key: "email", label: "Email" },
    { key: "website", label: "Strona" },
    { key: "address", label: "Adres" },
  ].filter((s) => (deferred as unknown as Record<string, string>)[s.key]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.previewLabel}>Podglad wizytowki</div>

      <div style={styles.card}>
        {/* Avatar */}
        <div style={styles.avatar}>
          <span style={styles.initials}>{initials}</span>
        </div>

        {/* Name */}
        <div style={styles.name}>{fullName}</div>
        {deferred.jobTitle && (
          <div style={styles.subtitle}>{deferred.jobTitle}</div>
        )}
        {deferred.company && (
          <div style={styles.company}>{deferred.company}</div>
        )}

        {/* Contact */}
        {contactItems.length > 0 && (
          <div style={styles.links}>
            {contactItems.map((item) => {
              const IconComp = SOCIAL_ICONS[item.key];
              const color = SOCIAL_COLORS[item.key] || "#8b95a8";
              const value = (deferred as unknown as Record<string, string>)[item.key];
              return (
                <div key={item.key} style={styles.linkItem}>
                  {IconComp && <IconComp size={14} color={color} />}
                  <span style={styles.linkText}>{value}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Social */}
        {socialLinks.length > 0 && (
          <div style={styles.socialRow}>
            {socialLinks.map((s) => {
              const IconComp = SOCIAL_ICONS[s.key];
              const color = SOCIAL_COLORS[s.key] || "#8b95a8";
              return (
                <div key={s.key} style={{ ...styles.socialIcon, background: `${color}15` }} title={s.label}>
                  {IconComp && <IconComp size={16} color={color} />}
                </div>
              );
            })}
          </div>
        )}

        {/* Note */}
        {deferred.note && (
          <div style={styles.note}>{deferred.note}</div>
        )}

        {/* Footer */}
        <div style={styles.footer}>
          <div style={styles.footerBtn}>Zapisz kontakt</div>
        </div>

        {tagId && (
          <div style={styles.previewUrl}>/vcard/{tagId}</div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: "sticky" as const,
    top: 80,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "#5a6478",
    marginBottom: 10,
    textAlign: "center" as const,
  },
  card: {
    background: "linear-gradient(135deg, #0f0f1a 0%, #16213e 100%)",
    borderRadius: 16,
    padding: "28px 20px 16px",
    border: "1px solid #1e2d45",
    textAlign: "center" as const,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 12px",
  },
  initials: {
    color: "#fff",
    fontSize: 22,
    fontWeight: 800,
  },
  name: {
    fontSize: 17,
    fontWeight: 800,
    color: "#e8ecf1",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: "#8b95a8",
  },
  company: {
    fontSize: 12,
    color: "#5a6478",
    marginTop: 2,
  },
  links: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
    marginTop: 16,
  },
  linkItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 8,
    background: "rgba(255,255,255,0.04)",
  },
  linkText: {
    fontSize: 12,
    color: "#8b95a8",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  socialRow: {
    display: "flex",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
    flexWrap: "wrap" as const,
  },
  socialIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  note: {
    fontSize: 11,
    color: "#5a6478",
    marginTop: 14,
    padding: "8px 10px",
    borderRadius: 8,
    background: "rgba(255,255,255,0.03)",
    fontStyle: "italic" as const,
    lineHeight: 1.4,
  },
  footer: {
    marginTop: 16,
  },
  footerBtn: {
    padding: "8px 0",
    borderRadius: 10,
    background: "#7c3aed",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    opacity: 0.8,
  },
  previewUrl: {
    fontSize: 10,
    color: "#5a6478",
    marginTop: 10,
    fontFamily: "monospace",
  },
};
