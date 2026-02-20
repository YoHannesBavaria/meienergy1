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
  const longTitle = page.title.length > 78;
  const intro = page.excerpt || toSnippet(page.text, 220);

  return (
    <main className="container page-flow">
      <section className="hero-panel hero-compact">
        <p className="eyebrow">{translateCategory(page.category)}</p>
        <h1 className={`page-title ${longTitle ? "is-long" : ""}`}>{page.title}</h1>
        <p className="lede">{intro}</p>
      </section>

      {showHeroImage ? (
        <section className="media-panel media-panel-soft">
          <div className="hero-media-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={page.heroImage} alt={page.title} className="hero-media" loading="eager" fetchPriority="high" />
          </div>
        </section>
      ) : null}

      <section className="article-shell">
        <ArticleBody html={page.html} />
      </section>

      <section className="meta-strip">
        <span>Zuletzt aktualisiert: {formatDate(page.updatedAt)}</span>
        <span>
          Fragen? <Link href="/kontakt">Jetzt Kontakt aufnehmen</Link>
        </span>
      </section>

      {related.length > 0 ? (
        <section className="library-group">
          <h2>Aehnliche Inhalte</h2>
          <ul>
            {related.map((item) => (
              <li key={item.path}>
                <Link href={item.path}>{item.title}</Link>
                <span>{translateCategory(item.category)}</span>
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
  if (/logo|cropped|favicon|submit-spin/i.test(src)) return false;
  return true;
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

function toSnippet(value: string, maxChars: number) {
  const cleaned = String(value || "")
    .replace(/\s+/g, " ")
    .replace(/https?:\/\/\S+/gi, "")
    .trim();
  if (cleaned.length <= maxChars) return cleaned;
  return `${cleaned.slice(0, maxChars - 1)}...`;
}
