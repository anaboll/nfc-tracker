/* ------------------------------------------------------------------ */
/*  /jak-skanowac — cheat-sheet dla AGENTA Nasalskiego.                */
/*                                                                     */
/*  Use case: agent stoi z klientem na pokazie nieruchomosci, na       */
/*  koniec wyciaga brelok NFC i chce szybko przekazac swoja wizytowke. */
/*  Strona jest jego sciaga: co powiedziec, gdzie przylozyc, co zrobic */
/*  gdy nie dziala, jakimi slowami zamknac sprzedaz po skanie.         */
/*                                                                     */
/*  Tag "instrukcja" w panelu redirektuje tu przez /s/instrukcja → QR  */
/*  na breloku (drugi raz QR jest kierowany na /s/<slug>?source=qr ze  */
/*  vcardem agenta — to jest osobno, dla klienta).                     */
/* ------------------------------------------------------------------ */

export const metadata = {
  title: "Jak przekazać kontakt klientowi przez NFC — instrukcja dla agenta",
  description: "Cheat-sheet: co powiedzieć klientowi, gdzie przyłożyć brelok, co zrobić gdy nie działa.",
};

export default function JakSkanowacPage() {
  return (
    <main style={styles.main}>
      <article style={styles.card}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.eyebrow}>INSTRUKCJA DLA AGENTA</div>
          <h1 style={styles.title}>Jak przekazać kontakt klientowi</h1>
          <p style={styles.subtitle}>
            Wyciągasz brelok, klient przykłada telefon, masz go w książce adresowej.
            Średnio <strong>10-15 sekund</strong>.
          </p>
        </header>

        {/* Skrot 30-sec */}
        <section style={styles.tldr}>
          <div style={styles.tldrTitle}>📌 W skrócie</div>
          <ol style={styles.tldrList}>
            <li>Wyciągnij brelok, trzymaj w ręce</li>
            <li>Powiedz klientowi: <em>„Mogę dać Ci moją wizytówkę bezdotykowo?"</em></li>
            <li>Klient odblokowuje telefon (ekran zapalony) i przykłada</li>
            <li>Wizytówka pojawia się natychmiast → klika <strong>„Zapisz kontakt"</strong></li>
          </ol>
        </section>

        {/* iPhone */}
        <section style={styles.section}>
          <div style={styles.sectionHead}>
            <span style={styles.icon}>🍎</span>
            <span style={styles.sectionTitle}>Klient z iPhonem</span>
          </div>
          <p style={styles.sectionText}>
            <em>„Przyłóż brelok górnej części telefonu — tam gdzie aparat. Jak przy Apple Pay."</em>
          </p>
          <ul style={styles.bullets}>
            <li>Telefon musi być <strong>odblokowany</strong> i mieć włączony ekran</li>
            <li>Działa od iPhone 7 (2016+)</li>
            <li>Apka aparatu NIE musi być uruchomiona</li>
          </ul>
        </section>

        {/* Android */}
        <section style={styles.section}>
          <div style={styles.sectionHead}>
            <span style={styles.icon}>🤖</span>
            <span style={styles.sectionTitle}>Klient z Androidem</span>
          </div>
          <p style={styles.sectionText}>
            <em>„Przyłóż brelok do tyłu telefonu — najlepiej do środka."</em>
          </p>
          <ul style={styles.bullets}>
            <li>Telefon też musi być włączony i odblokowany</li>
            <li>W ~5% modeli NFC jest wyłączone domyślnie — patrz sekcja niżej</li>
            <li>Działa na 90% Androidów z 2018+</li>
          </ul>
        </section>

        {/* Nie dziala */}
        <section style={styles.troubleshoot}>
          <div style={styles.sectionHead}>
            <span style={styles.icon}>⚠️</span>
            <span style={styles.sectionTitle}>Nie działa? 30-sekundowy fix</span>
          </div>
          <ol style={styles.list}>
            <li>
              <strong>NFC wyłączone?</strong> Powiedz: <em>„Otwórz panel powiadomień u góry — szukaj ikony N"</em>.
              Albo: Ustawienia → Połączenia → NFC.
            </li>
            <li>
              <strong>Stary telefon?</strong> (iPhone 6/SE 1.gen, Android sprzed 2017) →
              <em>„Zeskanuj kod QR z drugiej strony breloka — uruchom aparat i celuj"</em>.
            </li>
            <li>
              <strong>Etui metalowe / portfelowe?</strong> Poproś o ściągnięcie na chwilę. NFC nie przebija przez metal.
            </li>
            <li>
              <strong>Dalej nic?</strong> Spokojnie wręcz tradycyjną wizytówkę — wszystko mamy zarejestrowane,
              klient i tak wpisze numer ręcznie.
            </li>
          </ol>
        </section>

        {/* Po skanie */}
        <section style={styles.afterScan}>
          <div style={styles.afterTitle}>🚀 Po skanie — domykasz pętlę</div>
          <ol style={styles.list}>
            <li>
              <em>„Kliknij Zapisz kontakt"</em> — wizytówka ląduje w jego książce adresowej, nie zniknie
            </li>
            <li>
              Pokaż jeszcze: <em>„Tu masz mój Instagram, stronę, telefon — jeden klik dzwoni"</em>
            </li>
            <li>
              Zamknij rozmowę: <em>„Po wizycie napisz / zadzwoń z tego numeru, oddzwonię w 30 minut"</em>
            </li>
          </ol>
        </section>

        {/* Pro tips */}
        <section style={styles.proTips}>
          <div style={styles.proTipsTitle}>💡 Pro tips</div>
          <ul style={styles.bullets}>
            <li>
              <strong>Trzymaj brelok w ręce już PRZED prezentacją</strong> — pokazuje pewność i nowoczesność,
              klient widzi że to nie kant
            </li>
            <li>
              <strong>Najpierw tłumacz „dlaczego"</strong>, potem „jak". <em>„Zamiast papieru który zgubisz,
              dam Ci kontakt prosto do telefonu"</em>
            </li>
            <li>
              <strong>Trzymaj minimum 1-2 cm od telefonu</strong> — bardzo blisko bywa gorsze niż 1 cm
            </li>
            <li>
              <strong>Każdy skan widzisz w panelu</strong> — zobaczysz kto kiedy zeskanował (nie wiesz <em>kto</em>{" "}
              osobiście, tylko liczbę + miasto). Świetne na koniec miesiąca: ile leadów zebrałeś
            </li>
            <li>
              <strong>QR jest fallbackiem</strong> — gdy NFC zawodzi, ten sam brelok ma kod z tyłu który
              prowadzi tam samo. Klient włącza aparat i celuje.
            </li>
          </ul>
        </section>

        {/* Footer */}
        <footer style={styles.footer}>
          <div style={{ marginBottom: 4 }}>
            Pytania techniczne? Pisz do <a href="mailto:kontakt@twojenfc.pl" style={styles.footerLink}>kontakt@twojenfc.pl</a>
          </div>
          <div>
            Powered by{" "}
            <a href="https://twojenfc.pl" style={styles.footerLink}>
              TwojeNFC.pl
            </a>
          </div>
        </footer>
      </article>
    </main>
  );
}

