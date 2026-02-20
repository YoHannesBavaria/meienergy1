import { createClient } from "@sanity/client";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "wa2b6xby";
const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_MCP_TOKEN || process.env.SANITY_API_READ_TOKEN;

if (!token) {
  throw new Error("Missing Sanity token. Set SANITY_API_WRITE_TOKEN (or SANITY_MCP_TOKEN) before sync.");
}

const structurePath = path.resolve(__dirname, "../src/data/site-structure.json");
const raw = await readFile(structurePath, "utf8");
const structure = JSON.parse(raw);

const pages = dedupePages(structure.pages || []);
if (pages.length === 0) {
  console.log("No pages to sync.");
  process.exit(0);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2025-02-01",
  useCdn: false,
  token,
  perspective: "raw",
});

console.log(`Sync start: ${pages.length} pages -> ${projectId}/${dataset}`);

const batchSize = 25;
for (let i = 0; i < pages.length; i += batchSize) {
  const batch = pages.slice(i, i + batchSize);
  let tx = client.transaction();

  for (const page of batch) {
    tx = tx.createOrReplace(toLegacyDoc(page));
  }

  await tx.commit({ autoGenerateArrayKeys: true });
  console.log(`Synced ${Math.min(i + batch.length, pages.length)}/${pages.length}`);
}

console.log("Sanity sync complete.");

function dedupePages(input) {
  const map = new Map();
  for (const page of input) {
    const normalized = normalizePath(String(page?.path || "/"));
    if (normalized.endsWith("/feed") || normalized.includes("/feed/")) continue;

    const next = {
      id: String(page?.id || `legacy-${normalized}`),
      path: normalized,
      title: cleanText(String(page?.title || "Untitled")),
      excerpt: cleanText(String(page?.excerpt || "")),
      text: cleanText(String(page?.text || "")),
      category: cleanText(String(page?.category || "page")).toLowerCase() || "page",
      heroImage: String(page?.heroImage || "").trim(),
    };

    const existing = map.get(normalized);
    if (!existing || score(next) > score(existing)) {
      map.set(normalized, next);
    }
  }

  return [...map.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function score(page) {
  let value = page.text.length;
  if (page.heroImage) value += 150;
  if (page.path === "/") value += 1000;
  return value;
}

function toLegacyDoc(page) {
  const slugCurrent = page.path === "/" ? "home" : page.path.slice(1);
  return {
    _id: toDocId(page.path),
    _type: "legacyPage",
    title: page.title,
    routePath: page.path,
    path: {
      _type: "slug",
      current: slugCurrent,
    },
    excerpt: page.excerpt,
    category: page.category,
    body: toPortableText(page.text || page.excerpt || page.title),
    heroImageUrl: page.heroImage,
  };
}

function toDocId(pathname) {
  const path = normalizePath(pathname);
  if (path === "/") return "legacyPage.home";
  const normalized = path
    .slice(1)
    .toLowerCase()
    .replace(/[^a-z0-9/]+/g, "-")
    .replace(/\/+/, "/")
    .replace(/\//g, "-")
    .replace(/^-+|-+$/g, "");

  return `legacyPage.${normalized || "page"}`;
}

function toPortableText(value) {
  const parts = String(value || "")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 120);

  return parts.map((part, index) => ({
    _type: "block",
    _key: `p${index}`,
    style: "normal",
    markDefs: [],
    children: [
      {
        _type: "span",
        _key: `s${index}`,
        marks: [],
        text: part,
      },
    ],
  }));
}

function normalizePath(value) {
  const text = String(value || "").trim();
  if (!text || text === "/") return "/";
  const withSlash = text.startsWith("/") ? text : `/${text}`;
  return withSlash.endsWith("/") ? withSlash.slice(0, -1) : withSlash;
}

function cleanText(value) {
  return decodeEntities(String(value || ""))
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}
