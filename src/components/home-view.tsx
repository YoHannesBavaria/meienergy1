import Link from "next/link";
import { getFeaturedPages, getHomePage, getLatestPages, getPageGroups } from "@/lib/content";
import type { SiteContent } from "@/types/content";

type Props = {
  content: SiteContent;
};

const FALLBACK_IMAGE = "/legacy-assets/meienergy.de/wp-content/uploads/2021/08/Sauna-Bild.jpg";

export function HomeView({ content }: Props) {
  const home = getHomePage(content);
  const features = getFeaturedPages(content);
  const groups = getPageGroups(content);
  const latest = getLatestPages(content, 8);

  return (
    <main className="container page-flow">
      <section className="hero-panel">
        <p className="eyebrow">MEI ENERGY RELAUNCH</p>
        <h1>{home.title || "Fit und gesund bleiben"}</h1>
        <p className="lede">
          Die komplette Legacy-Webseite wurde in eine neue Informationsarchitektur ueberfuehrt: schneller,
          strukturierter und mobil-first, mit vollstaendiger Routenabdeckung fuer alle vorhandenen Inhalte.
        </p>
        <div className="hero-actions">
          <Link href="/werde-mitglied" className="btn solid">
            Mitglied werden
          </Link>
          <Link href="/kursuebersicht" className="btn ghost">
            Kursuebersicht
          </Link>
          <Link href="/unsere-angebote" className="btn ghost">
            Angebote entdecken
          </Link>
        </div>
      </section>

      <section className="overview-grid">
        <article className="stat-card">
          <h2>{content.pages.length}</h2>
          <p>Migrierte Seiten</p>
        </article>
        <article className="stat-card">
          <h2>{content.menuItems.length}</h2>
          <p>Menuepunkte</p>
        </article>
        <article className="stat-card">
          <h2>{groups.length}</h2>
          <p>Inhaltsgruppen</p>
        </article>
        <article className="stat-card">
          <h2>{content.routes.length}</h2>
          <p>Verfuegbare Routen</p>
        </article>
      </section>

      <section className="section-head">
        <div>
          <p className="eyebrow">HAUPTBEREICHE</p>
          <h2>Leistungen und Kernseiten</h2>
        </div>
      </section>

      <section className="feature-grid">
        {features.map((page) => (
          <article key={page.path} className="feature-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pickCardImage(page.heroImage)} alt={page.title} className="feature-image" loading="lazy" />
            <div>
              <p className="card-eyebrow">{page.category}</p>
              <h3>{page.title}</h3>
              <p>{toSnippet(page.excerpt || page.text, 120)}</p>
              <Link href={page.path}>Seite oeffnen</Link>
            </div>
          </article>
        ))}
      </section>

      <section className="section-head">
        <div>
          <p className="eyebrow">AKTUELLE INHALTE</p>
          <h2>Neuigkeiten und Ratgeber</h2>
        </div>
        <Link href="/library" className="btn ghost">
          Voller Inhaltsindex
        </Link>
      </section>

      <section className="news-grid">
        {latest.map((page) => (
          <article key={page.path} className="news-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pickCardImage(page.heroImage)} alt={page.title} className="feature-image" loading="lazy" />
            <div className="news-copy">
              <p className="card-eyebrow">{page.category}</p>
              <h3>{page.title}</h3>
              <p>{toSnippet(page.excerpt || page.text, 180)}</p>
              <div className="news-meta">
                <span>{formatDate(page.updatedAt)}</span>
                <Link href={page.path}>Zum Beitrag</Link>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="meta-strip">
        <span>Quelle: {content.sourceLabel}</span>
        <span>Stand: {new Date(content.generatedAt).toLocaleString("de-DE")}</span>
      </section>
    </main>
  );
}

function pickCardImage(value: string) {
  const src = String(value || "").trim();
  if (!src) return FALLBACK_IMAGE;
  if (/logo|cropped|favicon/i.test(src)) return FALLBACK_IMAGE;
  return src;
}

function truncate(value: string, maxChars: number) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1)}...`;
}

function toSnippet(value: string, maxChars: number) {
  const cleaned = String(value || "")
    .replace(/\s+/g, " ")
    .replace(/(home|kontakt|impressum|datenschutz|cookie)/gi, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b(info@meienergy\.de|www\.meienergy\.de)\b/gi, "")
    .trim();
  return truncate(cleaned, maxChars);
}

function formatDate(value: string) {
  const iso = String(value || "").trim();
  if (!iso) return "kein Datum";
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return iso;
  return new Date(parsed).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
