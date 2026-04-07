import { Metadata } from "next";
import Image from "next/image";
import OfferTracker from "./OfferTracker";
import OfferContactForm from "./OfferContactForm";

export const metadata: Metadata = {
  title: "Breloki NFC dla biur nieruchomości — TwojeNFC",
  description:
    "Brelok NFC z wizytówką agenta, linkiem do oferty lub opinią Google. Od 8 PLN netto za sztukę. Pełna analityka skanów.",
  robots: { index: false, follow: false },
};

/* ------------------------------------------------------------------ */
/*  Inline SVG icons                                                   */
/* ------------------------------------------------------------------ */

const IconNfc = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
  </svg>
);

const IconHome = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const IconCard = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const IconKey = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

const IconStar = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

const IconChart = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function OfertaNieruchomosciPage() {
  return (
    <div className="landing-page">
      <OfferTracker />

      {/* --------- NAV (minimal) --------- */}
      <nav className="landing-nav">
        <div className="landing-container nav-inner">
          <div className="nav-logo">
            <div className="nav-logo-icon"><IconNfc /></div>
            <span className="gradient-text nav-logo-text">TwojeNFC</span>
          </div>
          <div className="nav-links">
            <a href="#zastosowania">Zastosowania</a>
            <a href="#cennik">Cennik</a>
            <a href="#kontakt">Kontakt</a>
          </div>
        </div>
      </nav>

      {/* --------- HERO --------- */}
      <section className="hero-section">
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
        <div className="landing-container hero-inner">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Oferta dla biur nieruchomości
          </div>
          <h1 className="hero-title">
            Brelok NFC,<br />
            <span className="gradient-text">który pracuje za agenta.</span>
          </h1>
          <p className="hero-subtitle">
            Klient przykłada telefon do breloka &mdash; i&nbsp;od razu ma wizytówkę agenta,
            link do oferty, numer telefonu. Bez aplikacji, bez szukania w&nbsp;Google.
          </p>
          <div className="hero-actions">
            <a href="#kontakt" className="btn-primary hero-btn">
              Poproś o wycenę
            </a>
            <a href="#zastosowania" className="hero-btn-secondary">
              Zobacz zastosowania &darr;
            </a>
          </div>

          {/* Product photos */}
          <div style={{
            margin: "3rem auto 0",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            maxWidth: 700,
          }}>
            <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
              <Image
                src="/images/oferta/brelok-3.webp"
                alt="Breloki NFC w kształcie domków — granatowy z symbolem NFC i żółty z łańcuszkiem"
                width={450}
                height={600}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
            <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
              <Image
                src="/images/oferta/brelok-4.webp"
                alt="Breloki NFC w kształcie domków — komplet z kółkami na klucze"
                width={450}
                height={600}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">Od 8 PLN</span>
              <span className="hero-stat-label">netto za sztukę</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">Twoje logo</span>
              <span className="hero-stat-label">druk UV lub 3D</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">Pełna analityka</span>
              <span className="hero-stat-label">kto skanuje, kiedy, skąd</span>
            </div>
          </div>
        </div>
      </section>

      {/* --------- PROBLEM / SOLUTION --------- */}
      <section className="hiw-section">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">Problem</span>
            <h2 className="section-title">Wizytówki lądują w&nbsp;szufladzie</h2>
            <p className="section-subtitle">
              Papierowa wizytówka ginie tego samego dnia. Brelok NFC zostaje
              na kluczach klienta &mdash; widzi go codziennie, a&nbsp;jak potrzebuje
              kontaktu, przykłada telefon i&nbsp;ma wszystko.
            </p>
          </div>
          <div className="hiw-grid">
            <div className="step-card">
              <div className="step-number" style={{ color: "var(--error)", opacity: 0.7 }}>&#10007;</div>
              <h3 className="step-title">Papierowa wizytówka</h3>
              <p className="step-desc">
                Gubi się, niszczy, ląduje w&nbsp;stosie na biurku. Klient nie
                pamięta, do kogo dzwonić.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number" style={{ color: "var(--success)" }}>&#10003;</div>
              <h3 className="step-title">Brelok NFC</h3>
              <p className="step-desc">
                Zostaje na kluczach. Klient przykłada telefon &mdash; Twój numer,
                strona, oferta. Zapisuje się w&nbsp;kontaktach jednym gestem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --------- ZASTOSOWANIA --------- */}
      <section id="zastosowania" className="features-section">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">Zastosowania</span>
            <h2 className="section-title">4 sposoby na NFC w&nbsp;biurze nieruchomości</h2>
          </div>
          <div className="features-grid">
            <UseCaseCard
              icon={<IconCard />}
              title="Wizytówka agenta"
              desc="Agent daje klientowi brelok z NFC. Klient przykłada telefon — i&nbsp;ma numer agenta, email, zdjęcie, stronę. Kontakt zapisuje się w&nbsp;telefonie jednym gestem."
            />
            <UseCaseCard
              icon={<IconKey />}
              title="Brelok przy przekazaniu kluczy"
              desc="Klient kupuje mieszkanie — dostajesz klucze z brelokiem-domkiem. Przykłada telefon i&nbsp;ma wizytówkę agenta. Poleca znajomym? Wystarczy przyłożyć."
            />
            <UseCaseCard
              icon={<IconHome />}
              title="Link do oferty nieruchomości"
              desc="Brelok przekierowuje na konkretną ofertę — mieszkanie, dom, działkę. Klient pokazuje znajomym, a&nbsp;Ty w&nbsp;panelu widzisz ile osób otworzyło link."
            />
            <UseCaseCard
              icon={<IconStar />}
              title="Opinie Google"
              desc="Brelok na recepcji biura — klient przykłada telefon i&nbsp;od razu widzi formularz opinii Google. Bez szukania, bez wpisywania adresu. Pięć sekund."
            />
          </div>
        </div>
      </section>

      {/* --------- JAK TO DZIAŁA --------- */}
      <section className="hiw-section">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">Jak to działa</span>
            <h2 className="section-title">3 kroki do startu</h2>
          </div>
          <div className="hiw-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <h3 className="step-title">Mówisz, czego potrzebujesz</h3>
              <p className="step-desc">
                Wizytówki agentów? Breloki-domki na klucze? Linki do ofert?
                Dopasujemy kształt, kolor i&nbsp;treść pod Twoje biuro.
              </p>
            </div>
            <div className="step-card">
              <div className="step-number">02</div>
              <h3 className="step-title">Przygotowujemy breloki</h3>
              <p className="step-desc">
                Drukujemy brelok z&nbsp;Twoim logo (3D + druk UV), programujemy
                chip NFC i&nbsp;podpinamy treść — wizytówkę, stronę lub cokolwiek chcesz.
              </p>
              <div style={{ marginTop: "1rem", borderRadius: 12, overflow: "hidden" }}>
                <Image
                  src="/images/oferta/brelok-5.webp"
                  alt="Breloki NFC z logo firm — przykłady personalizacji"
                  width={400}
                  height={400}
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>
            </div>
            <div className="step-card">
              <div className="step-number">03</div>
              <h3 className="step-title">Klient przykłada telefon</h3>
              <p className="step-desc">
                Działa od razu — iPhone, Android, bez żadnej aplikacji.
                Treść zmieniasz zdalnie w&nbsp;panelu, bez wymiany breloka.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --------- SCREENSHOTS PLACEHOLDER --------- */}
      <section style={{ padding: "4rem 0" }}>
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">Na telefonie</span>
            <h2 className="section-title">Co widzi klient po przyłożeniu</h2>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.5rem",
            maxWidth: 800,
            margin: "0 auto",
          }}>
            {["Wizytówka agenta", "Strona z ofertą", "Opinie Google"].map((label) => (
              <div key={label} style={{
                aspectRatio: "9/16",
                background: "linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%)",
                borderRadius: 24,
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--txt-muted)",
                fontSize: "0.85rem",
                textAlign: "center",
                padding: "1rem",
              }}>
                {/* TODO: Replace with phone screenshot */}
                Screenshot:<br />{label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------- CENNIK --------- */}
      <section id="cennik" className="hiw-section">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">Cennik</span>
            <h2 className="section-title">Prosta wycena, bez ukrytych kosztów</h2>
            <p className="section-subtitle">
              Cena obejmuje brelok z&nbsp;chipem NFC, druk logo, zaprogramowanie
              i&nbsp;dostęp do panelu ze statystykami.
            </p>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1.25rem",
            maxWidth: 900,
            margin: "0 auto",
          }}>
            <PricingCard
              qty="do 50 szt."
              price="10"
              note="idealne na start"
              highlighted={false}
            />
            <PricingCard
              qty="51 – 99 szt."
              price="9"
              note="dla większego biura"
              highlighted={true}
            />
            <PricingCard
              qty="100+ szt."
              price="8"
              note="najlepsza cena"
              highlighted={false}
            />
          </div>
          <p style={{
            textAlign: "center",
            color: "var(--txt-muted)",
            fontSize: "0.8rem",
            marginTop: "1.5rem",
          }}>
            Ceny netto. Kształt, kolor i&nbsp;treść ustalamy indywidualnie.
          </p>
        </div>
      </section>

      {/* --------- ANALYTICS TEASER --------- */}
      <section className="analytics-section">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">Analityka</span>
            <h2 className="section-title">Wiesz, kto skanuje Twoje breloki</h2>
            <p className="section-subtitle">
              Panel z&nbsp;danymi w&nbsp;czasie rzeczywistym. Sprawdź ile osób korzysta
              z&nbsp;breloków, skąd skanują i&nbsp;jakim telefonem.
            </p>
          </div>
          <div className="analytics-grid">
            <AnalyticsCard icon={<IconChart />} color="#38BDF8" title="Ile osób skanuje" value="1 247" sub="wszystkich skanów &middot; 489 unikalnych" bar={72} />
            <AnalyticsCard icon={<IconHome />} color="#38BDF8" title="Skąd skanują" value="12 miast" sub="Bydgoszcz 42% &middot; Toruń 18% &middot; Warszawa 12%" bar={67} />
            <AnalyticsCard icon={<IconCard />} color="#22c55e" title="Jakim telefonem" value="94% mobile" sub="iPhone 56% &middot; Android 38% &middot; inny 6%" bar={94} barColor="#22c55e" />
            <AnalyticsCard icon={<IconStar />} color="#38BDF8" title="Powracający" value="34%" sub="klientów wraca do wizytówki ponownie" bar={34} />
          </div>
          <p style={{
            textAlign: "center",
            color: "var(--txt-muted)",
            fontSize: "0.75rem",
            marginTop: "1rem",
          }}>
            Przykładowe dane poglądowe
          </p>
        </div>
      </section>

      {/* --------- CTA / KONTAKT --------- */}
      <section id="kontakt" className="cta-section">
        <div className="landing-container cta-inner">
          <h2 className="cta-title">
            Zamów breloki NFC dla swojego biura
          </h2>
          <p className="cta-subtitle">
            Powiedz ile agentów pracuje w&nbsp;Twoim biurze &mdash; przygotujemy
            indywidualną ofertę z&nbsp;brelokami pod Wasze logo.
          </p>
          <OfferContactForm />
          <p className="cta-email-fallback">
            lub napisz bezpośrednio:{" "}
            <a href="mailto:kontakt@twojenfc.pl">kontakt@twojenfc.pl</a>
          </p>
        </div>
      </section>

      {/* --------- FOOTER --------- */}
      <footer className="landing-footer">
        <div className="landing-container footer-inner">
          <div className="footer-brand">
            <div className="nav-logo">
              <div className="nav-logo-icon small"><IconNfc /></div>
              <span className="gradient-text">TwojeNFC</span>
            </div>
            <p className="footer-tagline">Zbliżeniowe gadżety NFC</p>
          </div>
          <div className="footer-links">
            <a href="mailto:kontakt@twojenfc.pl">kontakt@twojenfc.pl</a>
          </div>
          <div className="footer-copy">
            &copy; {new Date().getFullYear()} TwojeNFC. Wszelkie prawa zastrzeżone.
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function UseCaseCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="feature-card card card-hover">
      <div className="feature-icon">{icon}</div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{desc}</p>
    </div>
  );
}

