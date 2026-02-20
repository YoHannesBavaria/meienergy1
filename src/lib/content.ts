import structure from "@/data/site-structure.json";
import type { InternalMenuItem, LegacyPage, LegacySiteStructure, SiteContent } from "@/types/content";

const typed = structure as LegacySiteStructure;

export async function getSiteContent(): Promise<SiteContent> {
  const pages = applyAliases(dedupePages(typed.pages || []));
  const routeSet = new Set<string>(pages.map((page) => normalizePath(page.path)));

  const menu = sanitizeMenu(typed.primaryMenu || [], routeSet);
  const menuItems = menu.map(toInternalMenuItem);

  const routes = [...routeSet].sort((a, b) => a.localeCompare(b));
  if (!routeSet.has("/library")) routes.push("/library");
  if (!routes.includes("/cookie")) routes.push("/cookie");
  if (!routes.includes("/datenschutz")) routes.push("/datenschutz");

  return {
    generatedAt: typed.generatedAt || new Date().toISOString(),
    source: typed.source || "https://meienergy.de",
    sourceLabel: "legacy-site-snapshot",
    hostAllowList: (typed.hostAllowList || []).map((item) => String(item || "").toLowerCase()),
    menu,
    menuItems,
    pages,
    routes,
  };
}

function applyAliases(pages: LegacyPage[]) {
  const out = [...pages];
  const hasPath = (path: string) => out.some((page) => normalizePath(page.path) === normalizePath(path));
  const getPath = (path: string) => out.find((page) => normalizePath(page.path) === normalizePath(path));

  if (!hasPath("/feedback")) {
    const source = getPath("/fit-testimonials") || getPath("/testimonials-cat/testimonials-v1");
    if (source) {
      out.push({
        ...source,
        id: `${source.id}__feedback`,
        path: "/feedback",
        title: "Feedback",
      });
    }
  }

  if (!hasPath("/datenschutz")) {
    const source = getPath("/datenschutzerklaerung");
    if (source) {
      out.push({
        ...source,
        id: `${source.id}__datenschutz`,
        path: "/datenschutz",
        title: "Datenschutz",
      });
    }
  }

  return out.sort((a, b) => a.path.localeCompare(b.path));
}

export function getPageByPath(pathname: string, content: SiteContent): LegacyPage | null {
  const path = normalizePath(pathname);
  return content.pages.find((page) => normalizePath(page.path) === path) || null;
}

export function getHomePage(content: SiteContent): LegacyPage {
  return (
    getPageByPath("/", content) || {
      id: "home-fallback",
      url: content.source,
      path: "/",
      title: "Mei Energy",
      excerpt: "Dein Fitness-Studio fuer Koerper, Geist und Seele",
      text: "Mei Energy",
      html: "<p>Mei Energy</p>",
      heroImage: "",
      updatedAt: "",
      category: "home",
    }
  );
}

export function getFeaturedPages(content: SiteContent): LegacyPage[] {
  const menuPaths = content.menuItems
    .map((item) => item.path)
    .filter((path): path is string => Boolean(path))
    .filter((path) => path !== "/");

  const byMenu = menuPaths
    .map((path) => getPageByPath(path, content))
    .filter((page): page is LegacyPage => page !== null);

  if (byMenu.length >= 6) return byMenu.slice(0, 6);

  const fallback = content.pages.filter((page) => page.path !== "/");
  const combined: LegacyPage[] = [...byMenu];
  for (const candidate of fallback) {
    if (combined.find((item) => item.path === candidate.path)) continue;
    combined.push(candidate);
    if (combined.length >= 6) break;
  }
  return combined;
}

export function getLatestPages(content: SiteContent, limit = 9): LegacyPage[] {
  const candidates = content.pages.filter((page) => {
    const path = normalizePath(page.path);
    if (path === "/" || path === "/library") return false;
    if (path.startsWith("/category/")) return false;
    if (path.startsWith("/author/")) return false;
    return true;
  });

  const sorted = [...candidates].sort((a, b) => {
    const dateA = parseDate(a.updatedAt);
    const dateB = parseDate(b.updatedAt);
    if (dateA !== dateB) return dateB - dateA;
    return scorePage(b) - scorePage(a);
  });

  return sorted.slice(0, Math.max(1, limit));
}

