"use client";

import { useEffect, useRef } from "react";

export default function OfferTracker() {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    const params = new URLSearchParams(window.location.search);
    fetch("/api/offer-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        utm_source: params.get("utm_source") || "",
        utm_medium: params.get("utm_medium") || "",
        utm_campaign: params.get("utm_campaign") || "",
        utm_content: params.get("utm_content") || "",
        utm_term: params.get("utm_term") || "",
        page: "/oferta/nieruchomosci",
        referrer: document.referrer,
      }),
    }).catch(() => {});
  }, []);

  return null;
}
