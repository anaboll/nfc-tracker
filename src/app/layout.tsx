import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import Providers from "./providers";
import CookieConsent from "@/components/shared/CookieConsent";

export const metadata: Metadata = {
  title: "TwojeNFC - Analytics Portal",
  description: "Track and analyze your NFC tag interactions",
};

/** Inline script that runs before React hydration to prevent theme flash */
const themeScript = `(function(){var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${GeistSans.variable} ${GeistMono.variable}`} data-theme="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body><Providers>{children}</Providers><CookieConsent /></body>
    </html>
  );
}
