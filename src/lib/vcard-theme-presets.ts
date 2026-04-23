import type { VCardTheme } from "@/types/vcard";

/* ------------------------------------------------------------------ */
/*  Theme Presets                                                       */
/* ------------------------------------------------------------------ */

export interface ThemePreset {
  id: string;
  name: string;
  theme: Partial<VCardTheme>;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "dark-purple",
    name: "Ciemny Fiolet",
    theme: {
      primaryColor: "#7c3aed",
      bgMode: "gradient",
      bgGradientFrom: "#0f0f1a",
      bgGradientTo: "#16213e",
      buttonStyle: "rounded",
      buttonVariant: "filled",
      fontFamily: "geist",
      layoutVariant: "classic",
      avatarShape: "circle",
      socialIconStyle: "rounded",
    },
  },
  {
    id: "ocean-blue",
    name: "Ocean",
    theme: {
      primaryColor: "#3b82f6",
      bgMode: "gradient",
      bgGradientFrom: "#0c1929",
      bgGradientTo: "#1a365d",
      buttonStyle: "pill",
      buttonVariant: "filled",
      fontFamily: "geist",
      layoutVariant: "modern",
      avatarShape: "circle",
      socialIconStyle: "circle",
    },
  },
  {
    id: "emerald",
    name: "Szmaragd",
    theme: {
      primaryColor: "#10b981",
      bgMode: "gradient",
      bgGradientFrom: "#0a1a14",
      bgGradientTo: "#134e3f",
      buttonStyle: "rounded",
      buttonVariant: "filled",
      fontFamily: "geist",
      layoutVariant: "classic",
      avatarShape: "circle",
      socialIconStyle: "rounded",
    },
  },
  {
    id: "minimal-light",
    name: "Jasny Minimalny",
    theme: {
      primaryColor: "#1e293b",
      bgMode: "solid",
      bgSolidColor: "#f8fafc",
      buttonStyle: "square",
      buttonVariant: "outline",
      fontFamily: "inter",
      layoutVariant: "minimal",
      avatarShape: "circle",
      socialIconStyle: "square",
    },
  },
  {
    id: "sunset",
    name: "Zachod Slonca",
    theme: {
      primaryColor: "#f59e0b",
      bgMode: "gradient",
      bgGradientFrom: "#1a0a0a",
      bgGradientTo: "#2d1810",
      buttonStyle: "pill",
      buttonVariant: "filled",
      fontFamily: "geist",
      layoutVariant: "modern",
      avatarShape: "circle",
      socialIconStyle: "pill",
    },
  },
  {
    id: "corporate",
    name: "Korporacyjny",
    theme: {
      primaryColor: "#0284c7",
      bgMode: "solid",
      bgSolidColor: "#0f172a",
      buttonStyle: "square",
      buttonVariant: "filled",
      fontFamily: "inter",
      layoutVariant: "classic",
      avatarShape: "circle",
      socialIconStyle: "square",
    },
  },
  {
    id: "rose-gold",
    name: "Rose Gold",
    theme: {
      primaryColor: "#e11d48",
      bgMode: "gradient",
      bgGradientFrom: "#1a0a10",
      bgGradientTo: "#2d1020",
      bgPattern: "none",
      buttonStyle: "pill",
      buttonVariant: "filled",
      fontFamily: "serif",
      layoutVariant: "modern",
      avatarShape: "circle",
      avatarBorderWidth: 4,
      socialIconStyle: "circle",
    },
  },
  {
    id: "neon-cyber",
    name: "Neon",
    theme: {
      primaryColor: "#06b6d4",
      bgMode: "pattern",
      bgSolidColor: "#030712",
      bgGradientFrom: "#030712",
      bgGradientTo: "#0a1628",
      bgPattern: "grid",
      buttonStyle: "square",
      buttonVariant: "outline",
      fontFamily: "geist",
      layoutVariant: "classic",
      avatarShape: "circle",
      avatarBorderWidth: 2,
      socialIconStyle: "square",
    },
  },
  {
    id: "laboversum-dark",
    name: "Laboversum Ciemny",
    theme: {
      /* Brand color: #171930 (authentic Laboversum navy — per their phone button) */
      primaryColor: "#ffffff",       // white button on dark navy background (inverse, high contrast)
      bgMode: "solid",               // SOLID #171930 everywhere — no gradient so the color stays exactly as on laboversum.pl
      bgSolidColor: "#171930",
      bgGradientFrom: "#171930",     // fallbacks (unused when bgMode=solid)
      bgGradientTo: "#171930",
      buttonStyle: "rounded",
      buttonVariant: "filled",
      fontFamily: "inter",
      layoutVariant: "classic",
      avatarShape: "circle",
      avatarBorderWidth: 3,
      avatarBorderColor: "#ffffff",
      socialIconStyle: "rounded",
    },
  },
  {
    id: "laboversum-light",
    name: "Laboversum Jasny",
    theme: {
      primaryColor: "#171930",       // navy button on white background
      bgMode: "solid",
      bgSolidColor: "#ffffff",
      bgGradientFrom: "#ffffff",     // fallback
      bgGradientTo: "#f8fafc",
      buttonStyle: "rounded",
      buttonVariant: "filled",
      fontFamily: "inter",
      layoutVariant: "classic",
      avatarShape: "circle",
      avatarBorderWidth: 3,
      avatarBorderColor: "#171930",
      socialIconStyle: "rounded",
    },
  },
  {
    /* Nasalski Premium Estate — warm graphite + warm gold.
     * Inspiracja: centralny ciemny hero section ich strony (zespół w ciemnych
     * garniturach na graffitowym tle) + musztardowo-złote badge'e "TYLKO U NAS".
     * Vibe: modern premium, ekskluzywne biuro nieruchomości.
     * Użyte do breloków dla 9 doradców Nasalskiego (kampania kwiecień 2026). */
    id: "nasalski-grafit",
    name: "Nasalski Grafit",
    theme: {
      primaryColor: "#e0b968",       // warm gold button fill
      bgMode: "solid",
      bgSolidColor: "#2a2420",       // warm graphite (prawie czarny, ciepły)
      bgGradientFrom: "#2a2420",     // fallback
      bgGradientTo: "#2a2420",
      bgPattern: "none",
      buttonStyle: "rounded",
      buttonVariant: "filled",
      fontFamily: "inter",
      layoutVariant: "classic",
      avatarShape: "circle",
      avatarBorderWidth: 3,
      avatarBorderColor: "#e0b968",
      socialIconStyle: "rounded",
    },
  },
];