function PricingCard({ qty, price, note, highlighted }: { qty: string; price: string; note: string; highlighted: boolean }) {
  return (
    <div
      className="card"
      style={{
        textAlign: "center",
        padding: "2rem 1.5rem",
        border: highlighted ? "1px solid var(--accent)" : undefined,
        position: "relative",
      }}
    >
      {highlighted && (
        <span style={{
          position: "absolute",
          top: -12,
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--accent)",
          color: "var(--bg)",
          fontSize: "0.7rem",
          fontWeight: 600,
          padding: "0.2rem 0.75rem",
          borderRadius: 20,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          Popularne
        </span>
      )}
      <div style={{ fontSize: "0.85rem", color: "var(--txt-sec)", marginBottom: "0.5rem" }}>{qty}</div>
      <div style={{ fontSize: "2.5rem", fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "-0.02em" }}>
        {price}<span style={{ fontSize: "1rem", fontWeight: 400, color: "var(--txt-sec)" }}> PLN</span>
      </div>
      <div style={{ fontSize: "0.8rem", color: "var(--txt-muted)", marginTop: "0.25rem" }}>netto / sztuka</div>
      <div style={{ fontSize: "0.75rem", color: "var(--txt-muted)", marginTop: "0.75rem" }}>{note}</div>
      <a
        href="#kontakt"
        className="btn-primary"
        style={{ display: "inline-block", marginTop: "1.25rem", fontSize: "0.85rem" }}
      >
        Poproś o wycenę
      </a>
    </div>
  );
}

function AnalyticsCard({
  icon: _icon,
  color,
  title,
  value,
  sub,
  bar,
  barColor,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  value: string;
  sub: string;
  bar: number;
  barColor?: string;
}) {
  return (
    <div className="analytics-card">
      <div className="analytics-card-header">
        <div
          className="analytics-card-icon"
          style={{ background: `${color}1f`, color }}
        >
          {_icon}
        </div>
        <span>{title}</span>
      </div>
      <div className="analytics-card-value">{value}</div>
      <div className="analytics-card-sub" dangerouslySetInnerHTML={{ __html: sub }} />
      <div className="analytics-mini-bar">
        <div
          className="analytics-mini-fill"
          style={{ width: `${bar}%`, background: barColor }}
        />
      </div>
    </div>
  );
}
