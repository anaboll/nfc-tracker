/* ------------------------------------------------------------------ */
/*  /jak-skanowac — 4 punkty, jeden viewport, zero scrolla.            */
/* ------------------------------------------------------------------ */

export const metadata = {
  title: "Jak działa brelok NFC — TwojeNFC.pl",
};

export default function JakSkanowacPage() {
  return (
    <main style={styles.main}>
      <article style={styles.card}>
        <h1 style={styles.title}>Jak działa brelok</h1>

        <ol style={styles.list}>
          <li style={styles.item}>
            <span style={styles.num}>1</span>
            <span>Brelok działa <strong>po przyłożeniu do telefonu</strong></span>
          </li>
          <li style={styles.item}>
            <span style={styles.num}>2</span>
            <span>Wizytówka <strong>otwiera się sama</strong></span>
          </li>
          <li style={styles.item}>
            <span style={styles.num}>3</span>
            <span>iPhone — przyłóż <strong>górą</strong>, Android — <strong>tyłem</strong></span>
          </li>
          <li style={styles.item}>
            <span style={styles.num}>4</span>
            <span>Nie działa? <strong>Zeskanuj QR</strong> z drugiej strony</span>
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
    maxWidth: 440,
    background: "#252540",
    border: "1px solid rgba(201, 169, 97, 0.25)",
    borderRadius: 18,
    padding: "28px 24px",
  },
  title: {
    fontSize: 26,
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
    gap: 14,
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    fontSize: 16,
    lineHeight: 1.4,
    color: "#f4ead5",
  },
  num: {
    flexShrink: 0,
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#c9a961",
    color: "#1a1a2e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    fontWeight: 700,
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
