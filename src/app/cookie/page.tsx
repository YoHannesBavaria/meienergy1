export default function CookiePage() {
  return (
    <main className="container page-flow">
      <section className="hero-panel hero-compact">
        <p className="eyebrow">LEGAL</p>
        <h1>Cookie-Hinweise</h1>
        <p className="lede">
          Diese Uebersicht beschreibt den Einsatz technisch notwendiger Cookies und optionaler Komfortfunktionen auf
          der neu implementierten Mei-Energy-Webseite.
        </p>
      </section>

      <section className="article-shell">
        <div className="article-body">
          <h2>Technisch notwendige Cookies</h2>
          <p>Diese Cookies sind fuer den sicheren Betrieb der Website erforderlich und koennen nicht deaktiviert werden.</p>

          <h2>Optionale Cookies</h2>
          <p>
            Optionale Cookies fuer Analysen oder Komfortfunktionen werden nur auf Basis einer expliziten Einwilligung
            gesetzt.
          </p>

          <h2>Kontakt</h2>
          <p>Fragen zum Datenschutz oder zu Cookies: info@meienergy.de</p>
        </div>
      </section>
    </main>
  );
}
