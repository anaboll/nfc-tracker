import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "TwojeNFC — Inteligentne breloki i karty NFC",
  description:
    "Breloki i karty NFC z wizytówką, linkami do social mediów i stroną WWW. Jeden dotyk telefonu — i klient ma wszystko. Dla firm, freelancerów i każdego, kto chce się wyróżnić.",
  robots: { index: true, follow: true },
};

/* ------------------------------------------------------------------ */
/*  Inline SVG icons                                                   */
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

const IconCard = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const IconKey = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

const IconRefresh = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.182" />
  </svg>
);

const IconStar = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
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
            <a href="#jak-to-dziala">Jak to działa</a>
            <a href="#zastosowania">Zastosowania</a>
            <a href="#mozliwosci">Możliwości</a>
            <a href="#kontakt">Kontakt</a>
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
            Breloki i karty NFC
          </div>
          <h1 className="hero-title">
            Klient przykłada telefon<br />
            do breloka — i&nbsp;ma<br />
            <span className="gradient-text">wszystko o&nbsp;Twojej firmie</span>
          </h1>
          <p className="hero-subtitle">
            Wizytówka, strona WWW, social media, recenzje Google
            — wszystko w&nbsp;jednym breloku NFC, który zostaje na kluczach.
          </p>
          <div className="hero-actions">
            <a href="#kontakt" className="btn-primary hero-btn">
              Zapytaj o ofertę
            </a>
            <Link href="/login" className="hero-btn-secondary">
              Panel klienta &rarr;
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">1 sek.</span>
              <span className="hero-stat-label">czas skanowania</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">iPhone + Android</span>
              <span className="hero-stat-label">pełna kompatybilność</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">Bez aplikacji</span>
              <span className="hero-stat-label">wystarczy przyłożyć</span>
            </div>
          </div>
        </div>
      </section>

      {/* --------- JAK TO DZIAŁA --------- */}
      <section id="jak-to-dziala" className="hiw-section">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">Jak to działa</span>
            <h2 className="section-title">Prościej się nie da</h2>
          </div>
          <div className="hiw-grid">
            <StepCard
              step="01"
              title="Wybierasz, co wyświetlić"
              desc="Wizytówkę z danymi kontaktowymi? Linklista z social mediami? Stronę WWW? A może wszystko naraz — Ty decydujesz."
            />
            <StepCard
              step="02"
              title="Klient przykłada telefon"
              desc="Wystarczy przyłożyć iPhone'a lub Androida do breloka. Bez instalowania aplikacji, bez skanowania kodów — jedno dotknięcie."
            />
            <StepCard
              step="03"
              title="Ma Twoje dane w&nbsp;telefonie"
              desc="Wizytówka zapisuje się w kontaktach, strona otwiera się w przeglądarce. Klient ma do Ciebie drogę w&nbsp;kieszeni."
            />
          </div>
        </div>
      </section>

      {/* --------- ZASTOSOWANIA --------- */}
      <section id="zastosowania" className="features-section">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">Zastosowania</span>
            <h2 className="section-title">Dla kogo są breloki NFC?</h2>
            <p className="section-subtitle">
              Wszędzie tam, gdzie chcesz, żeby klient zapamiętał Twoją firmę
              — i&nbsp;miał do niej łatwy powrót.
            </p>
          </div>
          <div className="features-grid">
            <FeatureCard
              icon={<IconUsers />}
              title="Networking i eventy"
              desc="Konferencja, targi, spotkanie branżowe — wręcz brelok zamiast papierowej wizytówki. Nikt go nie wyrzuci."
            />
            <FeatureCard
              icon={<IconStar />}
              title="Restauracje i kawiarnie"
              desc="Brelok na stolik lub do rachunku — klient od razu zostawi recenzję Google lub zobaczy menu."
            />
            <FeatureCard
              icon={<IconCard />}
              title="Salony i usługi"
              desc="Fryzjer, kosmetyczka, mechanik — klient przykłada telefon i ma numer, adres, cennik i link do rezerwacji."
            />
            <FeatureCard
              icon={<IconGlobe />}
              title="Agenci i handlowcy"
              desc="Nieruchomości, ubezpieczenia, B2B — profesjonalna wizytówka cyfrowa, która robi wrażenie i zostaje."
            />
            <FeatureCard
              icon={<IconLink />}
              title="Influencerzy i twórcy"
              desc="Instagram, TikTok, YouTube, Spotify — wszystkie kanały w jednym miejscu. Fani skanują i od razu obserwują."
            />
            <FeatureCard
              icon={<IconKey />}
              title="Gadżety firmowe"
              desc="Brelok z logiem firmy na kluczach klienta. Codziennie go widzi, a jak potrzebuje — skanuje i ma kontakt."
            />
          </div>
        </div>
      </section>

      {/* --------- MOŻLIWOŚCI --------- */}
      <section id="mozliwosci" className="types-section">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">Możliwości</span>
            <h2 className="section-title">Co może Twój brelok NFC</h2>
            <p className="section-subtitle">
              Zaprogramujemy brelok dokładnie pod Twoje potrzeby.
              Możesz zmienić zawartość w&nbsp;dowolnym momencie — bez wymiany breloka.
            </p>
          </div>
          <div className="types-grid">
            <TypeCard icon={<IconCard />} title="Wizytówka kontaktowa" desc="Imię, telefon, email, adres, stanowisko — wszystko zapisuje się w kontaktach jednym dotknięciem." />
            <TypeCard icon={<IconGlobe />} title="Strona internetowa" desc="Przekierowanie na dowolną stronę — Twój sklep, portfolio, ofertę, rezerwację wizyt." />
            <TypeCard icon={<IconLink />} title="Lista linków" desc="Instagram, Facebook, LinkedIn, TikTok, YouTube, Spotify — wszystkie kanały w jednym miejscu." />
            <TypeCard icon={<IconStar />} title="Recenzje Google" desc="Klient skanuje i od razu pisze opinię. Idealne dla restauracji, salonów i usług lokalnych." />
            <TypeCard icon={<IconRefresh />} title="Zmiana bez wymiany" desc="Chcesz zmienić stronę lub dane? Zmieniasz w panelu — brelok natychmiast pokazuje nową treść." />
            <TypeCard icon={<IconChart />} title="Analityka skanów" desc="Sprawdź ile osób skanuje Twoje breloki, skąd są i kiedy to robią. Opcjonalny panel z danymi." />
          </div>
        </div>
      </section>

      {/* --------- ANALYTICS PREVIEW --------- */}
      <section className="analytics-section">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-tag">Analityka</span>
            <h2 className="section-title">Opcjonalnie — sprawdź kto skanuje</h2>
            <p className="section-subtitle">
              Dla tych, którzy chcą wiedzieć więcej. Panel analityczny pokazuje
              szczegóły każdego skanowania.
            </p>
          </div>
          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-card-header">
                <div className="analytics-card-icon" style={{ background: "rgba(56,189,248,0.12)", color: "#38BDF8" }}>📊</div>
                <span>Ile osób skanuje</span>
              </div>
              <div className="analytics-card-value">1 247</div>
              <div className="analytics-card-sub">wszystkich skanów &middot; 489 unikalnych osób</div>
              <div className="analytics-mini-bar">
                <div className="analytics-mini-fill" style={{ width: "72%" }} />
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-card-header">
                <div className="analytics-card-icon" style={{ background: "rgba(56,189,248,0.12)", color: "#38BDF8" }}>🌍</div>
                <span>Skąd skanują</span>
              </div>
              <div className="analytics-card-value">12 miast</div>
              <div className="analytics-card-sub">Warszawa 38% &middot; Kraków 22% &middot; Wrocław 14%</div>
              <div className="analytics-mini-bar">
                <div className="analytics-mini-fill" style={{ width: "67%" }} />
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-card-header">
                <div className="analytics-card-icon" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>📱</div>
                <span>Jakim telefonem</span>
              </div>
              <div className="analytics-card-value">92% mobile</div>
              <div className="analytics-card-sub">iPhone 54% &middot; Android 38% &middot; inny 8%</div>
              <div className="analytics-mini-bar">
                <div className="analytics-mini-fill" style={{ width: "92%", background: "#22c55e" }} />
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-card-header">
                <div className="analytics-card-icon" style={{ background: "rgba(56,189,248,0.12)", color: "#38BDF8" }}>⏰</div>
                <span>Kiedy skanują</span>
              </div>
              <div className="analytics-card-value">Szczyt: 14:00</div>
              <div className="analytics-card-sub">Rozkład aktywności w ciągu dnia i tygodnia</div>
              <div className="analytics-mini-bar">
                <div className="analytics-mini-fill" style={{ width: "68%" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------- CTA / KONTAKT --------- */}
      <section id="kontakt" className="cta-section">
        <div className="landing-container cta-inner">
          <h2 className="cta-title">
            Chcesz, żeby klienci wracali?
          </h2>
          <p className="cta-subtitle">
            Napisz do nas — powiemy Ci, jakie breloki sprawdzą się
            w&nbsp;Twojej branży i&nbsp;co na nich umieścić.
          </p>
          <div className="cta-actions">
            <a
              href="mailto:kontakt@twojenfc.pl"
              className="btn-primary hero-btn"
            >
              kontakt@twojenfc.pl
            </a>
            <Link href="/login" className="hero-btn-secondary">
              Panel klienta &rarr;
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
            <p className="footer-tagline">Inteligentne breloki i karty NFC</p>
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
