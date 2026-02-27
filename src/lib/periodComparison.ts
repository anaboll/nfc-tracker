/* ------------------------------------------------------------------ */
/*  Period comparison helpers                                          */
/*  Pure functions — no API calls, no side effects                     */
/* ------------------------------------------------------------------ */

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

  const fmt = (d: Date): string => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return {
    current: { from: fmt(currentFrom), to: fmt(currentTo) },
    previous: { from: fmt(previousFrom), to: fmt(previousTo) },
  };
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
