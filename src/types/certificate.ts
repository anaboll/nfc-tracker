/* ------------------------------------------------------------------ */
/*  Certificate of Authenticity — typy dla dziel sztuki (MVP: Obraz).  */
/*                                                                     */
/*  Zapis w Tag.links jako JSONB (tak samo jak VCardData).             */
/*  Tag.tagType = "certificate". Public route: /cert/<slug>.           */
/* ------------------------------------------------------------------ */

export type PaintingMedium =
  | "oil"          // olej
  | "watercolor"   // akwarela
  | "acrylic"      // akryl
  | "tempera"      // tempera
  | "gouache"      // gwasz
  | "pastel"       // pastel
  | "ink"          // tusz
  | "mixed";       // technika mieszana

export type PaintingSubstrate =
  | "canvas"       // plotno
  | "paper"        // papier
  | "wood"         // deska/drewno
  | "cardboard"    // tektura
  | "linen"        // len
  | "other";

export const MEDIUM_LABELS: Record<PaintingMedium, string> = {
  oil: "Olej",
  watercolor: "Akwarela",
  acrylic: "Akryl",
  tempera: "Tempera",
  gouache: "Gwasz",
  pastel: "Pastel",
  ink: "Tusz",
  mixed: "Technika mieszana",
};

export const SUBSTRATE_LABELS: Record<PaintingSubstrate, string> = {
  canvas: "Plotno",
  paper: "Papier",
  wood: "Deska",
  cardboard: "Tektura",
  linen: "Len",
  other: "Inne",
};

/**
 * Dane certyfikatu autentycznosci dziela. MVP: tylko obraz — pola dostosowane
 * do klasycznego malarstwa. Kolejne typy (rzezba, fotografia, grafika) dojda
 * w przyszlosci jako dyskryminator itemType. Pola ustawione sa zeby minimalny
 * certyfikat (z tytulem + artysta + rok) dal sie wystawic; pelny profesjonalny
 * wymaga medium + wymiary + podloze + podpis + min 1 zdjecie.
 */
export interface CertificateData {
  /* --- Typ dziela (rezerwa dla przyszlych rzezb/fotografii — MVP = painting) --- */
  itemType: "painting";

  /* --- Identyfikacja dziela --- */
  title: string;                   // Tytul dziela (required)
  artistFirstName: string;         // Imie artysty (required)
  artistLastName: string;          // Nazwisko (required)
  year: number;                    // Rok powstania (required)

  /* --- Parametry dziela (dla obrazu) --- */
  medium?: PaintingMedium;         // Olej/akwarela/akryl...
  mediumDetails?: string;          // Doprecyzowanie wolnym tekstem (np. "z dodatkiem zlotego listka")
  substrate?: PaintingSubstrate;   // Podloze
  dimensionsW?: number;            // Szerokosc w cm
  dimensionsH?: number;            // Wysokosc w cm
  dimensionsD?: number;            // Glebokosc w cm (dla blejtramu/ramy) — opcjonalne

  /* --- Dokumentacja wizualna --- */
  photos: string[];                // Paths do zdjec pracy, np. "/api/uploads/cert-xxx.jpg". Min 1, max 5.
  signaturePhoto?: string;         // Skan odrecznego podpisu artysty (jpg/png)
  artistLogo?: string;             // Logo/monogram artysty (opcjonalne)

  /* --- Narracja --- */
  description?: string;            // Artystyczny komentarz, kontext pracy, technika szczegolowo

  /* --- Metadata certyfikatu --- */
  serialNumber: string;            // Auto-gen format "YYYY-NNNNNN", np. "2026-000042"
  issueDate: string;               // Data wydania ISO (YYYY-MM-DD), default = dzis

  /* --- Prezentacja (theme) --- */
  theme?: CertificateTheme;
}

/**
 * Paleta wizualna certyfikatu. Domyslnie "premium-ecru" — jasna kremowa
 * paleta z ciemnogranatowymi akcentami i zlotymi ornamentami, ktora
 * odpowiada klasycznym gallery-issued certyfikatom.
 */
export interface CertificateTheme {
  palette?: CertificatePalette;
  fontHeading?: CertificateFont;
}

export type CertificatePalette =
  | "premium-ecru"   // tlo ecru, text granat, akcenty zloto (domyslny)
  | "dark-luxury"    // tlo ciemny granat, text ecru, akcenty zloto
  | "modern-minimal" // tlo biale, text czarny, bez ornamentow (minimalistyczny)
  | "noir-gold";     // tlo czarne, text kremowy, mocne zlote akcenty

export type CertificateFont =
  | "playfair"       // Playfair Display — klasyczny elegancki serif
  | "cormorant"      // Cormorant Garamond — renesansowy serif (podobny do Garamond)
  | "inter";         // sans-serif dla minimalistycznego stylu

export const PALETTE_COLORS: Record<CertificatePalette, {
  bg: string;
  fg: string;          // primary text + ramka
  accent: string;      // foil seal, ozdoby
  muted: string;       // secondary text
}> = {
  "premium-ecru": {
    bg: "#f4ead5",     // ciepla kremowa (ecru, jak stary papier)
    fg: "#1a1a2e",     // prawie-czarny granat
    accent: "#c9a961", // cieply zloty
    muted: "#5a5a6e",
  },
  "dark-luxury": {
    bg: "#1a1a2e",
    fg: "#f4ead5",
    accent: "#d4af37", // jasniejsze zloto dla kontrastu na ciemnym
    muted: "#9a9ab0",
  },
  "modern-minimal": {
    bg: "#ffffff",
    fg: "#000000",
    accent: "#000000", // brak zlota — czarne ornamenty (sans-serif + geometry)
    muted: "#666666",
  },
  "noir-gold": {
    bg: "#0a0a0a",
    fg: "#f4ead5",
    accent: "#d4af37",
    muted: "#8a8a8a",
  },
};

export const PALETTE_LABELS: Record<CertificatePalette, string> = {
  "premium-ecru": "Kremowy klasyczny",
  "dark-luxury": "Granat & Zloto",
  "modern-minimal": "Minimalistyczny (biel/czern)",
  "noir-gold": "Czerń & Zloto",
};

export const FONT_LABELS: Record<CertificateFont, string> = {
  playfair: "Playfair Display",
  cormorant: "Cormorant Garamond",
  inter: "Inter (sans-serif)",
};

/* ------------------------------------------------------------------ */
/*  Defaults — uzywane gdy tworzymy nowy certyfikat albo gdy           */
/*  konkretne pole nie jest ustawione (backward compat)                */
/* ------------------------------------------------------------------ */

export const DEFAULT_CERTIFICATE: CertificateData = {
  itemType: "painting",
  title: "",
  artistFirstName: "",
  artistLastName: "",
  year: new Date().getFullYear(),
  photos: [],
  serialNumber: "",   // wypelniamy serverowo przy zapisie
  issueDate: new Date().toISOString().slice(0, 10),
  theme: {
    palette: "premium-ecru",
    fontHeading: "playfair",
  },
};
