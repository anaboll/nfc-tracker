/* ------------------------------------------------------------------ */
/*  Period comparison helpers                                          */
/*  Pure functions — no API calls, no side effects                     */
/* ------------------------------------------------------------------ */

import type { ComparisonMode } from "@/components/dashboard/ComparisonToggle";

export interface PeriodDates {
  current: { from: string; to: string };
  previous: { from: string; to: string };
}

export interface Delta {
  value: number;
  prevValue: number;
  change: number;
  changePercent: number;
  direction: "up" | "down" | "flat";
}

const fmt = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Given a current period (from → to), compute the previous period
 * of the same length ending right before the current one starts.
 *
 * Example: current 2026-02-20 → 2026-02-27
 *   → previous 2026-02-13 → 2026-02-20
 */
export function getPreviousPeriod(from: string | null, to: string | null): PeriodDates | null {
  if (!from) return null;

  const currentFrom = new Date(from);
  const currentTo = to ? new Date(to) : new Date();

  // Duration in ms
  const durationMs = currentTo.getTime() - currentFrom.getTime();
  if (durationMs <= 0) return null;

  // Previous period: same length, ending at currentFrom
  const previousTo = new Date(currentFrom.getTime());
  const previousFrom = new Date(currentFrom.getTime() - durationMs);

  return {
    current: { from: fmt(currentFrom), to: fmt(currentTo) },
    previous: { from: fmt(previousFrom), to: fmt(previousTo) },
  };
}

/**
 * Get comparison periods based on mode.
 *
 * - "day"    → today 00:00 → now  vs  yesterday 00:00 → yesterday same time
 * - "week"   → this Monday 00:00 → now  vs  last Monday 00:00 → last week same day/time
 * - "month"  → 1st of this month 00:00 → now  vs  1st of prev month → prev month same day/time
 * - "custom" → use the provided from/to and compute previous of same length
 */
export function getComparisonPeriods(
  mode: ComparisonMode,
  from: string | null,
  to: string | null,
): PeriodDates | null {
  if (mode === "off") return null;

  const now = new Date();

  if (mode === "day") {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayEnd = new Date(yesterdayStart.getTime() + (now.getTime() - todayStart.getTime()));
    return {
      current: { from: fmt(todayStart), to: fmt(now) },
      previous: { from: fmt(yesterdayStart), to: fmt(yesterdayEnd) },
    };
  }

  if (mode === "week") {
    // Monday = start of week (ISO)
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Mon=0, Sun=6
    const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0);
    const lastMonday = new Date(thisMonday.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekEnd = new Date(lastMonday.getTime() + (now.getTime() - thisMonday.getTime()));
    return {
      current: { from: fmt(thisMonday), to: fmt(now) },
      previous: { from: fmt(lastMonday), to: fmt(lastWeekEnd) },
    };
  }

  if (mode === "month") {
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
    // Same day-of-month offset in previous month
    const dayOffset = now.getTime() - thisMonthStart.getTime();
    const prevMonthEnd = new Date(prevMonthStart.getTime() + dayOffset);
    // Clamp to end of previous month
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const clampedEnd = prevMonthEnd > endOfPrevMonth ? endOfPrevMonth : prevMonthEnd;
    return {
      current: { from: fmt(thisMonthStart), to: fmt(now) },
      previous: { from: fmt(prevMonthStart), to: fmt(clampedEnd) },
    };
  }

  // mode === "custom" — use provided range
  return getPreviousPeriod(from, to);
}

/**
 * Compute delta between current and previous values.
 */
export function computeDelta(current: number, previous: number): Delta {
  const change = current - previous;
  let changePercent = 0;

  if (previous === 0 && current > 0) {
    changePercent = 100; // from zero to something = +100%
  } else if (previous === 0 && current === 0) {
    changePercent = 0;
  } else {
    changePercent = (change / previous) * 100;
  }

  const direction: Delta["direction"] =
    change > 0 ? "up" : change < 0 ? "down" : "flat";

  return {
    value: current,
    prevValue: previous,
    change,
    changePercent: Math.round(changePercent * 10) / 10,
    direction,
  };
}