/* ------------------------------------------------------------------ */
const PALETTE = {
  bg: "#1a1a2e",
  cardBg: "#252540",
  textPrimary: "#f4ead5",
  textMuted: "#9a9ab0",
  accent: "#c9a961",
  accentSoft: "rgba(201, 169, 97, 0.10)",
  border: "rgba(201, 169, 97, 0.22)",
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
    maxWidth: 560,
    background: PALETTE.cardBg,
    borderRadius: 20,
    padding: "28px 22px",
    border: `1px solid ${PALETTE.border}`,
    boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: "0.18em",
    color: PALETTE.accent,
    fontWeight: 600,
    marginBottom: 8,
  },
  title: {
    fontSize: "clamp(22px, 5.5vw, 28px)",
    fontWeight: 700,
    margin: "0 0 10px",
    letterSpacing: "-0.01em",
    color: PALETTE.textPrimary,
    lineHeight: 1.25,
  },
  subtitle: {
    fontSize: 14,
    color: PALETTE.textMuted,
    margin: 0,
    lineHeight: 1.55,
  },
  tldr: {
    padding: "16px 18px",
    background: "rgba(34, 197, 94, 0.08)",
    border: "1px solid rgba(34, 197, 94, 0.28)",
    borderRadius: 14,
    marginBottom: 14,
  },
  tldrTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: PALETTE.textPrimary,
    marginBottom: 8,
  },
  tldrList: {
    margin: 0,
    paddingLeft: 22,
    fontSize: 13.5,
    lineHeight: 1.7,
    color: PALETTE.textPrimary,
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
    margin: "0 0 8px",
  },
  bullets: {
    margin: 0,
    paddingLeft: 18,
    fontSize: 13,
    lineHeight: 1.65,
    color: PALETTE.textMuted,
  },
  troubleshoot: {
    padding: "16px 18px",
    background: "rgba(245, 158, 11, 0.08)",
    border: "1px solid rgba(245, 158, 11, 0.3)",
    borderRadius: 14,
    marginBottom: 12,
  },
  list: {
    margin: 0,
    paddingLeft: 20,
    fontSize: 13.5,
    lineHeight: 1.7,
    color: PALETTE.textPrimary,
  },
  afterScan: {
    padding: "16px 18px",
    background: "rgba(96, 165, 250, 0.08)",
    border: "1px solid rgba(96, 165, 250, 0.28)",
    borderRadius: 14,
    marginBottom: 12,
  },
  afterTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: PALETTE.textPrimary,
    marginBottom: 8,
  },
  proTips: {
    padding: "16px 18px",
    background: "rgba(168, 85, 247, 0.08)",
    border: "1px solid rgba(168, 85, 247, 0.28)",
    borderRadius: 14,
    marginBottom: 16,
  },
  proTipsTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: PALETTE.textPrimary,
    marginBottom: 10,
  },
  footer: {
    textAlign: "center",
    fontSize: 11,
    color: PALETTE.textMuted,
    paddingTop: 16,
    borderTop: `1px solid ${PALETTE.border}`,
    lineHeight: 1.6,
  },
  footerLink: {
    color: PALETTE.accent,
    textDecoration: "none",
    fontWeight: 600,
  },
};
