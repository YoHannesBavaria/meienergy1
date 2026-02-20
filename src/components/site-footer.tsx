import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <section className="footer-block">
          <h2>Mei Energy</h2>
          <p>Nesspriel 6</p>
          <p>94036 Passau</p>
          <p>Bayern, Deutschland</p>
          <p>
            <a href="mailto:info@meienergy.de">info@meienergy.de</a>
          </p>
        </section>

        <section className="footer-block">
          <h2>Quicklinks</h2>
          <ul>
            <li>
              <Link href="/ueber-uns">Ueber uns</Link>
            </li>
            <li>
              <Link href="/kursuebersicht">Kursuebersicht</Link>
            </li>
            <li>
              <Link href="/unsere-angebote">Unsere Angebote</Link>
            </li>
            <li>
              <Link href="/werde-mitglied">Werde Mitglied</Link>
            </li>
          </ul>
        </section>

        <section className="footer-block">
          <h2>Rechtliches</h2>
          <ul>
            <li>
              <Link href="/impressum">Impressum</Link>
            </li>
            <li>
              <Link href="/datenschutzerklaerung">Datenschutz</Link>
            </li>
            <li>
              <Link href="/agb">AGB</Link>
            </li>
            <li>
              <Link href="/cookie">Cookie-Hinweise</Link>
            </li>
          </ul>
        </section>

        <section className="footer-block">
          <h2>Service</h2>
          <p>Persoenliche Trainingsberatung</p>
          <p>Kurse fuer Einsteiger und Fortgeschrittene</p>
          <p>Direkter Kontakt fuer Probetraining</p>
        </section>
      </div>
    </footer>
  );
}
