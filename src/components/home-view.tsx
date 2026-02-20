import Link from "next/link";
import { getFeaturedPages, getLatestPages } from "@/lib/content";
import type { LegacyPage, SiteContent } from "@/types/content";

type Props = {
  content: SiteContent;
};

const FALLBACK_IMAGE = "/legacy-assets/meienergy.de/wp-content/uploads/2021/08/Sauna-Bild.jpg";

export function HomeView({ content }: Props) {
  const features = getFeaturedPages(content);
  const latest = getLatestPages(content, 8);
  const featuredCards = assignDisplayImages(features);
  const latestCards = assignDisplayImages(latest, new Set(featuredCards.map((item) => item.image.toLowerCase())));
  const heroShowcase = assignDisplayImages([...features, ...latest]).slice(0, 3);

  return (
    <main className="container page-flow">
      <section className="hero-panel home-hero">
        <div className="home-hero-grid">
          <div>
            <p className="eyebrow">MEI ENERGY FITNESSSTUDIO</p>
            <h1>Fit und gesund bleiben.</h1>
            <p className="lede">
              Starte mit einem Plan, der zu dir passt: Kraft, Ausdauer, Beweglichkeit und Regeneration in einem
              Studio, das dich persoenlich begleitet.
            </p>
            <div className="hero-actions">
              <Link href="/werde-mitglied" className="btn solid">
                Probewoche starten
              </Link>
              <Link href="/kursuebersicht" className="btn ghost">
                Kursplan ansehen
              </Link>
              <Link href="/kontakt" className="btn ghost">
                Beratung buchen
              </Link>
            </div>
          </div>
          <div className="home-hero-showcase">
            {heroShowcase.map((item, index) => (
              <figure key={`${item.page.path}-${index}`} className={`hero-showcase-card hero-showcase-${index + 1}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.page.title} className="hero-showcase-image" loading="lazy" />
                <figcaption>{item.page.title}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="overview-grid">
        <article className="stat-card">
          <h2>108</h2>
          <p>Mitgliederstimmen</p>
        </article>
        <article className="stat-card">
          <h2>10</h2>
          <p>Mikroangebote</p>
        </article>
        <article className="stat-card">
          <h2>6</h2>
          <p>Leistungspakete</p>
        </article>
        <article className="stat-card">
          <h2>110</h2>
          <p>Verfuegbare Routen</p>
        </article>
      </section>

      <section className="section-head">
        <div>
          <p className="eyebrow">DEINE WEGE IM STUDIO</p>
          <h2>Leistungen und Kernseiten</h2>
        </div>
      </section>

      <section className="feature-grid">
        {featuredCards.map(({ page, image }) => (
          <article key={page.path} className="feature-card">
            <div className="feature-image-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt={page.title} className="feature-image" loading="lazy" />
            </div>
            <div>
              <p className="card-eyebrow">{translateCategory(page.category)}</p>
              <h3>{page.title}</h3>
              <p>{toSnippet(page.excerpt || page.text, 140)}</p>
              <Link href={page.path}>Mehr erfahren</Link>
            </div>
          </article>
        ))}
      </section>

      <section className="section-head">
        <div>
          <p className="eyebrow">AKTUELLES AUS DEM STUDIO</p>
          <h2>News, Tipps und Community</h2>
        </div>
      </section>

      <section className="news-grid">
        {latestCards.map(({ page, image }) => (
          <article key={page.path} className="news-card">
            <div className="feature-image-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt={page.title} className="feature-image" loading="lazy" />
            </div>
            <div className="news-copy">
              <p className="card-eyebrow">{translateCategory(page.category)}</p>
              <h3>{page.title}</h3>
              <p>{toSnippet(page.excerpt || page.text, 200)}</p>
              <div className="news-meta">
                <span>{formatDate(page.updatedAt)}</span>
                <Link href={page.path}>Zum Beitrag</Link>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="meta-strip">
        <span>Adresse: Nesspriel 6, 94036 Passau</span>
        <span>Kontakt: info@meienergy.de</span>
      </section>

      <section className="customer-note">
        <p>
          Du suchst das passende Training fuer dein Ziel? In <Link href="/kontakt">unserem Kontaktbereich</Link> kannst
          du direkt ein persoenliches Erstgespraech anfragen.
        </p>
      </section>
    </main>
  );
}

function assignDisplayImages(pages: LegacyPage[], seeded?: Set<string>) {
  const used = seeded || new Set<string>();

  return pages.map((page) => {
    const candidatePool = [page.heroImage, ...(page.contentImages || [])]
      .map((item) => String(item || "").trim())
      .filter(Boolean);

    const uniqueCandidate = candidatePool.find((item) => !used.has(item.toLowerCase())) || candidatePool[0] || FALLBACK_IMAGE;
    used.add(uniqueCandidate.toLowerCase());

    return {
      page,
      image: uniqueCandidate,
    };
  });
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
  if (!iso) return "Aktuell";
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return iso;
  return new Date(parsed).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function translateCategory(category: string) {
  const value = String(category || "").toLowerCase();
  if (value.includes("home")) return "Studio";
  if (value.includes("contact")) return "Kontakt";
  if (value.includes("faq")) return "Fragen & Antworten";
  if (value.includes("blog")) return "News";
  return category;
}