export function getPageGroups(content: SiteContent) {
  const categoryCount = new Map<string, number>();
  for (const page of content.pages) {
    const key = String(page.category || "page");
    categoryCount.set(key, (categoryCount.get(key) || 0) + 1);
  }

  return [...categoryCount.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function pathToSlugParts(pathname: string): string[] {
  const path = normalizePath(pathname);
  if (path === "/") return [];
  return path.slice(1).split("/");
}

export function slugPartsToPath(parts: string[] | undefined): string {
  if (!parts || parts.length === 0) return "/";
  return normalizePath(`/${parts.join("/")}`);
}

export function normalizePath(pathLike: string): string {
  const value = String(pathLike || "").trim();
  if (!value) return "/";
  if (value === "/") return "/";
  const withSlash = value.startsWith("/") ? value : `/${value}`;
  return withSlash.endsWith("/") ? withSlash.slice(0, -1) : withSlash;
}

function sanitizeMenu(menu: { label: string; href: string }[], routes: Set<string>) {
  const out: { label: string; href: string }[] = [];
  for (const item of menu) {
    const label = cleanText(item.label);
    const href = cleanHref(item.href);
    if (!label || !href) continue;

    const key = `${label}::${href}`;
    if (out.find((entry) => `${entry.label}::${entry.href}` === key)) continue;

    const internal = internalPathFromHref(href);
    if (internal && !routes.has(internal)) continue;
    out.push({ label, href });
  }

  if (!out.find((item) => internalPathFromHref(item.href) === "/")) {
    out.unshift({ label: "Home", href: "/" });
  }

  return out;
}

function dedupePages(pages: LegacyPage[]) {
  const byPath = new Map<string, LegacyPage>();
  for (const source of pages || []) {
    const path = normalizePath(source.path);
    if (path.endsWith("/feed") || path.includes("/feed/")) continue;
    const normalized = normalizePage(source);
    normalized.path = path;

    const existing = byPath.get(path);
    if (!existing) {
      byPath.set(path, normalized);
      continue;
    }

    if (scorePage(normalized) > scorePage(existing)) {
      byPath.set(path, normalized);
    }
  }

  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function scorePage(page: LegacyPage) {
  let score = 0;
  score += page.text.length;
  if (page.heroImage) score += 150;
  if (page.updatedAt) score += 30;
  if (page.path === "/") score += 1000;
  return score;
}

function normalizePage(page: LegacyPage): LegacyPage {
  const rawText = cleanText(page.text);
  const fallbackHtml = rawText
    ? rawText
        .split(/(?<=\.)\s+(?=[A-Z])/)
        .slice(0, 32)
        .map((chunk) => `<p>${chunk}</p>`)
        .join("")
    : "<p>Fuer diese Seite liegt kein strukturierter Inhalt vor.</p>";

  return {
    ...page,
    id: String(page.id || ""),
    url: String(page.url || ""),
    path: normalizePath(page.path || "/"),
    title: cleanText(page.title),
    excerpt: cleanText(page.excerpt),
    text: rawText,
    html: String(page.html || "").trim() || fallbackHtml,
    heroImage: normalizeAsset(page.heroImage),
    updatedAt: String(page.updatedAt || ""),
    category: cleanText(page.category || "page").toLowerCase() || "page",
  };
}

function normalizeAsset(urlLike: string) {
  const raw = String(urlLike || "").trim();
  if (!raw) return "";
  if (raw.startsWith("/legacy-assets/")) return raw;
  try {
    const url = new URL(raw);
    if (typed.hostAllowList?.includes(url.hostname.toLowerCase())) {
      return `/legacy-assets/${url.hostname}${url.pathname}`;
    }
    return raw;
  } catch {
    return raw;
  }
}

function toInternalMenuItem(item: { label: string; href: string }): InternalMenuItem {
  const path = internalPathFromHref(item.href);
  return {
    label: item.label,
    href: item.href,
    path,
    external: path === null,
  };
}

function internalPathFromHref(href: string): string | null {
  const value = String(href || "").trim();
  if (!value) return null;
  if (value.startsWith("/")) return normalizePath(value);
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (!typed.hostAllowList?.includes(host)) return null;
    return normalizePath(url.pathname);
  } catch {
    return null;
  }
}

function cleanHref(value: string) {
  const href = String(value || "").trim();
  if (!href) return "";
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return href;
  if (href.startsWith("javascript:")) return "";
  if (href.startsWith("/")) return normalizePath(href);
  try {
    const u = new URL(href);
    u.hash = "";
    u.search = "";
    return u.toString();
  } catch {
    return "";
  }
}

function cleanText(value: string) {
  return repairMojibake(
    decodeEntities(String(value || ""))
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function decodeEntities(value: string) {
  return String(value || "")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function repairMojibake(input: string) {
  if (!/[\u00c3\u00c2]/.test(input)) return input;
  try {
    return Buffer.from(input, "latin1").toString("utf8");
  } catch {
    return input;
  }
}

function parseDate(value: string) {
  const normalized = String(value || "").trim();
  if (!normalized) return 0;
  const epoch = Date.parse(normalized);
  return Number.isNaN(epoch) ? 0 : epoch;
}
