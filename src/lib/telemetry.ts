/**
 * P0 Telemetry Engine – helpers for visitor/session cookies,
 * UTM extraction, IP hashing (HMAC-SHA256), device detection, and rawMeta.
 *
 * Zero frontend changes – all logic runs server-side.
 */

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VISITOR_COOKIE = "tn_visitor";
const SESSION_COOKIE = "tn_sess";
const SESSION_TS_COOKIE = "tn_sess_ts";
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const VISITOR_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds
const SESSION_MAX_AGE = 24 * 60 * 60; // 24h hard ceiling for cookie max-age (sliding via ts)

const HEADER_WHITELIST = [
  "user-agent",
  "accept-language",
  "referer",
  "sec-ch-ua",
  "sec-ch-ua-mobile",
  "sec-ch-ua-platform",
] as const;

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

function isSecure(): boolean {
  // Secure only when HTTPS in production.
  // Cloudflare Flexible SSL: server sees HTTP but browser sees HTTPS.
  // Mirror existing NextAuth approach: default non-secure.
  return false; // same as auth.ts – Cloudflare Flexible SSL
}

function cookieOpts(maxAge: number): {
  httpOnly: boolean;
  sameSite: "lax";
  path: string;
  secure: boolean;
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: isSecure(),
    maxAge,
  };
}

function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Read tn_visitor / tn_sess from the incoming request,
 * create them if missing or expired, and return values + Set-Cookie headers
 * to be applied to the response.
 *
 * Works for both route handlers (NextRequest) and server components (headers()).
 */
export function resolveVisitorSession(request: NextRequest): {
  visitorId: string;
  sessionId: string;
  setCookies: Array<{ name: string; value: string; options: ReturnType<typeof cookieOpts> }>;
} {
  const setCookies: Array<{ name: string; value: string; options: ReturnType<typeof cookieOpts> }> = [];

  // --- visitor ---
  let visitorId = request.cookies.get(VISITOR_COOKIE)?.value || "";
  if (!visitorId) {
    visitorId = generateUUID();
    setCookies.push({ name: VISITOR_COOKIE, value: visitorId, options: cookieOpts(VISITOR_MAX_AGE) });
  }

  // --- session ---
  let sessionId = request.cookies.get(SESSION_COOKIE)?.value || "";
  const sessTs = request.cookies.get(SESSION_TS_COOKIE)?.value || "";
  const now = Date.now();

  let expired = false;
  if (!sessionId || !sessTs) {
    expired = true;
  } else {
    const ts = parseInt(sessTs, 10);
    const ONE_DAY_MS = 86400000;
    // Expired if: NaN, negative, future (> now + 1 day), or older than TTL
    if (isNaN(ts) || ts < 0 || ts > now + ONE_DAY_MS || now - ts > SESSION_TTL_MS) {
      expired = true;
    }
  }

  if (expired) {
    sessionId = generateUUID();
  }

  // Always refresh session cookies (sliding TTL)
  setCookies.push({ name: SESSION_COOKIE, value: sessionId, options: cookieOpts(SESSION_MAX_AGE) });
  setCookies.push({ name: SESSION_TS_COOKIE, value: String(now), options: cookieOpts(SESSION_MAX_AGE) });

  return { visitorId, sessionId, setCookies };
}

/**
 * Variant for server components that use next/headers cookies() API.
 * Returns only the IDs (cannot set cookies in server components – caller must handle).
 */
export function resolveVisitorSessionFromCookies(cookieStore: ReturnType<typeof cookies>): {
  visitorId: string;
  sessionId: string;
  isNew: boolean;
} {
  let visitorId = cookieStore.get(VISITOR_COOKIE)?.value || "";
  let sessionId = cookieStore.get(SESSION_COOKIE)?.value || "";
  const sessTs = cookieStore.get(SESSION_TS_COOKIE)?.value || "";
  const now = Date.now();
  let isNew = false;

  if (!visitorId) {
    visitorId = generateUUID();
    isNew = true;
  }

  let expired = false;
  if (!sessionId || !sessTs) {
    expired = true;
  } else {
    const ts = parseInt(sessTs, 10);
    const ONE_DAY_MS = 86400000;
    if (isNaN(ts) || ts < 0 || ts > now + ONE_DAY_MS || now - ts > SESSION_TTL_MS) {
      expired = true;
    }
  }

  if (expired) {
    sessionId = generateUUID();
    isNew = true;
  }

  return { visitorId, sessionId, isNew };
}

