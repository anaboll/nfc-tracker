/* ------------------------------------------------------------------ */
/*  Shared vCard types                                                  */
/* ------------------------------------------------------------------ */

export interface VCardTheme {
  primaryColor?: string;     // accent color (default: #7c3aed)
  bgGradientFrom?: string;   // background gradient start
  bgGradientTo?: string;     // background gradient end
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
};
