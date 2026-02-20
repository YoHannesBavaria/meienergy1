import structure from "@/data/site-structure.json";
import { fetchSanityLegacyPages, sanityEnabled } from "@/lib/sanity";
import type { InternalMenuItem, LegacyPage, LegacySiteStructure, SiteContent } from "@/types/content";

const typed = structure as LegacySiteStructure;

const DEFAULT_FALLBACK_IMAGE = "/legacy-assets/meienergy.de/wp-content/uploads/2021/08/Sauna-Bild.jpg";
const FALLBACK_BY_PATH: Record<string, string> = {
  "/": "/legacy-assets/meienergy.de/wp-content/uploads/2022/08/8-Hantelbild.jpg",
  "/kontakt": "/legacy-assets/meienergy.de/wp-content/uploads/2024/02/98a52de0-245b-4036-9303-8bc455932baf-scaled.jpg",
  "/galerie": "/legacy-assets/meienergy.de/wp-content/uploads/2022/08/8-Hantelbild.jpg",
  "/feedback": "/legacy-assets/meienergy.de/wp-content/uploads/2020/07/author-1-1.jpg",
  "/kursuebersicht": "/legacy-assets/meienergy.de/wp-content/uploads/2020/07/news-10.jpg",
  "/werde-mitglied": "/legacy-assets/meienergy.de/wp-content/uploads/2020/07/news-9.jpg",
  "/unsere-angebote": "/legacy-assets/meienergy.de/wp-content/uploads/2020/07/news-8.jpg",
  "/faq": "/legacy-assets/meienergy.de/wp-content/uploads/2020/07/faq.png",
  "/faqs": "/legacy-assets/meienergy.de/wp-content/uploads/2020/07/faq.png",
};

const BLOCKED_IMAGE_PATTERNS = [
  /logo/i,
  /favicon/i,
  /submit-spin/i,
  /spinner/i,
  /borlabs/i,
  /award\.png/i,
  /g-point/i,
  /alex-pfeiffer/i,
  /faq\.png/i,
  /wpforms-lite/i,
  /elementor/i,
  /plugins\//i,
];

const HOME_FEATURE_PATHS = [
  "/ueber-uns",
  "/faqs",
  "/meienergy-team",
  "/kursuebersicht",
  "/feedback",
  "/werde-mitglied",
];

export async function getSiteContent(): Promise<SiteContent> {
  const basePages = applyAliases(dedupePages(typed.pages || []));
  const pages = await mergeSanityContent(basePages);
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
    sourceLabel: sanityEnabled ? "Sanity Live-Inhalte" : "Legacy-Inhalte lokal eingebettet",
    hostAllowList: (typed.hostAllowList || []).map((item) => String(item || "").toLowerCase()),
    menu,
    menuItems,
    pages,
    routes,
  };
}

async function mergeSanityContent(basePages: LegacyPage[]) {
  if (!sanityEnabled) return basePages;

  const sanityRows = await fetchSanityLegacyPages();
  if (sanityRows.length === 0) return basePages;

  const byPath = new Map<string, LegacyPage>();
  for (const page of basePages) {
    byPath.set(normalizePath(page.path), page);
  }

  for (const row of sanityRows) {
    const path = normalizePath(row.path || "/");
    const existing = byPath.get(path);
    const bodyText = cleanText(row.body || "");
    const bodyHtml = bodyText ? textToParagraphHtml(bodyText) : "";
    const hero = normalizeAsset(row.heroImageUrl || "");

    if (existing) {
      const merged: LegacyPage = {
        ...existing,
        title: cleanText(row.title || existing.title),
        excerpt: cleanText(row.excerpt || existing.excerpt),
        text: bodyText || existing.text,
        html: bodyHtml || existing.html,
        heroImage: hero || existing.heroImage,
        contentImages: extractImageCandidatesFromHtml(bodyHtml || existing.html).filter((value) => isUsefulContentImage(value)),
        category: cleanText(row.category || existing.category).toLowerCase() || existing.category,
      };
      merged.heroImage = selectBestHeroImage(merged.path, merged.heroImage, merged.contentImages || []);
      byPath.set(path, merged);
      continue;
    }

    const created: LegacyPage = {
      id: String(row._id || `sanity-${path}`),
      url: `${typed.source || "https://meienergy.de"}${path}`,
      path,
      title: cleanText(row.title || "Untitled"),
      excerpt: cleanText(row.excerpt || ""),
      text: bodyText,
      html: bodyHtml || "<p>Sanity content page.</p>",
      heroImage: hero,
      contentImages: extractImageCandidatesFromHtml(bodyHtml || "").filter((value) => isUsefulContentImage(value)),
      updatedAt: "",
      category: cleanText(row.category || "page").toLowerCase() || "page",
    };

    created.heroImage = selectBestHeroImage(created.path, created.heroImage, created.contentImages || []);
    byPath.set(path, created);
  }

  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
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
      heroImage: FALLBACK_BY_PATH["/"],
      updatedAt: "",
      category: "home",
    }
  );
}