/**
 * Apply Set-Cookie headers to a NextResponse.
 */
export function applyTelemetryCookies(
  response: NextResponse,
  setCookies: Array<{ name: string; value: string; options: ReturnType<typeof cookieOpts> }>
): void {
  for (const c of setCookies) {
    response.cookies.set(c.name, c.value, c.options);
  }
}

// ---------------------------------------------------------------------------
// IP helpers
// ---------------------------------------------------------------------------

/**
 * Clean raw IP: strip brackets, strip ::ffff: prefix, strip port (IPv4 only).
 * Order matters: brackets first, then ::ffff:, then port.
 */
export function cleanIp(raw: string): string {
  let ip = raw.trim();

  // 1. Strip brackets from IPv6 [::1]:port or [2001:db8::1]
  if (ip.startsWith("[")) {
    const bracketEnd = ip.indexOf("]");
    if (bracketEnd > 0) {
      ip = ip.slice(1, bracketEnd); // everything inside brackets, ignore :port after ]
    }
  }

  // 2. Strip ::ffff: IPv4-mapped prefix (e.g. ::ffff:1.2.3.4 → 1.2.3.4)
  if (ip.toLowerCase().startsWith("::ffff:")) {
    ip = ip.slice(7);
  }

  // 3. Strip port from IPv4 ONLY (1.2.3.4:12345)
  //    Don't touch IPv6 – colons are part of the address
  if (ip.includes(".") && !ip.includes("::") && ip.includes(":")) {
    const lastColon = ip.lastIndexOf(":");
    const possiblePort = ip.slice(lastColon + 1);
    if (/^\d{1,5}$/.test(possiblePort)) {
      ip = ip.slice(0, lastColon);
    }
  }

  return ip;
}

/**
 * Detect IP version: 4 or 6. Returns null if unknown.
 */
export function ipVersion(ip: string): 4 | 6 | null {
  if (ip.includes(":")) return 6;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return 4;
  return null;
}

/**
 * Extract IP prefix: IPv4 → a.b.c.0 (/24), IPv6 → first 3 hextets + :: (/48).
 */
export function ipPrefix(ip: string): string | null {
  const ver = ipVersion(ip);
  if (ver === 4) {
    const parts = ip.split(".");
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    return null;
  }
  if (ver === 6) {
    // Expand :: to full form is complex; just take first 3 colon-separated groups
    const groups = ip.split(":");
    const first3 = groups.slice(0, 3).map((g) => g || "0");
    return `${first3.join(":")}::`;
  }
  return null;
}

/**
 * HMAC-SHA256 IP hash using IP_HASH_SECRET env var.
 * If secret missing: log warn once and return null (do NOT crash).
 */
let _warnedNoSecret = false;

export function hmacIpHash(ip: string): string | null {
  const secret = process.env.IP_HASH_SECRET;
  if (!secret) {
    if (!_warnedNoSecret) {
      console.warn("[telemetry] IP_HASH_SECRET not set – ipHash will be null. Set it in .env for production.");
      _warnedNoSecret = true;
    }
    return null;
  }
  return crypto.createHmac("sha256", secret).update(ip).digest("hex");
}

/**
 * Enhanced IP extraction: x-forwarded-for (first PUBLIC IP), cf-connecting-ip, x-real-ip, fallback.
 * Cleans the result.
 */
export function extractCleanIp(
  forwarded: string | null,
  realIp: string | null,
  cfIp: string | null
): string {
  let raw = "unknown";
  if (cfIp) {
    raw = cfIp;
  } else if (forwarded) {
    // Take first non-private IP from x-forwarded-for chain
    const parts = forwarded.split(",").map((s) => s.trim());
    for (const part of parts) {
      const cleaned = cleanIp(part);
      if (cleaned && cleaned !== "unknown" && !isPrivateIp(cleaned)) {
        raw = cleaned;
        break;
      }
    }
    // Fallback to first entry if all private
    if (raw === "unknown" && parts[0]) {
      raw = parts[0];
    }
  } else if (realIp && realIp !== "unknown") {
    raw = realIp;
  }
  return cleanIp(raw);
}

