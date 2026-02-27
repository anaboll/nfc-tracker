/* ------------------------------------------------------------------ */
/*  Shared vCard types                                                  */
/* ------------------------------------------------------------------ */

export type BgMode = "gradient" | "solid" | "pattern";
export type BgPattern = "none" | "dots" | "grid" | "waves";
export type ButtonStyle = "rounded" | "square" | "pill";
export type ButtonVariant = "filled" | "outline" | "ghost";
export type FontFamily = "geist" | "inter" | "serif";
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
}

export interface VCardData {
  firstName: string;
  lastName: string;
  company?: string;
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
  theme?: VCardTheme;
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
};

/* Allowed theme property values for validation */
export const THEME_VALID_VALUES = {
  bgMode: ["gradient", "solid", "pattern"] as BgMode[],
  bgPattern: ["none", "dots", "grid", "waves"] as BgPattern[],
  buttonStyle: ["rounded", "square", "pill"] as ButtonStyle[],
  buttonVariant: ["filled", "outline", "ghost"] as ButtonVariant[],
  fontFamily: ["geist", "inter", "serif"] as FontFamily[],
  layoutVariant: ["classic", "modern", "minimal"] as LayoutVariant[],
  avatarShape: ["circle", "rounded-square", "square"] as AvatarShape[],
  socialIconStyle: ["rounded", "circle", "square", "pill"] as SocialIconStyle[],
} as const;
