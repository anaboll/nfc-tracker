/* ------------------------------------------------------------------ */
/*  Icon options for multilink editor (shared)                         */
/* ------------------------------------------------------------------ */

export const iconOptions = [
  { value: "instagram", label: "Instagram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Telefon" },
  { value: "website", label: "Strona WWW" },
  { value: "telegram", label: "Telegram" },
  { value: "link", label: "Link" },
] as const;

export type IconValue = (typeof iconOptions)[number]["value"];
