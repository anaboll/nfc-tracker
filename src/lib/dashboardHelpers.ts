/* ------------------------------------------------------------------ */
/*  Dashboard helper functions                                         */
/*  Pure functions extracted from src/app/dashboard/page.tsx            */
/* ------------------------------------------------------------------ */

import type { HourlyData, HourlyRawEntry } from "@/types/dashboard";

/* ---- Formatting helpers ---- */

export const formatDate = (iso: string | null): string => {
  if (!iso) return "---";
  const d = new Date(iso);
  return d.toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatWeekRange = (start: string, end: string): string => {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" });
  return `${fmt(s)} - ${fmt(e)}`;
};

export const formatWatchTime = (seconds: number | null): string => {
  if (seconds == null) return "---";
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}m ${sec}s`;
};

/** Relative time: "3 min temu", "wczoraj", "2 godz. temu" */
export const timeAgo = (iso: string | null): string => {
  if (!iso) return "---";
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  if (diff < 0) return "teraz";

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "przed chwilą";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min temu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} godz. temu`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "wczoraj";
  if (days < 7) return `${days} dni temu`;
  if (days < 30) return `${Math.floor(days / 7)} tyg. temu`;

  return formatDate(iso);
};

/* ---- Tag type helpers ---- */

export const getTagTypeLabel = (type: string): string => {
  switch (type) {
    case "url": return "URL";
    case "video": return "Video";
    case "multilink": return "Multi-link";
    case "vcard": return "Wizytówka";
    case "google-review": return "Recenzja Google";
    case "file": return "Plik";
    default: return "URL";
  }
};

export const getTagTypeColor = (type: string): { bg: string; color: string } => {
  switch (type) {
    case "url": return { bg: "rgba(124,58,237,0.15)", color: "#7dd3fc" };
    case "video": return { bg: "rgba(16,185,129,0.15)", color: "#10b981" };
    case "multilink": return { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" };
    case "vcard": return { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" };
    case "google-review": return { bg: "rgba(234,67,53,0.15)", color: "#ea4335" };
    case "file": return { bg: "rgba(250,204,21,0.15)", color: "#facc15" };
    default: return { bg: "rgba(124,58,237,0.15)", color: "#7dd3fc" };
  }
};

/* ---- Computed data builders ---- */

/** Build hourly distribution from raw timestamps + ipHash (client-side timezone!) */
export function buildHourlyData(raw: HourlyRawEntry[]): HourlyData[] {
  if (raw.length === 0) return [];
  const buckets = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0, uniqueUsers: 0 }));
  const ipSets: Set<string>[] = Array.from({ length: 24 }, () => new Set());
  for (const entry of raw) {
    const h = new Date(entry.t).getHours(); // browser local timezone
    buckets[h].count++;
    ipSets[h].add(entry.ip);
  }
  for (let i = 0; i < 24; i++) {
    buckets[i].uniqueUsers = ipSets[i].size;
  }
  return buckets;
}

/** Build heatmap data: dayOfWeek (0=Pon..6=Nd) × hour (0-23) → count */
export function buildHeatmapData(raw: HourlyRawEntry[]): number[][] {
  // 7 rows (days) × 24 cols (hours)
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
  for (const entry of raw) {
    const d = new Date(entry.t);
    const h = d.getHours();
    let dow = d.getDay(); // 0=Sun, 1=Mon..6=Sat
    dow = dow === 0 ? 6 : dow - 1; // convert to 0=Mon..6=Sun
    grid[dow][h]++;
  }
  return grid;
}

/** Build unique heatmap data: dayOfWeek × hour → unique IPs */
export function buildHeatmapUniqueData(raw: HourlyRawEntry[]): number[][] {
  const ipSets = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => new Set<string>()));
  for (const entry of raw) {
    const d = new Date(entry.t);
    const h = d.getHours();
    let dow = d.getDay();
    dow = dow === 0 ? 6 : dow - 1;
    ipSets[dow][h].add(entry.ip);
  }
  return ipSets.map(row => row.map(s => s.size));
}
