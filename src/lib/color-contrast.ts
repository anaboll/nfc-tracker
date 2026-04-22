/**
 * Returns a readable text color (#171930 for light backgrounds, #fff for dark)
 * based on the perceived brightness of the given hex color.
 *
 * Used by vCard button rendering so a white button (e.g. Laboversum dark theme
 * with primaryColor=#ffffff) gets dark text automatically instead of invisible
 * white-on-white.
 *
 * Formula: ITU-R BT.601 luminance approximation.
 * Threshold 160/255 chosen empirically — colors above that feel "light"
 * enough that black text is preferable.
 */
export function getContrastTextColor(hex: string): string {
  const c = hex.replace("#", "");
  if (c.length !== 3 && c.length !== 6) return "#fff";
  const full = c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  // Perceived brightness (ITU-R BT.601)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 160 ? "#171930" : "#fff";
}
