"use client";

interface TrackedLinkProps {
  tagId: string;
  linkUrl: string;
  linkLabel: string;
  linkIcon: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  target?: string;
}

export default function TrackedLink({
  tagId,
  linkUrl,
  linkLabel,
  linkIcon,
  children,
  className,
  style,
  target = "_blank",
}: TrackedLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Fire tracking via sendBeacon (non-blocking, survives navigation) or
    // fetch with keepalive as fallback. We DO NOT preventDefault for
    // external/file links so the browser's native <a target="_blank"> works —
    // async window.open after setTimeout is blocked by mobile popup blockers.
    const payload = JSON.stringify({ tagId, linkUrl, linkLabel, linkIcon });
    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/link-click", blob);
      } else {
        fetch("/api/link-click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // tracking failed — still let the browser follow the link
    }

    // For tel:/mailto: we intentionally stay on page (target="_self") — the
    // browser handles the protocol handoff natively, no JS navigation needed.
    // For every other link (including our own /api/uploads/*.pdf), the <a>
    // element already has href + target + rel — the browser opens it natively
    // on this very click event, so no popup blocker kicks in.
    void e;
  };

  const isTelOrMailto = linkUrl.startsWith("tel:") || linkUrl.startsWith("mailto:");

  return (
    <a
      href={linkUrl}
      target={isTelOrMailto ? undefined : target}
      rel={isTelOrMailto ? undefined : "noopener noreferrer"}
      onClick={handleClick}
      className={className}
      style={style}
    >
      {children}
    </a>
  );
}