export function getFeaturedPages(content: SiteContent): LegacyPage[] {
  const byPriority = HOME_FEATURE_PATHS.map((path) => getPageByPath(path, content))
    .filter((page): page is LegacyPage => page !== null);

  if (byPriority.length >= 6) return byPriority.slice(0, 6);

  const menuPaths = content.menuItems
    .map((item) => item.path)
    .filter((path): path is string => Boolean(path))
    .filter((path) => path !== "/");

  const byMenu = menuPaths
    .map((path) => getPageByPath(path, content))
    .filter((page): page is LegacyPage => page !== null);

  const fallback = content.pages.filter((page) => page.path !== "/");
  const combined: LegacyPage[] = [...byPriority, ...byMenu];
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
    if (path.includes("/page/")) return false;
    if (path.startsWith("/category/")) return false;
    if (path.startsWith("/author/")) return false;
    if (path.startsWith("/tag/")) return false;
    if (path.startsWith("/team-cat/")) return false;
    if (path.startsWith("/project-cat/")) return false;
    if (path.startsWith("/service-cat/")) return false;
    if (path.startsWith("/stars_testimonial_cat/")) return false;
    if (path.startsWith("/timetable/")) return false;
    if (cleanText(page.excerpt || page.text).length < 48) return false;
    return true;
  });

  const sorted = [...candidates].sort((a, b) => {
    const dateA = parseDate(a.updatedAt);
    const dateB = parseDate(b.updatedAt);
    if (dateA !== dateB) return dateB - dateA;
    return scorePage(b) - scorePage(a);
  });

  const selected: LegacyPage[] = [];
  const usedPaths = new Set<string>();
  const usedImages = new Set<string>();

  for (const page of sorted) {
    const imageKey = getImageFingerprint(page);
    if (usedPaths.has(page.path)) continue;
    if (imageKey && usedImages.has(imageKey) && selected.length < limit) continue;
    selected.push(page);
    usedPaths.add(page.path);
    if (imageKey) usedImages.add(imageKey);
    if (selected.length >= limit) return selected;
  }

  for (const page of sorted) {
    if (usedPaths.has(page.path)) continue;
    selected.push(page);
    usedPaths.add(page.path);
    if (selected.length >= limit) return selected;
  }

  return selected;
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
  score += (page.contentImages || []).length * 25;
  if (page.updatedAt) score += 30;
  if (page.path === "/") score += 1000;
  return score;
}

