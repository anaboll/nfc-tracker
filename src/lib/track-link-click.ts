/* ------------------------------------------------------------------ */
/*  fireLinkClick — non-blocking analytics dla LinkClick.              */
/*                                                                     */
/*  Używana przez TrackedLink (zwykłe <a>) ORAZ EmailActionSheet       */
/*  (custom button który NIE używa <a> bo musi pokazać modal przed     */
/*  potencjalnym mailto:). Ta sama logika sendBeacon + fallback        */
/*  zapewnia że statystyki kliknięć są spójne niezależnie od typu UI.  */
/* ------------------------------------------------------------------ */

interface LinkClickPayload {
  tagId: string;
  linkUrl: string;
  linkLabel: string;
  linkIcon: string;
}

/**
 * Wysyła telemetry kliknięcia linka do /api/link-click. Non-blocking —
 * używa navigator.sendBeacon (przeżyje navigation) lub fetch z keepalive
 * jako fallback. Nigdy nie throwuje, nigdy nie czeka — fire and forget.
 */
export function fireLinkClick(payload: LinkClickPayload): void {
  const data = JSON.stringify(payload);
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([data], { type: "application/json" });
      navigator.sendBeacon("/api/link-click", blob);
    } else {
      fetch("/api/link-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: data,
        keepalive: true,
      }).catch(() => {
        /* tracking failed — silent */
      });
    }
  } catch {
    /* sendBeacon throws on hostile envs (privacy mode, no navigator) — silent */
  }
}
