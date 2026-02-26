import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "TwojeNFC — Platforma NFC & QR dla biznesu",
  description:
    "Zarządzaj tagami NFC i kodami QR, śledź skany w czasie rzeczywistym, analizuj dane odwiedzających. Profesjonalne rozwiązanie white-label dla Twojej marki.",
  robots: { index: true, follow: true },
};

/* ------------------------------------------------------------------ */
/*  Inline SVG icons (no external deps)                                */
/* ------------------------------------------------------------------ */

const IconNfc = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
  </svg>
);

const IconChart = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const IconGlobe = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9 9 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

const IconShield = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const IconLink = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
  </svg>
);

const IconUsers = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const IconVideo = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
  </svg>
);

const IconCard = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const IconStar = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

const IconQr = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  return (
    <div className="landing-page">
      {/* --------- NAV --------- */}
      <nav className="landing-nav">
        <div className="landing-container nav-inner">
          <div className="nav-logo">
            <div className="nav-logo-icon"><IconNfc /></div>
            <span className="gradient-text nav-logo-text">TwojeNFC</span>
          </div>
          <div className="nav-links">
            <a href="#features">Funkcje</a>
            <a href="#how-it-works">Jak to dziala</a>
            <a href="#tag-types">Typy tagow</a>
            <a href="#contact">Kontakt</a>
            <Link href="/login" className="nav-cta">Panel klienta</Link>
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
            Platforma NFC & QR dla biznesu
          </div>
          <h1 className="hero-title">
            Zamien <span className="gradient-text">fizyczny kontakt</span><br />
            w <span className="gradient-text">cyfrowe dane</span>
          </h1>
          <p className="hero-subtitle">
            Tworzenie tagow NFC i kodow QR, sledzenie skanow w czasie rzeczywistym,
            analityka odwiedzajacych — wszystko pod Twoja domena i marka.
          </p>
          <div className="hero-actions">
            <a href="#contact" className="btn-primary hero-btn">
              Umow prezentacje
            </a>
            <Link href="/login" className="hero-btn-secondary">
              Panel klienta &rarr;
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">5</span>
              <span className="hero-stat-label">typow tagow</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">Real-time</span>
              <span className="hero-stat-label">analityka skanow</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">White-label</span>
              <span className="hero-stat-label">Twoja domena</span>
            </div>
          </div>
        </div>
      </section>

      {/* --------- FEATURES --------- */}
      <section id="features" className="features-section">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">Funkcje</span>
            <h2 className="section-title">Wszystko czego potrzebujesz</h2>
            <p className="section-subtitle">
              Kompletne narzedzie do zarzadzania tagami NFC i kodami QR z pelna analityka.
            </p>
          </div>
          <div className="features-grid">
            <FeatureCard
              icon={<IconChart />}
              title="Zaawansowana analityka"
              desc="Liczba skanow, unikalni uzytkownicy, geolokalizacja, urzadzenia, jezyki, trendy tygodniowe i godzinowe — wszystko w jednym panelu."
            />
            <FeatureCard
              icon={<IconGlobe />}
              title="Geolokalizacja"
              desc="Automatyczne rozpoznawanie kraju, miasta i regionu kazdego skanowania. Mapy i statystyki lokalizacji odwiedzajacych."
            />
            <FeatureCard
              icon={<IconLink />}
              title="Multi-link & vCard"
              desc="Tagi przekierowujace do wielu linkow, wizytowki kontaktowe, filmy wideo, recenzje Google — jeden tag, wiele mozliwosci."
            />
            <FeatureCard
              icon={<IconUsers />}
              title="Multi-klient"
              desc="Zarzadzaj wieloma klientami i kampaniami z jednego panelu. Role uzytkownikow z kontrola dostepu do danych."
            />
            <FeatureCard
              icon={<IconShield />}
              title="White-label"
              desc="Wszystko pod Twoja domena. Brak obcych logoypow czy linkow — klient widzi Twoja marke na kazdym kroku."
            />
            <FeatureCard
              icon={<IconNfc />}
              title="NFC + QR"
              desc="Obsluga zarowno tagow NFC jak i kodow QR z jednego systemu. Rozroznianie zrodla skanowania w statystykach."
            />
          </div>
        </div>
      </section>

      {/* --------- HOW IT WORKS --------- */}
      <section id="how-it-works" className="hiw-section">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">Jak to dziala</span>
            <h2 className="section-title">3 proste kroki</h2>
          </div>
          <div className="hiw-grid">
            <StepCard
              step="01"
              title="Stworz tag"
              desc="Wybierz typ tagu — URL, video, multilink, wizytowka lub recenzja Google. Przypisz go do klienta i kampanii."
            />
            <StepCard
              step="02"
              title="Udostepnij"
              desc="Zaprogramuj chip NFC lub wydrukuj kod QR z wygenerowanym linkiem. Dostarczyaj klientowi gotowy produkt."
            />
            <StepCard
              step="03"
              title="Analizuj"
              desc="Sledz skany w czasie rzeczywistym. Sprawdzaj kto, skad, kiedy i jakim urzadzeniem skanowal Twoj tag."
            />
          </div>
        </div>
      </section>

      {/* --------- TAG TYPES --------- */}
      <section id="tag-types" className="types-section">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">Typy tagow</span>
            <h2 className="section-title">Jeden system, 5 rodzajow tagow</h2>
            <p className="section-subtitle">
              Kazdy tag mozna przypisac do klienta i kampanii, sledzic statystyki i edytowac w dowolnym momencie.
            </p>
          </div>
          <div className="types-grid">
            <TypeCard icon={<IconGlobe />} title="URL" desc="Przekierowanie na dowolna strone WWW z pelnym sledzeniem UTM i parametrow." />
            <TypeCard icon={<IconVideo />} title="Wideo" desc="Strona z osadzonym filmem i sledzeniem postepow ogladania (25/50/75/100%)." />
            <TypeCard icon={<IconLink />} title="Multilink" desc="Lista linkow z ikonami — jak Linktree, ale na Twojej domenie z analityka klikniec." />
            <TypeCard icon={<IconCard />} title="Wizytowka (vCard)" desc="Cyfrowa wizytowka kontaktowa z mozliwoscia pobrania pliku .vcf na telefon." />
            <TypeCard icon={<IconStar />} title="Google Review" desc="Bezposrednie przekierowanie do formularza opinii Google — idealne dla restauracji i uslug." />
            <TypeCard icon={<IconQr />} title="QR Code" desc="Kazdy tag automatycznie generuje kod QR do wydruku obok programowania chipu NFC." />
          </div>
        </div>
      </section>

      {/* --------- ANALYTICS PREVIEW --------- */}
      <section className="analytics-section">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">Analityka</span>
            <h2 className="section-title">Dane, ktore maja znaczenie</h2>
          </div>
          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-card-header">
                <div className="analytics-card-icon" style={{ background: "rgba(0,200,160,0.15)", color: "#2ee8c0" }}>📊</div>
                <span>Skany i unikalni</span>
              </div>
              <div className="analytics-card-value">1,247</div>
              <div className="analytics-card-sub">skanow w tym miesiacu &middot; 489 unikalnych</div>
              <div className="analytics-mini-bar">
                <div className="analytics-mini-fill" style={{ width: "72%" }} />
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-card-header">
                <div className="analytics-card-icon" style={{ background: "rgba(59,130,246,0.15)", color: "#6366f1" }}>🌍</div>
                <span>Geolokalizacja</span>
              </div>
              <div className="analytics-card-value">12 krajow</div>
              <div className="analytics-card-sub">PL 67% &middot; DE 12% &middot; UK 8% &middot; inne 13%</div>
              <div className="analytics-mini-bar">
                <div className="analytics-mini-fill" style={{ width: "67%", background: "#6366f1" }} />
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-card-header">
                <div className="analytics-card-icon" style={{ background: "rgba(34,197,94,0.15)", color: "#34d399" }}>📱</div>
                <span>Urzadzenia</span>
              </div>
              <div className="analytics-card-value">87% mobile</div>
              <div className="analytics-card-sub">iOS 52% &middot; Android 35% &middot; Desktop 13%</div>
              <div className="analytics-mini-bar">
                <div className="analytics-mini-fill" style={{ width: "87%", background: "#34d399" }} />
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-card-header">
                <div className="analytics-card-icon" style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7" }}>⏰</div>
                <span>Trendy godzinowe</span>
              </div>
              <div className="analytics-card-value">Peak: 12:00</div>
              <div className="analytics-card-sub">Heatmapa aktywnosci 24h z podzialem na dni tygodnia</div>
              <div className="analytics-mini-bar">
                <div className="analytics-mini-fill" style={{ width: "54%", background: "#a855f7" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------- CTA / CONTACT --------- */}
      <section id="contact" className="cta-section">
        <div className="landing-container cta-inner">
          <h2 className="cta-title">
            Gotowy zaczac <span className="gradient-text">sledzic</span> swoje tagi?
          </h2>
          <p className="cta-subtitle">
            Skontaktuj sie, aby umowic prezentacje platformy lub od razu przejdz do panelu.
          </p>
          <div className="cta-actions">
            <a
              href="mailto:kontakt@twojenfc.pl"
              className="btn-primary hero-btn"
            >
              kontakt@twojenfc.pl
            </a>
            <Link href="/login" className="hero-btn-secondary">
              Zaloguj sie &rarr;
            </Link>
          </div>
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
            <p className="footer-tagline">Platforma NFC & QR dla biznesu</p>
          </div>
          <div className="footer-copy">
            &copy; {new Date().getFullYear()} TwojeNFC. Wszelkie prawa zastrzezone.
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="feature-card card card-hover">
      <div className="feature-icon">{icon}</div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{desc}</p>
    </div>
  );
}

function StepCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="step-card">
      <div className="step-number">{step}</div>
      <h3 className="step-title">{title}</h3>
      <p className="step-desc">{desc}</p>
    </div>
  );
}

function TypeCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="type-card card card-hover">
      <div className="type-icon">{icon}</div>
      <h3 className="type-title">{title}</h3>
      <p className="type-desc">{desc}</p>
    </div>
  );
}