function isPrivateIp(ip: string): boolean {
  // IPv4 loopback 127.0.0.0/8
  if (ip.startsWith("127.")) return true;
  // IPv6 loopback
  if (ip === "::1") return true;
  // IPv4 private ranges
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (ip.startsWith("172.")) {
    const second = parseInt(ip.split(".")[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  // Link-local 169.254.0.0/16
  if (ip.startsWith("169.254.")) return true;
  // CGNAT 100.64.0.0/10 (100.64.x.x – 100.127.x.x)
  if (ip.startsWith("100.")) {
    const second = parseInt(ip.split(".")[1], 10);
    if (second >= 64 && second <= 127) return true;
  }
  // IPv6 ULA fc00::/7
  if (ip.startsWith("fc") || ip.startsWith("fd")) return true;
  // IPv6 link-local fe80::/10
  if (ip.toLowerCase().startsWith("fe80")) return true;
  return false;
}

// ---------------------------------------------------------------------------
// UTM / query extraction
// ---------------------------------------------------------------------------

export interface UtmParams {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  gclid: string | null;
  fbclid: string | null;
}

export function extractUtm(url: URL): UtmParams {
  return {
    utmSource: url.searchParams.get("utm_source") || null,
    utmMedium: url.searchParams.get("utm_medium") || null,
    utmCampaign: url.searchParams.get("utm_campaign") || null,
    utmContent: url.searchParams.get("utm_content") || null,
    utmTerm: url.searchParams.get("utm_term") || null,
    gclid: url.searchParams.get("gclid") || null,
    fbclid: url.searchParams.get("fbclid") || null,
  };
}

// ---------------------------------------------------------------------------
// Device type (enhanced)
// ---------------------------------------------------------------------------

export type DeviceType = "iOS" | "Android" | "Desktop" | "Bot" | "Unknown";

export function detectDeviceType(ua: string): DeviceType {
  if (!ua) return "Unknown";
  const lower = ua.toLowerCase();

  // Bots
  if (
    /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|fetch|curl|wget|python|httpx|axios|node-fetch|go-http-client/i.test(
      lower
    )
  ) {
    return "Bot";
  }

  if (/iphone|ipad|ipod/.test(lower)) return "iOS";
  if (/android/.test(lower)) return "Android";

  // Check for common desktop indicators
  if (/windows|macintosh|mac os x|linux|x11|cros/.test(lower)) return "Desktop";

  return "Unknown";
}

// ---------------------------------------------------------------------------
// Field truncation (DOS protection)
// ---------------------------------------------------------------------------

const MAX_FIELD_LENGTH = 4000;

export function truncateField(val: string | null, maxLen = MAX_FIELD_LENGTH): string | null {
  if (!val) return val;
  return val.length > maxLen ? val.slice(0, maxLen) : val;
}

// ---------------------------------------------------------------------------
// PII parameter filter for rawMeta query params
// ---------------------------------------------------------------------------

const PII_PARAM_PATTERNS = [
  /email/i, /phone/i, /token/i, /key/i, /password/i,
  /secret/i, /ssn/i, /\bcc\b/i, /credit/i, /card/i,
  /auth/i, /session/i, /csrf/i,
];

function filterPiiParams(params: Record<string, string>): Record<string, string> {
  const filtered: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    const isPii = PII_PARAM_PATTERNS.some((pattern) => pattern.test(key));
    if (!isPii) {
      filtered[key] = value;
    }
  }
  return filtered;
}

// ---------------------------------------------------------------------------
// rawMeta builder
// ---------------------------------------------------------------------------

export function buildRawMeta(headers: Headers, url: URL): string {
  const headersObj: Record<string, string> = {};
  for (const name of HEADER_WHITELIST) {
    const val = headers.get(name);
    if (val) headersObj[name] = val;
  }

  const queryParams = Object.fromEntries(url.searchParams.entries());
  const safeQuery = filterPiiParams(queryParams);

  const meta = {
    headers: headersObj,
    query: safeQuery,
    path: url.pathname,
  };

  return truncateField(JSON.stringify(meta)) ?? "";
}

// ---------------------------------------------------------------------------
// Schema mismatch error detection (for smart fallback)
// ---------------------------------------------------------------------------

/**
 * Check if a Prisma error is due to unknown fields (schema mismatch).
 * Only these errors should trigger a fallback without telemetry fields.
 * Other errors (connection, constraint) should propagate.
 */
export function isSchemaMismatchError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as Record<string, unknown>;
  // Prisma error codes for schema issues:
  // P2009: validation error (unknown field)
  // P2025: record not found (shouldn't happen on create but safe to include)
  const code = e.code as string | undefined;
  if (code === "P2009") return true;
  // Also catch generic "unknown field" messages from Prisma
  const msg = (e.message as string) || "";
  if (msg.includes("Unknown argument") || msg.includes("Unknown field")) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Full telemetry data collector (for route handlers with NextRequest)
// ---------------------------------------------------------------------------

export interface TelemetryData {
  visitorId: string;
  sessionId: string;
  // UTM
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  gclid: string | null;
  fbclid: string | null;
  // Meta
  referrer: string | null;
  acceptLanguage: string | null;
  userAgent: string | null;
  deviceType: DeviceType;
  path: string | null;
  query: string | null;
  rawMeta: string | null;
  // IP
  ipHash: string | null;
  ipPrefix: string | null;
  ipVersion: number | null;
}

export function collectTelemetry(request: NextRequest): {
  data: TelemetryData;
  setCookies: Array<{ name: string; value: string; options: ReturnType<typeof cookieOpts> }>;
  rawIp: string;
} {
  const hdrs = request.headers;
  const url = new URL(request.url);

  // Cookies
  const { visitorId, sessionId, setCookies } = resolveVisitorSession(request);

  // IP
  const rawIp = extractCleanIp(
    hdrs.get("x-forwarded-for"),
    hdrs.get("x-real-ip"),
    hdrs.get("cf-connecting-ip")
  );
  const ipHashVal = hmacIpHash(rawIp);
  const ipVer = ipVersion(rawIp);
  const ipPfx = ipPrefix(rawIp);

  // UTM
  const utm = extractUtm(url);

  // Meta
  const ua = hdrs.get("user-agent") || "";
  const device = detectDeviceType(ua);
  const rawMeta = buildRawMeta(hdrs, url);

  const data: TelemetryData = {
    visitorId,
    sessionId,
    ...utm,
    referrer: truncateField(hdrs.get("referer") || null),
    acceptLanguage: truncateField(hdrs.get("accept-language") || null, 500),
    userAgent: truncateField(ua || null),
    deviceType: device,
    path: truncateField(url.pathname || null, 2000),
    query: truncateField(url.search || null, 2000),
    rawMeta,
    ipHash: ipHashVal,
    ipPrefix: ipPfx,
    ipVersion: ipVer,
  };

  return { data, setCookies, rawIp };
}

/**
 * Subset of telemetry data for Prisma create – only the new telemetry columns.
 * Existing fields (like the old ipHash from hashIp()) are NOT included here;
 * callers merge this into their existing data object.
 */
export function telemetryFields(t: TelemetryData): Record<string, unknown> {
  return {
    visitorId: t.visitorId,
    sessionId: t.sessionId,
    utmSource: t.utmSource,
    utmMedium: t.utmMedium,
    utmCampaign: t.utmCampaign,
    utmContent: t.utmContent,
    utmTerm: t.utmTerm,
    gclid: t.gclid,
    fbclid: t.fbclid,
    acceptLanguage: t.acceptLanguage,
    path: t.path,
    query: t.query,
    rawMeta: t.rawMeta,
    ipPrefix: t.ipPrefix,
    ipVersion: t.ipVersion,
  };
}
