/* ------------------------------------------------------------------ */
/*  certificate-pdf.tsx                                                */
/*                                                                     */
/*  Dokument PDF certyfikatu generowany serwerowo przez @react-pdf/    */
/*  renderer. Uzywany przez endpoint /api/cert/[slug]/pdf.             */
/*                                                                     */
/*  Dlaczego nie window.print() tylko prawdziwy PDF?                   */
/*   - window.print() silent-fail na iOS Chrome (znany bug)            */
/*   - Na Android Chrome print dialog czesto ignoruje print styles    */
/*   - Prawdziwy PDF = plik .pdf do sciagniecia = zawsze dziala        */
/*                                                                     */
/*  Styl A4 portret, paleta dopasowana do theme.palette (domyslnie     */
/*  premium-ecru). FoilSeal SVG pominiety — @react-pdf ma ograniczone  */
/*  SVG support, bez niego PDF wyglada elegancko ale bardziej prosto.  */
/*  Gdyby foil seal byl krytyczny, zamienimy go na pre-renderowany PNG.*/
/* ------------------------------------------------------------------ */

import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { CertificateData } from "@/types/certificate";
import { MEDIUM_LABELS, SUBSTRATE_LABELS, PALETTE_COLORS } from "@/types/certificate";

/* ------------------------------------------------------------------ */
/*  Fonts                                                              */
/*  Uzywamy wbudowanych fontow @react-pdf: Times-Roman (serif klasyczny*/
/*  jak dla ksiazek) i Helvetica (sans-serif). Zero zewn. fetchow,     */
/*  zero dependencies od internet-u, zawsze dostepne w kontenerze.     */
/*  Gdybysmy chcieli premium Playfair Display — trzeba wgrac TTF do    */
/*  repo i zarejestrowac przez Font.register() z lokalnej sciezki.     */
/* ------------------------------------------------------------------ */

const FONT_SERIF = "Times-Roman";
const FONT_SANS = "Helvetica";

/* ------------------------------------------------------------------ */
/*  CertificatePDF — React component rendered do PDF                   */
/* ------------------------------------------------------------------ */

interface Props {
  cert: CertificateData;
  tagId: string;
  publicUrl: string;
  /* UWAGA: cert.photos / signaturePhoto / artistLogo powinny byc juz inlinowane
   * jako data: URI (base64) przez wywolujacy endpoint. Patrz pdf/route.ts. */
}

