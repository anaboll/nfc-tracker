"use client";

interface TrackedLinkProps {
  tagId: string;
  linkUrl: string;
  linkLabel: string;
  linkIcon: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function TrackedLink({
  tagId,
  linkUrl,
  linkLabel,
  linkIcon,
  children,
  className,
  style,
}: TrackedLinkProps) {
  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // Fire tracking request (don't await - let it go)
    try {
      fetch("/api/link-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagId,
          linkUrl,
          linkLabel,
          linkIcon,
        }),
        keepalive: true, // ensures request completes even if page navigates
      });
    } catch {
      // tracking failed, still navigate
    }

    // Small delay to let the tracking request start, then navigate
    setTimeout(() => {
      window.open(linkUrl, "_blank", "noopener,noreferrer");
    }, 50);
  };

  return (
    <a
      href={linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
      style={style}
    >
      {children}
    </a>
  );
}
