/* ------------------------------------------------------------------ */
/*  Feature flags per client tier                                      */
/* ------------------------------------------------------------------ */

export type ClientTier = "basic" | "pro" | "business";

export interface TierFeatures {
  maxTags: number;                 // -1 = unlimited
  vCardThemePresets: boolean;      // pre-made theme presets
  vCardCustomColors: boolean;      // custom color pickers
  vCardCustomFonts: boolean;       // font selection
  vCardPatterns: boolean;          // background patterns
  vCardLayoutVariants: boolean;    // layout switching (modern, minimal)
  analytics: "basic" | "full";    // basic = KPI + weekly, full = all charts + geo + scan log
  seoMeta: boolean;               // custom OG tags per tag
  customDomain: boolean;          // CNAME mapping
  analyticsExport: boolean;       // CSV/PDF export
}

export const TIER_FEATURES: Record<ClientTier, TierFeatures> = {
  basic: {
    maxTags: 5,
    vCardThemePresets: true,
    vCardCustomColors: false,
    vCardCustomFonts: false,
    vCardPatterns: false,
    vCardLayoutVariants: false,
    analytics: "basic",
    seoMeta: false,
    customDomain: false,
    analyticsExport: false,
  },
  pro: {
    maxTags: 25,
    vCardThemePresets: true,
    vCardCustomColors: true,
    vCardCustomFonts: true,
    vCardPatterns: true,
    vCardLayoutVariants: true,
    analytics: "full",
    seoMeta: true,
    customDomain: false,
    analyticsExport: true,
  },
  business: {
    maxTags: -1,
    vCardThemePresets: true,
    vCardCustomColors: true,
    vCardCustomFonts: true,
    vCardPatterns: true,
    vCardLayoutVariants: true,
    analytics: "full",
    seoMeta: true,
    customDomain: true,
    analyticsExport: true,
  },
};

/**
 * Get features for a given tier string.
 * Falls back to "basic" if tier is unknown.
 */
export function getFeatures(tier: string): TierFeatures {
  return TIER_FEATURES[tier as ClientTier] || TIER_FEATURES.basic;
}

/**
 * Check if a specific feature is available for a tier.
 */
export function hasFeature(tier: string, feature: keyof TierFeatures): boolean {
  const features = getFeatures(tier);
  const val = features[feature];
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  return val !== "basic";
}
