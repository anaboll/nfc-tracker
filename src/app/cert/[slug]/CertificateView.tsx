"use client";

/* ------------------------------------------------------------------ */
/*  CertificateView — client render certyfikatu.                       */
/*                                                                     */
/*  Dwa widoki w jednym komponencie:                                   */
/*    - Web (mobile-first) — domyslny, po tapie NFC                    */
/*    - Print (A4 portret) — tylko @media print, po kliknieciu         */
/*      "Pobierz PDF" uruchamia window.print()                         */
/*                                                                     */
/*  Te same dane zrodlowe, rozne layout/styles przez CSS class toggle. */
/* ------------------------------------------------------------------ */

import React from "react";
import type { CertificateData } from "@/types/certificate";
import { MEDIUM_LABELS, SUBSTRATE_LABELS, PALETTE_COLORS } from "@/types/certificate";
import FoilSeal from "@/components/certificate/FoilSeal";

interface Props {
  cert: CertificateData;
  tagId: string;
  publicUrl: string;
  fromDashboard: boolean;
}

export default function CertificateView({ cert, tagId, publicUrl, fromDashboard }: Props) {
  const palette = cert.theme?.palette || "premium-ecru";
  const fontHeading = cert.theme?.fontHeading || "playfair";
  const colors = PALETTE_COLORS[palette];

  const fontStack = fontHeading === "playfair"
    ? "'Playfair Display', Georgia, serif"
    : fontHeading === "cormorant"
      ? "'Cormorant Garamond', Georgia, serif"
      : "'Inter', system-ui, sans-serif";

  const artistFull = [cert.artistFirstName, cert.artistLastName].filter(Boolean).join(" ");
  const dimensions = cert.dimensionsW && cert.dimensionsH
    ? `${cert.dimensionsW} × ${cert.dimensionsH}${cert.dimensionsD ? ` × ${cert.dimensionsD}` : ""} cm`
    : null;
  const mediumLabel = cert.medium ? MEDIUM_LABELS[cert.medium] : null;
  const substrateLabel = cert.substrate ? SUBSTRATE_LABELS[cert.substrate] : null;
  const techniqueLine = [mediumLabel, substrateLabel].filter(Boolean).join(" na ");
  const fullTechnique = [techniqueLine, cert.mediumDetails].filter(Boolean).join(" — ");

  /* Pobierz PDF — serwer generuje i serwuje jako plik. Zamiast window.print()
   * ktore silent-failuje na iOS Chrome i niekonsystentnie dziala na Android.
   * Prawdziwy plik PDF dziala wszedzie i moze byc zapisany / wydrukowany / wysłany.*/
  const pdfUrl = `/api/cert/${tagId}/pdf`;

  const heroPhoto = cert.photos[0] || "";
  const detailPhotos = cert.photos.slice(1);

  return (
    <>
      {/* Ladowanie Google Fonts dla premium serif */}
      {(fontHeading === "playfair" || fontHeading === "cormorant") && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link
          rel="stylesheet"
          href={
            fontHeading === "playfair"
              ? "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&display=swap"
              : "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700;800&display=swap"
          }
        />
      )}

      {/* ========================================================== */}
      {/*  PRINT STYLES — aktywne tylko przy window.print()          */}
      {/* ========================================================== */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          body { background: ${colors.bg} !important; }
          .cert-noprint { display: none !important; }
          .cert-web-only { display: none !important; }
          .cert-print-only { display: block !important; }
          .cert-container {
            padding: 0 !important;
          }
          .cert-print-page {
            width: 210mm;
            min-height: 297mm;
            page-break-after: always;
          }
        }
        @media screen {
          .cert-print-only { display: none !important; }
        }

        /* Subtelna animacja wejscia */
        @keyframes certFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .cert-hero { animation: certFadeIn 0.5s ease-out; }
      `}</style>

      <main
        className="cert-container"
        style={{
          minHeight: "100vh",
          background: colors.bg,
          color: colors.fg,
          fontFamily: fontStack,
          padding: "24px 16px 40px",
        }}
      >
        {fromDashboard && (
          <a
            href="/dashboard"
            className="cert-noprint"
            style={{
              display: "inline-block",
              marginBottom: 20,
              padding: "6px 12px",
              background: `${colors.accent}22`,
              color: colors.fg,
              border: `1px solid ${colors.accent}`,
              borderRadius: 6,
              textDecoration: "none",
              fontSize: 12,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            ← Wroc do panelu
          </a>
        )}

        {/* ========================================================== */}
        {/*  WEB VIEW (mobile-first)                                   */}
        {/* ========================================================== */}
        <article className="cert-web-only" style={{ maxWidth: 700, margin: "0 auto" }}>

          {/* Hero photo */}
          {heroPhoto && (
            <div
              className="cert-hero"
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "4/3",
                background: `${colors.fg}0d`,
                borderRadius: 4,
                overflow: "hidden",
                border: `1px solid ${colors.accent}40`,
                marginBottom: 20,
                boxShadow: `0 8px 40px ${colors.fg}26`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroPhoto}
                alt={cert.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />

              {/* Verified badge */}
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: `${colors.bg}f0`,
                  backdropFilter: "blur(6px)",
                  border: `1px solid ${colors.accent}`,
                  borderRadius: 16,
                  color: colors.accent,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Zweryfikowano
              </div>
            </div>
          )}

          {/* Title + artist */}
          <header style={{ textAlign: "center", padding: "0 8px", marginBottom: 24 }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: colors.muted,
                marginBottom: 12,
                fontFamily: "system-ui, sans-serif",
                fontWeight: 600,
              }}
            >
              Certyfikat Autentyczności
            </div>
            <h1
              style={{
                fontSize: "clamp(28px, 6vw, 44px)",
                fontWeight: 700,
                lineHeight: 1.15,
                margin: "0 0 12px",
                letterSpacing: "-0.01em",
                fontStyle: "italic",
              }}
            >
              {cert.title}
            </h1>
            <div
              style={{
                fontSize: 17,
                fontWeight: 500,
                color: colors.muted,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {artistFull}{cert.year ? `, ${cert.year}` : ""}
            </div>
          </header>

          {/* Metadata table */}
          <div
            style={{
              margin: "24px auto",
              maxWidth: 540,
              padding: "18px 24px",
              border: `1px solid ${colors.accent}55`,
              borderRadius: 2,
              background: `${colors.accent}0a`,
            }}
          >
            <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", rowGap: 10, columnGap: 20 }}>
              {fullTechnique && <MetaRow label="Technika" value={fullTechnique} colors={colors} />}
              {dimensions && <MetaRow label="Wymiary" value={dimensions} colors={colors} />}
              {cert.year && <MetaRow label="Rok powstania" value={String(cert.year)} colors={colors} />}
              <MetaRow label="Numer seryjny" value={cert.serialNumber || "—"} colors={colors} mono />
              <MetaRow label="Data wydania" value={formatDate(cert.issueDate)} colors={colors} />
            </dl>
          </div>

          {/* Description */}
          {cert.description && (
            <section
              style={{
                maxWidth: 560,
                margin: "32px auto",
                padding: "0 12px",
                fontSize: 15,
                lineHeight: 1.8,
                color: colors.fg,
                fontStyle: "italic",
                textAlign: "center",
                fontFamily: fontStack,
              }}
            >
              "{cert.description}"
            </section>
          )}

          {/* Detail photos */}
          {detailPhotos.length > 0 && (
            <section style={{ margin: "32px auto", maxWidth: 640 }}>
              <div
                style={{
                  fontSize: 10,
                  textAlign: "center",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: colors.muted,
                  marginBottom: 14,
                  fontFamily: "system-ui, sans-serif",
                  fontWeight: 600,
                }}
              >
                Dokumentacja szczegółowa
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 10,
                }}
              >
                {detailPhotos.map((p, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={p}
                    alt={`Detal ${i + 1}`}
                    style={{
                      width: "100%",
                      aspectRatio: "1/1",
                      objectFit: "cover",
                      borderRadius: 2,
                      border: `1px solid ${colors.accent}40`,
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Signature + Foil Seal block */}
          <section
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
              maxWidth: 560,
              margin: "40px auto 32px",
              padding: "0 8px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: "1 1 auto", minWidth: 180, textAlign: "center" }}>
              {cert.signaturePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cert.signaturePhoto}
                  alt="Podpis artysty"
                  style={{ maxWidth: 200, maxHeight: 80, filter: palette === "dark-luxury" || palette === "noir-gold" ? "invert(1)" : undefined }}
                />
              ) : (
                <div style={{ height: 60, borderBottom: `1px solid ${colors.muted}`, marginBottom: 4 }} />
              )}
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: colors.muted,
                  marginTop: 6,
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                Podpis artysty
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{artistFull}</div>
            </div>

            {palette !== "modern-minimal" && (
              <div style={{ flex: "0 0 auto" }}>
                <FoilSeal size={120} color={colors.accent} darkBg={palette === "dark-luxury" || palette === "noir-gold"} year={cert.year} />
              </div>
            )}
          </section>

          {/* Download PDF button — anchor do endpointu generującego plik.
              Dziala wszedzie (mobile + desktop), bo to jest zwykly link do PDF. */}
          <div className="cert-noprint" style={{ textAlign: "center", margin: "40px 0 16px" }}>
            <a
              href={pdfUrl}
              download
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 28px",
                background: colors.accent,
                color: palette === "modern-minimal" ? "#fff" : "#1a1a2e",
                border: "none",
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "system-ui, sans-serif",
                boxShadow: `0 4px 20px ${colors.accent}55`,
                transition: "transform 0.15s, box-shadow 0.15s",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 6px 24px ${colors.accent}77`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 4px 20px ${colors.accent}55`;
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Pobierz PDF
            </a>
            <div style={{ marginTop: 10, fontSize: 11, color: colors.muted, fontFamily: "system-ui, sans-serif" }}>
              Certyfikat w formacie A4 — nadaje sie do wydruku
            </div>
          </div>

          {/* Footer */}
          <footer style={{ textAlign: "center", marginTop: 40, paddingTop: 20, borderTop: `1px solid ${colors.muted}33` }}>
            <div style={{ fontSize: 10, color: colors.muted, letterSpacing: "0.1em", fontFamily: "system-ui, sans-serif" }}>
              CERTIFICATE ID: <span style={{ fontFamily: "monospace" }}>{tagId}</span>
            </div>
            <div style={{ fontSize: 10, color: colors.muted, marginTop: 4, fontFamily: "system-ui, sans-serif" }}>
              Powered by{" "}
              <a href="https://twojenfc.pl" style={{ color: colors.muted, textDecoration: "none" }}>
                TwojeNFC.pl
              </a>
            </div>
          </footer>
        </article>

        {/* ========================================================== */}
        {/*  PRINT VIEW (A4 portrait, hidden on screen)                */}
        {/* ========================================================== */}
        <section className="cert-print-only cert-print-page" style={{ display: "none" }}>
          <div style={{
            position: "relative",
            width: "210mm",
            height: "297mm",
            background: colors.bg,
            color: colors.fg,
            padding: "20mm 18mm",
            boxSizing: "border-box",
            fontFamily: fontStack,
          }}>
            {/* Ozdobna ramka (podwojna linia) */}
            <div style={{
              position: "absolute",
              inset: "10mm",
              border: `2pt solid ${colors.accent}`,
              pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute",
              inset: "13mm",
              border: `0.5pt solid ${colors.accent}`,
              pointerEvents: "none",
            }} />

            {/* Headline */}
            <div style={{ textAlign: "center", marginTop: "8mm", marginBottom: "6mm" }}>
              <div style={{
                fontSize: "10pt",
                letterSpacing: "0.3em",
                color: colors.muted,
                fontFamily: "'Inter', system-ui, sans-serif",
                fontWeight: 600,
              }}>
                CERTIFICATE OF AUTHENTICITY
              </div>
              <h1 style={{
                fontSize: "24pt",
                fontWeight: 700,
                margin: "4mm 0 2mm",
                letterSpacing: "0.02em",
              }}>
                CERTYFIKAT AUTENTYCZNOŚCI
              </h1>
            </div>

            {/* Hero photo */}
            {heroPhoto && (
              <div style={{ textAlign: "center", marginBottom: "6mm" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroPhoto}
                  alt={cert.title}
                  style={{
                    maxWidth: "130mm",
                    maxHeight: "75mm",
                    objectFit: "contain",
                    border: `1pt solid ${colors.accent}55`,
                  }}
                />
              </div>
            )}

            {/* Title + artist */}
            <div style={{ textAlign: "center", marginBottom: "6mm" }}>
              <div style={{ fontSize: "22pt", fontWeight: 700, fontStyle: "italic", letterSpacing: "-0.01em", marginBottom: "2mm" }}>
                {cert.title}
              </div>
              <div style={{ fontSize: "12pt", color: colors.muted, fontFamily: "'Inter', system-ui, sans-serif" }}>
                {artistFull}{cert.year ? `, ${cert.year}` : ""}
              </div>
            </div>

            {/* Metadata table */}
            <div style={{
              margin: "0 auto 6mm",
              width: "150mm",
              fontSize: "9pt",
              fontFamily: "'Inter', system-ui, sans-serif",
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {fullTechnique && <PrintMetaRow label="Technika" value={fullTechnique} colors={colors} />}
                  {dimensions && <PrintMetaRow label="Wymiary" value={dimensions} colors={colors} />}
                  {cert.year && <PrintMetaRow label="Rok powstania" value={String(cert.year)} colors={colors} />}
                  <PrintMetaRow label="Numer seryjny" value={cert.serialNumber || "—"} colors={colors} mono />
                  <PrintMetaRow label="Data wydania" value={formatDate(cert.issueDate)} colors={colors} />
                </tbody>
              </table>
            </div>

            {/* Description */}
            {cert.description && (
              <div style={{
                textAlign: "center",
                fontSize: "11pt",
                fontStyle: "italic",
                margin: "0 auto 8mm",
                width: "160mm",
                lineHeight: 1.5,
              }}>
                &ldquo;{cert.description}&rdquo;
              </div>
            )}

            {/* Signature + Foil seal — bottom */}
            <div style={{
              position: "absolute",
              bottom: "28mm",
              left: "20mm",
              right: "20mm",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: "8mm",
            }}>
              <div style={{ textAlign: "center", minWidth: "60mm" }}>
                {cert.signaturePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cert.signaturePhoto}
                    alt="Podpis"
                    style={{ maxWidth: "60mm", maxHeight: "20mm", filter: palette === "dark-luxury" || palette === "noir-gold" ? "invert(1)" : undefined }}
                  />
                ) : (
                  <div style={{ height: "15mm", borderBottom: `0.5pt solid ${colors.fg}` }} />
                )}
                <div style={{
                  fontSize: "8pt",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: colors.muted,
                  marginTop: "2mm",
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}>
                  Podpis artysty
                </div>
                <div style={{ fontSize: "10pt", fontWeight: 600, fontFamily: "'Inter', system-ui, sans-serif" }}>
                  {artistFull}
                </div>
              </div>

              {palette !== "modern-minimal" && (
                <div>
                  <FoilSeal size={110} color={colors.accent} darkBg={palette === "dark-luxury" || palette === "noir-gold"} year={cert.year} />
                </div>
              )}
            </div>

            {/* Bottom metadata — serial + QR */}
            <div style={{
              position: "absolute",
              bottom: "13mm",
              left: "20mm",
              right: "20mm",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              fontSize: "7.5pt",
              color: colors.muted,
              fontFamily: "'Inter', system-ui, sans-serif",
            }}>
              <div>
                <div style={{ letterSpacing: "0.15em", textTransform: "uppercase" }}>Certificate ID</div>
                <div style={{ fontFamily: "monospace", color: colors.fg, fontWeight: 600, fontSize: "9pt" }}>{tagId}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ letterSpacing: "0.15em", textTransform: "uppercase" }}>Verify online</div>
                <div style={{ color: colors.fg, fontWeight: 500, fontSize: "8pt" }}>{publicUrl}</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

/* ------------------------------------------------------------------ */
function MetaRow({ label, value, colors, mono }: { label: string; value: string; colors: { fg: string; muted: string; accent: string }; mono?: boolean }) {
  return (
    <>
      <dt style={{
        fontSize: 11,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: colors.muted,
        fontFamily: "system-ui, sans-serif",
        fontWeight: 600,
        alignSelf: "baseline",
      }}>
        {label}
      </dt>
      <dd style={{
        margin: 0,
        fontSize: 14,
        color: colors.fg,
        fontFamily: mono ? "monospace" : "system-ui, sans-serif",
        fontWeight: mono ? 600 : 500,
      }}>
        {value}
      </dd>
    </>
  );
}

function PrintMetaRow({ label, value, colors, mono }: { label: string; value: string; colors: { fg: string; muted: string }; mono?: boolean }) {
  return (
    <tr>
      <td style={{
        padding: "3mm 6mm 3mm 0",
        fontSize: "8pt",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: colors.muted,
        fontWeight: 600,
        width: "45mm",
        verticalAlign: "baseline",
        borderBottom: `0.3pt solid ${colors.muted}44`,
      }}>
        {label}
      </td>
      <td style={{
        padding: "3mm 0",
        fontSize: "10pt",
        color: colors.fg,
        fontFamily: mono ? "monospace" : undefined,
        fontWeight: mono ? 600 : 500,
        borderBottom: `0.3pt solid ${colors.muted}44`,
      }}>
        {value}
      </td>
    </tr>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const months = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
                    "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return iso;
  }
}
