import Link from "next/link";
import { ArticleBody } from "@/components/article-body";
import type { LegacyPage, SiteContent } from "@/types/content";

type Props = {
  page: LegacyPage;
  content: SiteContent;
};

export function PageView({ page, content }: Props) {
  const related = content.pages
    .filter((candidate) => candidate.path !== page.path && candidate.category === page.category)
    .slice(0, 6);

  const showHeroImage = shouldRenderHeroImage(page.heroImage);

  return (
    <main className="container page-flow">
      <section className="hero-panel hero-compact">
        <p className="eyebrow">{page.category}</p>
        <h1>{page.title}</h1>
        <p className="lede">{page.excerpt}</p>
      </section>

      {showHeroImage ? (
        <section className="media-panel">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={page.heroImage} alt={page.title} className="hero-media" loading="lazy" />
        </section>
      ) : null}

      <section className="article-shell">
        <ArticleBody html={page.html} />
      </section>

      <section className="meta-strip">
        <span>Zuletzt aktualisiert: {formatDate(page.updatedAt)}</span>
        <span>Route: {page.path}</span>
      </section>

      {related.length > 0 ? (
        <section className="library-group">
          <h2>Aehnliche Inhalte</h2>
          <ul>
            {related.map((item) => (
              <li key={item.path}>
                <Link href={item.path}>{item.title}</Link>
                <span>{item.category}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

function shouldRenderHeroImage(value: string) {
  const src = String(value || "").trim();
  if (!src) return false;
  if (/logo|cropped|favicon/i.test(src)) return false;
  return true;
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
