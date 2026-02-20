import { notFound } from "next/navigation";
import { PageView } from "@/components/page-view";
import { getPageByPath, getSiteContent, pathToSlugParts, slugPartsToPath } from "@/lib/content";

type Props = {
  params: Promise<{ slug?: string[] }>;
};

export async function generateStaticParams() {
  const content = await getSiteContent();
  return content.routes
    .filter((route) => route !== "/" && route !== "/library" && route !== "/cookie" && route !== "/datenschutz")
    .map((route) => ({ slug: pathToSlugParts(route) }));
}

export default async function DynamicPage({ params }: Props) {
  const { slug } = await params;
  const pathname = slugPartsToPath(slug);
  if (pathname === "/library") return notFound();

  const content = await getSiteContent();
  const page = getPageByPath(pathname, content);
  if (!page) return notFound();

  return <PageView page={page} content={content} />;
}
