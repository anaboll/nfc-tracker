"use client";

import type { ButtonStyle, ButtonVariant } from "@/types/vcard";
import { getContrastTextColor } from "@/lib/color-contrast";

interface Props {
  vcfBase64: string;
  fullName: string;
  primaryColor?: string;
  buttonStyle?: ButtonStyle;
  buttonVariant?: ButtonVariant;
}

function getButtonRadius(style: ButtonStyle): number {
  switch (style) {
    case "pill": return 50;
    case "square": return 4;
    default: return 8;
  }
}

export default function VCardActions({
  vcfBase64,
  fullName,
  primaryColor = "#7c3aed",
  buttonStyle = "rounded",
  buttonVariant = "filled",
}: Props) {
  const handleSaveContact = () => {
    const byteString = atob(vcfBase64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fullName.replace(/\s+/g, "_")}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const radius = getButtonRadius(buttonStyle);

  const baseStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 0",
    borderRadius: radius,
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "opacity 0.2s, transform 0.2s",
  };

  const variantStyle: React.CSSProperties =
    buttonVariant === "outline"
      ? {
          background: "transparent",
          border: `2px solid ${primaryColor}`,
          color: primaryColor,
          boxShadow: "none",
        }
      : buttonVariant === "ghost"
      ? {
          background: `${primaryColor}15`,
          border: "1px solid transparent",
          color: primaryColor,
          boxShadow: "none",
        }
      : {
          background: primaryColor,
          border: "none",
          color: getContrastTextColor(primaryColor),
          boxShadow: `0 4px 20px ${primaryColor}40`,
        };

  return (
    <button
      onClick={handleSaveContact}
      style={{ ...baseStyle, ...variantStyle }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "0.9";
        e.currentTarget.style.transform = "scale(1.01)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "1";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
      Zapisz kontakt
    </button>
  );
}
