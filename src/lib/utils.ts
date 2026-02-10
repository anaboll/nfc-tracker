import crypto from "crypto";

export function parseUserAgent(ua: string): { deviceType: "iOS" | "Android" | "Desktop" } {
  const lower = ua.toLowerCase();
  if (/iphone|ipad|ipod/.test(lower)) return { deviceType: "iOS" };
  if (/android/.test(lower)) return { deviceType: "Android" };
  return { deviceType: "Desktop" };
}

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || "nfc-tracker-salt-2024";
  return crypto.createHash("sha256").update(ip + salt).digest("hex");
}

export async function getGeoLocation(ip: string) {
  const empty = { city: null, country: null, region: null };
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return empty;
  }
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=city,country,regionName`, {
      signal: ctrl.signal,
    });
    clearTimeout(tid);
    if (!res.ok) return empty;
    const data = await res.json();
    if (data.status === "fail") return empty;
    return { city: data.city || null, country: data.country || null, region: data.regionName || null };
  } catch {
    return empty;
  }
}

export function extractIp(forwarded: string | null, realIp: string | null, cfIp: string | null): string {
  if (cfIp) return cfIp;
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first && first !== "unknown") return first;
  }
  if (realIp && realIp !== "unknown") return realIp;
  return "unknown";
}

export const COUNTRY_FLAGS: Record<string, string> = {
  Poland: "\u{1F1F5}\u{1F1F1}", Germany: "\u{1F1E9}\u{1F1EA}", "United States": "\u{1F1FA}\u{1F1F8}",
  "United Kingdom": "\u{1F1EC}\u{1F1E7}", France: "\u{1F1EB}\u{1F1F7}", "Czech Republic": "\u{1F1E8}\u{1F1FF}",
  Slovakia: "\u{1F1F8}\u{1F1F0}", Austria: "\u{1F1E6}\u{1F1F9}", Netherlands: "\u{1F1F3}\u{1F1F1}",
  Sweden: "\u{1F1F8}\u{1F1EA}", Norway: "\u{1F1F3}\u{1F1F4}", Denmark: "\u{1F1E9}\u{1F1F0}",
  Switzerland: "\u{1F1E8}\u{1F1ED}", Italy: "\u{1F1EE}\u{1F1F9}", Spain: "\u{1F1EA}\u{1F1F8}",
  Ukraine: "\u{1F1FA}\u{1F1E6}", Canada: "\u{1F1E8}\u{1F1E6}", Japan: "\u{1F1EF}\u{1F1F5}",
};

export function getCountryFlag(country: string): string {
  return COUNTRY_FLAGS[country] || "\u{1F30D}";
}