function normalizePage(page: LegacyPage): LegacyPage {
  const rawText = cleanText(page.text);
  const rawHtml = String(page.html || "").trim();
  const fallbackHtml = rawText
    ? rawText
        .split(/(?<=\.)\s+(?=[A-Z])/)
        .slice(0, 32)
        .map((chunk) => `<p>${chunk}</p>`)
        .join("")
    : "<p>Fuer diese Seite liegt kein strukturierter Inhalt vor.</p>";

  const normalizedPath = normalizePath(page.path || "/");

  const normalized: LegacyPage = {
    ...page,
    id: String(page.id || ""),
    url: String(page.url || ""),
    path: normalizedPath,
    title: cleanText(page.title),
    excerpt: cleanText(page.excerpt),
    text: rawText,
    html: rawHtml || fallbackHtml,
    heroImage: "",
    contentImages: [],
    updatedAt: String(page.updatedAt || ""),
    category: cleanText(page.category || "page").toLowerCase() || "page",
  };

  normalized.contentImages = extractImageCandidatesFromHtml(normalized.html).filter((value) => isUsefulContentImage(value));
  normalized.heroImage = selectBestHeroImage(normalizedPath, page.heroImage, normalized.contentImages);
  return normalized;
}

function selectBestHeroImage(pathname: string, heroImage: string, contentImages: string[]) {
  const path = normalizePath(pathname);
  const candidates = [normalizeAsset(heroImage), ...(contentImages || [])].filter(Boolean);
  const best = [...candidates]
    .filter((candidate) => isUsefulContentImage(candidate))
    .sort((a, b) => imageCandidateScore(b) - imageCandidateScore(a))[0];
  if (best) return best;

  return FALLBACK_BY_PATH[path] || DEFAULT_FALLBACK_IMAGE;
}

function extractImageCandidatesFromHtml(html: string) {
  const source = String(html || "");
  if (!source) return [];

  const out: string[] = [];
  const push = (value: string) => {
    const normalized = normalizeAsset(value);
    if (!normalized) return;
    if (out.includes(normalized)) return;
    out.push(normalized);
  };

  for (const match of source.matchAll(/(?:src|data-src|data-lazy-src)=["']([^"']+)["']/gi)) {
    push(String(match[1] || ""));
  }

  for (const match of source.matchAll(/srcset=["']([^"']+)["']/gi)) {
    const set = String(match[1] || "").split(",");
    for (const entry of set) {
      const url = entry.trim().split(/\s+/)[0];
      push(url);
    }
  }

  return out;
}

function isUsefulContentImage(urlLike: string) {
  return imageCandidateScore(urlLike) > 0;
}

function normalizeAsset(urlLike: string) {
  const raw = String(urlLike || "").trim();
  if (!raw) return "";
  if (raw.startsWith("data:")) return "";

  if (raw.startsWith("//")) {
    return normalizeAsset(`https:${raw}`);
  }

  if (raw.startsWith("/wp-content/")) {
    return `https://meienergy.de${raw}`;
  }

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

function imageCandidateScore(urlLike: string) {
  const value = String(urlLike || "").trim().toLowerCase();
  if (!value) return -1000;
  if (value.startsWith("data:")) return -1000;
  if (BLOCKED_IMAGE_PATTERNS.some((pattern) => pattern.test(value))) return -1000;

  let score = 0;
  if (value.includes("/wp-content/uploads/") || value.includes("/legacy-assets/")) score += 40;
  if (/\.(png|jpe?g|webp|avif|gif)(\?|$)/i.test(value)) score += 25;
  if (/2024|2023|2022|2021|2020/.test(value)) score += 6;
  if (/news|author|sauna|hantel|kurs|team|fitness|galerie|member|angebot|kontakt/.test(value)) score += 8;
  if (/scaled|crop|thumbnail|150x150|100x100|64x64|32x32/.test(value)) score -= 16;
  return score;
}

function getImageFingerprint(page: LegacyPage) {
  const candidates = [page.heroImage, ...(page.contentImages || [])];
  for (const candidate of candidates) {
    const normalized = normalizeAsset(candidate);
    if (!normalized) continue;
    if (!isUsefulContentImage(normalized)) continue;
    return normalized.toLowerCase();
  }
  return "";
}

function textToParagraphHtml(value: string) {
  return String(value || "")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p>${escapeHtml(part)}</p>`)
    .join("");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
