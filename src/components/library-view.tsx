import Link from "next/link";
import { getPageGroups } from "@/lib/content";
import type { SiteContent } from "@/types/content";

type Props = {
  content: SiteContent;
};

export function LibraryView({ content }: Props) {
  const groups = getPageGroups(content);

  return (
    <main className="container page-flow">
      <section className="hero-panel hero-compact">
        <p className="eyebrow">CONTENT LIBRARY</p>
        <h1>Vollstaendiger Inhaltsindex</h1>
        <p className="lede">
          Alle migrierten Legacy-Routen sind zentral erfasst. Damit koennen Navigation, Qualitaetssicherung und
          CMS-Anbindung sauber nachvollzogen werden.
        </p>
      </section>

      <section className="overview-grid">
        <article className="stat-card">
          <h2>{content.pages.length}</h2>
          <p>Seiten</p>
        </article>
        <article className="stat-card">
          <h2>{content.menuItems.length}</h2>
          <p>Menuepunkte</p>
        </article>
        <article className="stat-card">
          <h2>{groups.length}</h2>
          <p>Gruppen</p>
        </article>
      </section>

      <section className="library-group">
        <h2>Kategorien</h2>
        <ul>
          {groups.map((group) => (
            <li key={group.name}>
              <span>{group.name}</span>
              <span>{group.count} Seiten</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="library-group">
        <h2>Routen</h2>
        <ul>
          {content.pages.map((page) => (
            <li key={page.path}>
              <Link href={page.path}>{page.path}</Link>
              <span>{page.title}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