export function CertificatePDF({ cert, tagId, publicUrl }: Props) {
  const palette = cert.theme?.palette || "premium-ecru";
  const colors = PALETTE_COLORS[palette];

  const artistFull = [cert.artistFirstName, cert.artistLastName].filter(Boolean).join(" ");
  const dimensions = cert.dimensionsW && cert.dimensionsH
    ? `${cert.dimensionsW} × ${cert.dimensionsH}${cert.dimensionsD ? ` × ${cert.dimensionsD}` : ""} cm`
    : null;
  const mediumLabel = cert.medium ? MEDIUM_LABELS[cert.medium] : null;
  const substrateLabel = cert.substrate ? SUBSTRATE_LABELS[cert.substrate] : null;
  const techniqueLine = [mediumLabel, substrateLabel].filter(Boolean).join(" na ");
  const fullTechnique = [techniqueLine, cert.mediumDetails].filter(Boolean).join(" — ");

  // Zdjecia przychodza juz jako data: URI (inlinowane przez endpoint) — uzywamy 1:1
  const heroPhoto = cert.photos[0] || null;
  const signatureUrl = cert.signaturePhoto || null;

  // Styles dependent on palette
  const styles = StyleSheet.create({
    page: {
      backgroundColor: colors.bg,
      color: colors.fg,
      padding: 0,
      fontFamily: FONT_SANS,
    },
    outerBorder: {
      position: "absolute",
      top: 28.35,  // 10mm = 28.35pt
      left: 28.35,
      right: 28.35,
      bottom: 28.35,
      borderStyle: "solid",
      borderColor: colors.accent,
      borderWidth: 2,
    },
    innerBorder: {
      position: "absolute",
      top: 36.85,
      left: 36.85,
      right: 36.85,
      bottom: 36.85,
      borderStyle: "solid",
      borderColor: colors.accent,
      borderWidth: 0.5,
    },
    content: {
      paddingHorizontal: 51,  // 18mm = 51pt
      paddingTop: 57,         // 20mm
      paddingBottom: 85,      // 30mm — zostaw miejsce na bottom elementy
    },
    eyebrow: {
      fontSize: 9,
      letterSpacing: 2,
      color: colors.muted,
      textAlign: "center",
      marginBottom: 6,
      fontWeight: 600,
    },
    headline: {
      fontSize: 22,
      fontWeight: 700,
      textAlign: "center",
      letterSpacing: 0.6,
      marginBottom: 18,
      fontFamily: FONT_SERIF,
    },
    heroWrap: {
      alignItems: "center",
      marginBottom: 14,
    },
    heroImage: {
      maxWidth: 370,
      maxHeight: 215,
      objectFit: "contain",
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: colors.accent,
    },
    title: {
      fontSize: 21,
      fontWeight: 700,
      fontStyle: "italic",
      textAlign: "center",
      marginBottom: 4,
      fontFamily: FONT_SERIF,
    },
    subtitle: {
      fontSize: 11,
      color: colors.muted,
      textAlign: "center",
      marginBottom: 14,
    },
    metadataTable: {
      marginHorizontal: "auto",
      width: 430,
      marginBottom: 10,
    },
    metadataRow: {
      flexDirection: "row",
      paddingVertical: 6,
      borderBottomWidth: 0.3,
      borderBottomColor: colors.muted + "66",
      borderBottomStyle: "solid",
    },
    metadataLabel: {
      width: 130,
      fontSize: 7,
      letterSpacing: 1,
      color: colors.muted,
      fontWeight: 600,
      textTransform: "uppercase",
    },
    metadataValue: {
      flex: 1,
      fontSize: 10,
      color: colors.fg,
      fontWeight: 500,
    },
    description: {
      fontSize: 10,
      fontStyle: "italic",
      textAlign: "center",
      marginTop: 14,
      marginBottom: 10,
      paddingHorizontal: 20,
      lineHeight: 1.5,
      fontFamily: FONT_SERIF,
    },
    bottomRow: {
      position: "absolute",
      bottom: 75,
      left: 57,
      right: 57,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
    },
    signatureBox: {
      alignItems: "center",
      minWidth: 170,
    },
    signatureImage: {
      maxWidth: 170,
      maxHeight: 56,
      marginBottom: 4,
    },
    signatureLine: {
      width: 170,
      borderBottomWidth: 0.8,
      borderBottomColor: colors.fg,
      borderBottomStyle: "solid",
      marginBottom: 4,
      height: 40,
    },
    signatureLabel: {
      fontSize: 7,
      letterSpacing: 1.3,
      color: colors.muted,
      textTransform: "uppercase",
      fontWeight: 600,
      marginTop: 3,
    },
    signatureName: {
      fontSize: 9,
      fontWeight: 600,
      marginTop: 2,
    },
    /* Faux foil seal — okragly gradient-free kluczowa pieczec      */
    /* (uproszczenie bo @react-pdf Svg ma ograniczenia)              */
    sealBox: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderStyle: "solid",
      borderColor: colors.fg + "55",
    },
    sealInner: {
      width: 66,
      height: 66,
      borderRadius: 33,
      backgroundColor: colors.bg,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 0.5,
      borderStyle: "solid",
      borderColor: colors.fg + "55",
    },
    sealLabel: {
      fontSize: 6.5,
      fontWeight: 700,
      letterSpacing: 0.5,
      color: colors.fg,
      textAlign: "center",
      lineHeight: 1.2,
    },
    sealYear: {
      fontSize: 12,
      fontWeight: 700,
      color: colors.fg,
      fontFamily: FONT_SERIF,
      marginTop: 2,
    },
    footer: {
      position: "absolute",
      bottom: 42,
      left: 57,
      right: 57,
      flexDirection: "row",
      justifyContent: "space-between",
      fontSize: 7,
      color: colors.muted,
    },
    footerLabel: {
      fontSize: 6.5,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      fontWeight: 600,
      color: colors.muted,
    },
    footerValue: {
      fontSize: 9,
      color: colors.fg,
      fontWeight: 600,
    },
    footerUrl: {
      fontSize: 8,
      color: colors.fg,
    },
  });

  return (
    <Document
      author={artistFull || "TwojeNFC"}
      title={`Certyfikat — ${cert.title}`}
      subject="Certyfikat Autentycznosci"
      keywords={`certyfikat, ${cert.title}, ${artistFull}`}
      creator="TwojeNFC.pl"
      producer="TwojeNFC.pl"
    >
      <Page size="A4" style={styles.page}>
        {/* Ozdobna podwójna ramka */}
        <View style={styles.outerBorder} />
        <View style={styles.innerBorder} />

        <View style={styles.content}>
          {/* Eyebrow + headline */}
          <Text style={styles.eyebrow}>CERTIFICATE OF AUTHENTICITY</Text>
          <Text style={styles.headline}>CERTYFIKAT AUTENTYCZNOŚCI</Text>

          {/* Hero image */}
          {heroPhoto && (
            <View style={styles.heroWrap}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={heroPhoto} style={styles.heroImage} />
            </View>
          )}

          {/* Title + artist */}
          <Text style={styles.title}>{cert.title}</Text>
          <Text style={styles.subtitle}>
            {artistFull}{cert.year ? `, ${cert.year}` : ""}
          </Text>

          {/* Metadata */}
          <View style={styles.metadataTable}>
            {fullTechnique ? (
              <MetaRow label="Technika" value={fullTechnique} styles={styles} />
            ) : null}
            {dimensions ? (
              <MetaRow label="Wymiary" value={dimensions} styles={styles} />
            ) : null}
            {cert.year ? (
              <MetaRow label="Rok powstania" value={String(cert.year)} styles={styles} />
            ) : null}
            <MetaRow label="Numer seryjny" value={cert.serialNumber || "—"} styles={styles} />
            <MetaRow label="Data wydania" value={formatDate(cert.issueDate)} styles={styles} />
          </View>

          {/* Description */}
          {cert.description ? (
            <Text style={styles.description}>&ldquo;{cert.description}&rdquo;</Text>
          ) : null}
        </View>

        {/* Bottom row: signature + foil seal */}
        <View style={styles.bottomRow}>
          <View style={styles.signatureBox}>
            {signatureUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={signatureUrl} style={styles.signatureImage} />
            ) : (
              <View style={styles.signatureLine} />
            )}
            <Text style={styles.signatureLabel}>PODPIS ARTYSTY</Text>
            <Text style={styles.signatureName}>{artistFull}</Text>
          </View>

          {palette !== "modern-minimal" ? (
            <View style={styles.sealBox}>
              <View style={styles.sealInner}>
                <Text style={styles.sealLabel}>CERTYFIKAT{"\n"}AUTENTYCZNOŚCI</Text>
                {cert.year ? <Text style={styles.sealYear}>{cert.year}</Text> : null}
              </View>
            </View>
          ) : null}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerLabel}>CERTIFICATE ID</Text>
            <Text style={styles.footerValue}>{tagId}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.footerLabel}>VERIFY ONLINE</Text>
            <Text style={styles.footerUrl}>{publicUrl}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

/* ------------------------------------------------------------------ */
/*  MetaRow helper                                                     */
/* ------------------------------------------------------------------ */

function MetaRow({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof StyleSheet.create> }) {
  return (
    <View style={styles.metadataRow}>
      <Text style={styles.metadataLabel}>{label}</Text>
      <Text style={styles.metadataValue}>{value}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
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
