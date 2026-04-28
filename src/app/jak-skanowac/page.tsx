/* ------------------------------------------------------------------ */
/*  /jak-skanowac — 3 punkty dla agenta. Krotko + konkret.            */
/* ------------------------------------------------------------------ */

export const metadata = {
  title: "Twój brelok NFC — TwojeNFC.pl",
};

export default function JakSkanowacPage() {
  return (
    <main style={styles.main}>
      <article style={styles.card}>
        <h1 style={styles.title}>Twój brelok NFC</h1>

        <ol style={styles.list}>
          <li style={styles.item}>
            <span style={styles.num}>1</span>
            <div>
              <div style={styles.itemHead}>Działa po przyłożeniu</div>
              <div style={styles.itemBody}>
                Przyłóż brelok do <strong>górnej części telefonu</strong> — wizytówka otwiera się sama.
              </div>
            </div>
          </li>

          <li style={styles.item}>
            <span style={styles.num}>2</span>
            <div>
              <div style={styles.itemHead}>Nie działa? Sprawdź NFC</div>
              <div style={styles.itemBody}>
                Na <strong>Androidzie</strong> trzeba czasem włączyć NFC w ustawieniach (Połączenia → NFC).
                Na <strong>iPhonie</strong> działa zawsze — wystarczy odblokowany ekran.
              </div>
            </div>
          </li>

          <li style={styles.item}>
            <span style={styles.num}>3</span>
            <div>
              <div style={styles.itemHead}>Wizytówka jest w pełni edytowalna</div>
              <div style={styles.itemBody}>
                Możesz zmienić kolejność belek, treść, kolory, zdjęcia, dodać/usunąć linki. Napisz co potrzebujesz na{" "}
                <a href="mailto:kontakt@twojenfc.pl" style={styles.link}>kontakt@twojenfc.pl</a> — odpowiemy w ten sam dzień.
              </div>
            </div>
          </li>
        </ol>

        <div style={styles.footer}>twojenfc.pl</div>
      </article>
    </main>
  );
}

/* ------------------------------------------------------------------ */
const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    background: "#1a1a2e",
    color: "#f4ead5",
    fontFamily: "'Inter', system-ui, sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    background: "#252540",
    border: "1px solid rgba(201, 169, 97, 0.25)",
    borderRadius: 18,
    padding: "28px 24px",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    textAlign: "center",
    margin: "0 0 24px",
    color: "#c9a961",
    letterSpacing: "-0.01em",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 20px",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  item: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
  },
  num: {
    flexShrink: 0,
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: "#c9a961",
    color: "#1a1a2e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 700,
    marginTop: 2,
  },
  itemHead: {
    fontSize: 15,
    fontWeight: 700,
    color: "#f4ead5",
    marginBottom: 4,
    lineHeight: 1.3,
  },
  itemBody: {
    fontSize: 13.5,
    lineHeight: 1.55,
    color: "rgba(244, 234, 213, 0.78)",
  },
  link: {
    color: "#c9a961",
    textDecoration: "none",
    fontWeight: 600,
  },
  footer: {
    textAlign: "center",
    fontSize: 11,
    color: "rgba(244, 234, 213, 0.4)",
    paddingTop: 12,
    borderTop: "1px solid rgba(201, 169, 97, 0.15)",
    letterSpacing: "0.1em",
  },
};
