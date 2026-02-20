import { createClient } from "@sanity/client";

export type SanityLegacyPage = {
  _id: string;
  title: string;
  path: string;
  excerpt?: string;
  body?: string;
  category?: string;
  heroImageUrl?: string;
};

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_READ_TOKEN;

export const sanityEnabled = Boolean(projectId && dataset);

const client = sanityEnabled
  ? createClient({
      projectId,
      dataset,
      apiVersion: "2025-02-01",
      useCdn: true,
      token,
      perspective: "published",
    })
  : null;

export async function fetchSanityLegacyPages(): Promise<SanityLegacyPage[]> {
  if (!client) return [];

  try {
    const rows = await client.fetch(`*[_type == "legacyPage"]{
      _id,
      title,
      "path": select(defined(path.current) => path.current, "/"),
      excerpt,
      category,
      "heroImageUrl": heroImage.asset->url,
      body
    }`);

    if (!Array.isArray(rows)) return [];
    return rows.map((row) => ({
      _id: String(row?._id || ""),
      title: String(row?.title || "Untitled"),
      path: normalizePath(String(row?.path || "/")),
      excerpt: row?.excerpt ? String(row.excerpt) : undefined,
      category: row?.category ? String(row.category) : undefined,
      heroImageUrl: row?.heroImageUrl ? String(row.heroImageUrl) : undefined,
      body: row?.body ? stringifyPortableText(row.body) : undefined,
    }));
  } catch {
    return [];
  }
}

function stringifyPortableText(value: unknown) {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";

  return value
    .map((block) => {
      if (!block || typeof block !== "object") return "";
      const children = (block as { children?: unknown[] }).children;
      if (!Array.isArray(children)) return "";

      return children
        .map((child) => {
          if (!child || typeof child !== "object") return "";
          const text = (child as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        })
        .join("");
    })
    .join("\n\n")
    .trim();
}

function normalizePath(pathLike: string): string {
  const value = String(pathLike || "").trim();
  if (!value || value === "/") return "/";
  const withSlash = value.startsWith("/") ? value : `/${value}`;
  return withSlash.endsWith("/") ? withSlash.slice(0, -1) : withSlash;
}
