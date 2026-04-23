/* ------------------------------------------------------------------ */
/*  Shared vCard types                                                  */
/* ------------------------------------------------------------------ */

export type BgMode = "gradient" | "solid" | "pattern";
export type BgPattern = "none" | "dots" | "grid" | "waves";
export type ButtonStyle = "rounded" | "square" | "pill";
export type ButtonVariant = "filled" | "outline" | "ghost";
export type FontFamily = "geist" | "inter" | "serif" | "poppins" | "montserrat" | "playfair" | "raleway" | "dm-sans";
export type LayoutVariant = "classic" | "modern" | "minimal";
export type AvatarShape = "circle" | "rounded-square" | "square";
export type SocialIconStyle = "rounded" | "circle" | "square" | "pill";

export interface VCardTheme {
  /* --- Existing (backward-compatible) --- */
  primaryColor?: string;       // accent for buttons, links (default: #7c3aed)
  bgGradientFrom?: string;     // gradient start
  bgGradientTo?: string;       // gradient end

  /* --- Background --- */
  bgMode?: BgMode;             // default: 'gradient'
  bgSolidColor?: string;       // used when bgMode='solid'
  bgPattern?: BgPattern;       // CSS-only patterns, default: 'none'

  /* --- Button Style --- */
  buttonStyle?: ButtonStyle;   // default: 'rounded'
  buttonVariant?: ButtonVariant; // default: 'filled'

  /* --- Typography --- */
  fontFamily?: FontFamily;     // default: 'geist'

  /* --- Layout --- */
  layoutVariant?: LayoutVariant; // default: 'classic'

  /* --- Avatar --- */
  avatarShape?: AvatarShape;   // default: 'circle'
  avatarBorderWidth?: number;  // 0-6, default: 3
  avatarBorderColor?: string;  // default: auto from primaryColor

  /* --- Social Icons --- */
  socialIconStyle?: SocialIconStyle; // default: 'rounded'

  /* --- Contact rows customization (default values preserve current layout) --- */
  rowPadding?: number;              // 6-20px vertical padding, default: 14
  rowIconSize?: number;             // 32-56px icon box dimension, default: 44
  rowFontSize?: number;             // 12-18px label text size, default: 14
  rowFontFamily?: FontFamily;       // override font for rows only; undefined = inherit theme.fontFamily

  /* --- Vertical spacing (configurable to fit rows on one screen) --- */
  headerBottomGap?: number;         // 0-60px space between name/company block and "Zapisz kontakt" button, default: 24
  buttonRowGap?: number;            // 0-60px space between "Zapisz kontakt" button and the first contact row, default: 24
  rowGap?: number;                  // 0-30px space between consecutive contact/social rows, default: 8
}

export interface VCardData {
  firstName: string;
  lastName: string;
  company?: string;
  slogan?: string;       // optional tagline shown below the main name/company (e.g. "Pobieranie krwi w domu lub pracy")
  jobTitle?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  tiktok?: string;
  youtube?: string;
  whatsapp?: string;
  telegram?: string;
  note?: string;
  photo?: string;        // path to uploaded photo (/uploads/...)
  websiteLogo?: string;  // path to uploaded website logo (/uploads/...)
  theme?: VCardTheme;

  /* --- Display settings --- */
  contactDisplayMode?: "value" | "label";  // "value" = show raw data, "label" = friendly label (default: "value")
  contactHeaderText?: string;              // custom header text, "" = hidden (default: "Kontakt")
  socialHeaderText?: string;               // custom header text, "" = hidden (default: "Social Media")
  contactOrder?: string[];                 // ordered list of contact keys, e.g. ["phone","email","website","address"]
  socialOrder?: string[];                  // ordered list of social keys
  hiddenFields?: string[];                 // fields to hide on public page, e.g. ["phone","instagram"]
  displayItems?: DisplayItem[];            // unified display order (headers + fields)
}

/* Display item for unified ordering */
export interface DisplayItem {
  type: "field" | "header" | "custom-link";
  key: string;        // field key ("phone","instagram",...) or unique header id ("h-contact","h-1",...) or custom link id ("cl-123")
  text?: string;      // header text (only for type="header")
  label?: string;     // custom display label (for type="field" and "custom-link", overrides default)
  showLabel?: boolean; // true = show label text, false = show raw value (default: true for social, false for contact)
  url?: string;       // link URL (only for type="custom-link")
  logo?: string;      // logo image path (only for type="custom-link")
  visible?: boolean;  // default true, false = hidden
}

