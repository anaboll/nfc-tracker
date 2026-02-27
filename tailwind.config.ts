import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0B0F1A",
        surface: "#151D35",
        "surface-2": "#1C2541",
        "surface-3": "#243052",
        brd: "rgba(148,163,184,0.08)",
        "brd-light": "rgba(148,163,184,0.15)",
        accent: "#38BDF8",
        "accent-light": "#7dd3fc",
        "accent-dim": "#0284c7",
        green: "#22c55e",
        "green-light": "#34d399",
        txt: "#F1F5F9",
        "txt-sec": "#94A3B8",
        "txt-muted": "#64748B",
      },
    },
  },
  plugins: [],
};
export default config;
