/* ------------------------------------------------------------------ */
/*  /jak-skanowac — krótka publiczna instrukcja NFC dla użytkowników   */
/*                                                                     */
/*  Cel: użytkownik dostaje brelok NFC (od agenta Nasalskiego itp),    */
/*  po raz pierwszy widzi NFC tag, nie wie jak skanować. Tag           */
/*  "instrukcja" w panelu redirektuje na tę stronę przez /s/instrukcja.*/
/*                                                                     */
/*  Założenia: mobile-first, jeden viewport bez scrolla na średnim     */
/*  telefonie, premium design (kolory/font dopasowane do TwojeNFC).    */
/*  Brak JS interakcji — pełnia server-side render, lekkie.            */
/* ------------------------------------------------------------------ */

export const metadata = {
  title: "Jak skanować brelok NFC — TwojeNFC.pl",
  description: "Krótka instrukcja: przyłóż brelok do telefonu i wizytówka otworzy się sama.",
};

export default function JakSkanowacPage() {
  return (
    <main style={styles.main}>
      <article style={styles.card}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.eyebrow}>JAK TO DZIAŁA</div>
          <h1 style={styles.title}>Skanuj brelok telefonem</h1>
          <p style={styles.subtitle}>
            Włącz NFC i przyłóż brelok do telefonu — wizytówka otworzy się sama.
          </p>
        </header>

        {/* iPhone */}
        <section style={styles.section}>
          <div style={styles.sectionHead}>
            <span style={styles.icon}>🍎</span>
            <span style={styles.sectionTitle}>iPhone</span>
          </div>
          <p style={styles.sectionText}>
            Dotknij brelokiem <strong>górnej części</strong> telefonu — tam gdzie aparat.
            Działa identycznie jak Apple Pay.
          </p>
          <p style={styles.sectionHint}>iPhone 7 i nowszy.</p>
        </section>

        {/* Android */}
        <section style={styles.section}>
          <div style={styles.sectionHead}>
            <span style={styles.icon}>🤖</span>
            <span style={styles.sectionTitle}>Android</span>
          </div>
          <p style={styles.sectionText}>
            Dotknij brelokiem <strong>tyłu telefonu</strong> — najlepiej środek lub górna część.
          </p>
          <p style={styles.sectionHint}>Działa na 90% telefonów Android z 2018+.</p>
        </section>

        {/* Nie dziala */}
        <section style={styles.troubleshoot}>
          <div style={styles.sectionHead}>
            <span style={styles.icon}>⚠️</span>
            <span style={styles.sectionTitle}>Nie działa?</span>
          </div>
          <ul style={styles.list}>
            <li><strong>NFC wyłączone</strong> — sprawdź Ustawienia → Połączenia → NFC</li>
            <li><strong>Etui metalowe</strong> — zdejmij chwilowo, NFC nie przebija przez metal</li>
            <li><strong>Stary iPhone</strong> — modele 6, SE 1. gen lub starsze nie czytają NFC tagów</li>
          </ul>
        </section>

        {/* QR fallback */}
        <section style={styles.qrFallback}>
          <span style={styles.icon}>📷</span>
          <span style={styles.qrText}>
            <strong>Można też zeskanować kod QR</strong> — wystarczy uruchomić aparat telefonu
            i skierować na czarny kwadrat z drugiej strony breloka.
          </span>
        </section>

        {/* Po skanie */}
        <section style={styles.afterScan}>
          <div style={styles.afterTitle}>Wizytówka się otworzyła — co dalej?</div>
          <ol style={styles.list}>
            <li>Kliknij <strong>„Zapisz kontakt"</strong> — dodaje się do książki adresowej telefonu</li>
            <li>Klikaj belki (Telefon, Email, Strona, Social) — wszystko działa</li>
          </ol>
        </section>

        {/* Footer */}
        <footer style={styles.footer}>
          Powered by{" "}
          <a href="https://twojenfc.pl" style={styles.footerLink}>
            TwojeNFC.pl
          </a>
        </footer>
      </article>
    </main>
  );
}

/* ------------------------------------------------------------------ */
const PALETTE = {
  bg: "#1a1a2e",          // ciemny granat (jak Laboversum)
  cardBg: "#252540",      // lighter card
  textPrimary: "#f4ead5", // ecru
  textMuted: "#9a9ab0",
  accent: "#c9a961",      // warm gold (jak certyfikat premium)
  accentSoft: "rgba(201, 169, 97, 0.12)",
  border: "rgba(201, 169, 97, 0.25)",
};

const FONT_STACK = "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    background: PALETTE.bg,
    color: PALETTE.textPrimary,
    fontFamily: FONT_STACK,
    padding: "24px 16px 40px",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    background: PALETTE.cardBg,
    borderRadius: 20,
    padding: "28px 24px",
    border: `1px solid ${PALETTE.border}`,
    boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
  },
  header: {
    textAlign: "center",
    marginBottom: 28,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: "0.18em",
    color: PALETTE.accent,
    fontWeight: 600,
    marginBottom: 8,
  },
  title: {
    fontSize: "clamp(24px, 6vw, 30px)",
    fontWeight: 700,
    margin: "0 0 10px",
    letterSpacing: "-0.01em",
    color: PALETTE.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    color: PALETTE.textMuted,
    margin: 0,
    lineHeight: 1.5,
  },
  section: {
    padding: "16px 18px",
    background: PALETTE.accentSoft,
    border: `1px solid ${PALETTE.border}`,
    borderRadius: 14,
    marginBottom: 12,
  },
  sectionHead: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  icon: {
    fontSize: 22,
    lineHeight: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: PALETTE.textPrimary,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 1.55,
    color: PALETTE.textPrimary,
    margin: "0 0 4px",
  },
  sectionHint: {
    fontSize: 12,
    color: PALETTE.textMuted,
    margin: 0,
    fontStyle: "italic",
  },
  troubleshoot: {
    padding: "16px 18px",
    background: "rgba(245, 158, 11, 0.08)",
    border: "1px solid rgba(245, 158, 11, 0.3)",
    borderRadius: 14,
    marginBottom: 12,
  },
  list: {
    margin: "0",
    paddingLeft: 20,
    fontSize: 13.5,
    lineHeight: 1.7,
    color: PALETTE.textPrimary,
  },
  qrFallback: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "14px 16px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    marginBottom: 12,
    border: "1px solid rgba(255,255,255,0.08)",
  },
  qrText: {
    fontSize: 13,
    lineHeight: 1.5,
    color: PALETTE.textMuted,
  },
  afterScan: {
    padding: "16px 18px",
    background: "rgba(34, 197, 94, 0.08)",
    border: "1px solid rgba(34, 197, 94, 0.25)",
    borderRadius: 14,
    marginBottom: 16,
  },
  afterTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: PALETTE.textPrimary,
    marginBottom: 8,
  },
  footer: {
    textAlign: "center",
    fontSize: 11,
    color: PALETTE.textMuted,
    paddingTop: 16,
    borderTop: `1px solid ${PALETTE.border}`,
  },
  footerLink: {
    color: PALETTE.accent,
    textDecoration: "none",
    fontWeight: 600,
  },
};