/* Default theme values */
export const DEFAULT_VCARD_THEME: Required<VCardTheme> = {
  primaryColor: "#7c3aed",
  bgGradientFrom: "#0f0f1a",
  bgGradientTo: "#16213e",
  bgMode: "gradient",
  bgSolidColor: "#0f0f1a",
  bgPattern: "none",
  buttonStyle: "rounded",
  buttonVariant: "filled",
  fontFamily: "geist",
  layoutVariant: "classic",
  avatarShape: "circle",
  avatarBorderWidth: 3,
  avatarBorderColor: "",       // empty = auto from primaryColor
  socialIconStyle: "rounded",
  rowPadding: 14,
  rowIconSize: 44,
  rowFontSize: 14,
  rowFontFamily: "geist",      // sentinel — effective code should fall back to fontFamily when undefined
  headerBottomGap: 24,         // space between name/company and Save Contact button (current default)
  buttonRowGap: 24,            // space between Save Contact button and first contact row (current default)
  rowGap: 8,                   // space between consecutive rows (current default)
};

/* Allowed theme property values for validation */
export const THEME_VALID_VALUES = {
  bgMode: ["gradient", "solid", "pattern"] as BgMode[],
  bgPattern: ["none", "dots", "grid", "waves"] as BgPattern[],
  buttonStyle: ["rounded", "square", "pill"] as ButtonStyle[],
  buttonVariant: ["filled", "outline", "ghost"] as ButtonVariant[],
  fontFamily: ["geist", "inter", "serif", "poppins", "montserrat", "playfair", "raleway", "dm-sans"] as FontFamily[],
  layoutVariant: ["classic", "modern", "minimal"] as LayoutVariant[],
  avatarShape: ["circle", "rounded-square", "square"] as AvatarShape[],
  socialIconStyle: ["rounded", "circle", "square", "pill"] as SocialIconStyle[],
} as const;

/* ------------------------------------------------------------------ */
/*  Compute unified display items (with legacy fallback)               */
/* ------------------------------------------------------------------ */

const ALL_CONTACT_KEYS = ["phone", "email", "website", "address"];
const ALL_SOCIAL_KEYS = ["instagram", "facebook", "linkedin", "whatsapp", "tiktok", "youtube", "telegram"];
const ALL_FIELD_KEYS = [...ALL_CONTACT_KEYS, ...ALL_SOCIAL_KEYS];

export function computeDisplayItems(vcard: VCardData): DisplayItem[] {
  const v = vcard as unknown as Record<string, string>;
  const filledKeys = ALL_FIELD_KEYS.filter(k => !!v[k]);

  if (vcard.displayItems && vcard.displayItems.length > 0) {
    // Use existing displayItems, but sync with current field values
    // Keep headers, custom-links, and filled fields; remove empty fields
    const result = vcard.displayItems.filter(
      i => i.type === "header" || i.type === "custom-link" || filledKeys.includes(i.key)
    );
    const existing = new Set(result.filter(i => i.type === "field").map(i => i.key));
    for (const k of filledKeys) {
      if (!existing.has(k)) result.push({ type: "field", key: k, visible: true });
    }
    return result;
  }

  // Legacy fallback — derive from old separate fields
  const items: DisplayItem[] = [];
  const hidden = vcard.hiddenFields || [];

  const cOrder = vcard.contactOrder || ALL_CONTACT_KEYS;
  const filledC = cOrder.filter(k => filledKeys.includes(k));
  if (filledC.length > 0) {
    const ct = vcard.contactHeaderText;
    items.push({ type: "header", key: "h-contact", text: ct || "Kontakt", visible: ct !== "" });
    for (const k of filledC) items.push({ type: "field", key: k, visible: !hidden.includes(k) });
  }

  const sOrder = vcard.socialOrder || ALL_SOCIAL_KEYS;
  const filledS = sOrder.filter(k => filledKeys.includes(k));
  if (filledS.length > 0) {
    const st = vcard.socialHeaderText;
    items.push({ type: "header", key: "h-social", text: st || "Social Media", visible: st !== "" });
    for (const k of filledS) items.push({ type: "field", key: k, visible: !hidden.includes(k) });
  }

  return items;
}

export const FIELD_LABELS: Record<string, string> = {
  phone: "Telefon", email: "Email", website: "Strona WWW", address: "Adres",
  instagram: "Instagram", facebook: "Facebook", linkedin: "LinkedIn",
  whatsapp: "WhatsApp", tiktok: "TikTok", youtube: "YouTube", telegram: "Telegram",
};
