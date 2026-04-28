import React from "react";

/* ------------------------------------------------------------------ */
/*  FoilSeal — ozdobna okragla pieczec (faux gold foil) do certyfikatu */
/*                                                                     */
/*  SVG z radial gradientem imitujacym zloty foil + text w okregu      */
/*  "CERTYFIKAT AUTENTYCZNOŚCI" + rok + mala gwiazda w centrum.        */
/*  Skaluje sie do zadanego rozmiaru, domyslnie 140px.                 */
/* ------------------------------------------------------------------ */

interface Props {
  size?: number;
  color?: string;           // kolor bazowy foil — domyslnie zloto #c9a961
  darkBg?: boolean;         // jesli paleta ciemna, pieczec ma inne wewnetrzne tlo
  year?: number;            // rok na pieczeci
}

export default function FoilSeal({ size = 140, color = "#c9a961", darkBg = false, year }: Props) {
  const id = `foil-${Math.random().toString(36).slice(2, 8)}`;  // unikalny id dla gradientu
  const lighter = lightenHex(color, 25);
  const darker = darkenHex(color, 20);
  const innerBg = darkBg ? "#0f0f1a" : "#f8f0dc";

  const circumferencePath = `
    M ${size / 2}, ${size / 2}
    m -${size * 0.38}, 0
    a ${size * 0.38}, ${size * 0.38} 0 1, 1 ${size * 0.76}, 0
    a ${size * 0.38}, ${size * 0.38} 0 1, 1 -${size * 0.76}, 0
  `;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`${id}-bg`} cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor={lighter} />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor={darker} />
        </radialGradient>
        <linearGradient id={`${id}-ring`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={lighter} />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor={darker} />
        </linearGradient>
        <path id={`${id}-arc`} d={circumferencePath} fill="none" />
      </defs>

      {/* Zewnetrzny okrag z guilloche-like podzialem (kropki co 10deg) */}
      <circle cx={size / 2} cy={size / 2} r={size * 0.48} fill={`url(#${id}-bg)`} />

      {/* Zabki na zewnetrznej krawedzi (jak na prawdziwej pieczeci lakowej) */}
      {Array.from({ length: 32 }).map((_, i) => {
        const angle = (i * 360) / 32;
        const rad = (angle * Math.PI) / 180;
        const r1 = size * 0.48;
        const r2 = size * 0.495;
        const x1 = size / 2 + r1 * Math.cos(rad);
        const y1 = size / 2 + r1 * Math.sin(rad);
        const x2 = size / 2 + r2 * Math.cos(rad);
        const y2 = size / 2 + r2 * Math.sin(rad);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={darker} strokeWidth={size * 0.008} />
        );
      })}

      {/* Okregi wewnetrzne */}
      <circle cx={size / 2} cy={size / 2} r={size * 0.44} fill="none" stroke={darker} strokeWidth={1} opacity={0.5} />
      <circle cx={size / 2} cy={size / 2} r={size * 0.31} fill={innerBg} stroke={darker} strokeWidth={1.5} />

      {/* Text w okregu (gorny pol) */}
      <text fill={darker} fontSize={size * 0.075} fontWeight={700} letterSpacing={size * 0.01} fontFamily="Georgia, serif">
        <textPath xlinkHref={`#${id}-arc`} startOffset="25%" textAnchor="middle">
          CERTYFIKAT · AUTENTYCZNOŚCI
        </textPath>
      </text>

      {/* Gwiazda w centrum */}
      <Star cx={size / 2} cy={size / 2 - size * 0.02} size={size * 0.11} color={color} />

      {/* Rok pod gwiazda */}
      {year && (
        <text
          x={size / 2}
          y={size / 2 + size * 0.14}
          textAnchor="middle"
          fill={darker}
          fontSize={size * 0.08}
          fontWeight={700}
          fontFamily="Georgia, serif"
        >
          {year}
        </text>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Star shape — 5-promienna                                           */
/* ------------------------------------------------------------------ */
function Star({ cx, cy, size, color }: { cx: number; cy: number; size: number; color: string }) {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? size : size * 0.4;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return <polygon points={points.join(" ")} fill={color} stroke="#000" strokeWidth={0.4} />;
}

/* ------------------------------------------------------------------ */
/*  Color helpers — bez extra libek                                    */
/* ------------------------------------------------------------------ */
function lightenHex(hex: string, percent: number): string {
  return shiftHex(hex, percent);
}
function darkenHex(hex: string, percent: number): string {
  return shiftHex(hex, -percent);
}
function shiftHex(hex: string, percent: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = Math.max(0, Math.min(255, parseInt(full.slice(0, 2), 16) + Math.round(255 * percent / 100)));
  const g = Math.max(0, Math.min(255, parseInt(full.slice(2, 4), 16) + Math.round(255 * percent / 100)));
  const b = Math.max(0, Math.min(255, parseInt(full.slice(4, 6), 16) + Math.round(255 * percent / 100)));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
