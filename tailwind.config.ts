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
        bg: "#0f0f1a",
        surface: "#16213e",
        "surface-2": "#1e1e3a",
        "surface-3": "#252547",
        brd: "#2a2a4a",
        "brd-light": "#3a3a5c",
        accent: "#7c3aed",
        "accent-light": "#9f67ff",
        green: "#10b981",
        "green-light": "#34d399",
        "txt": "#f0f0ff",
        "txt-sec": "#a0a0c0",
        "txt-muted": "#6060a0",
      },
    },
  },
  plugins: [],
};
export default config;
