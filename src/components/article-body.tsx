"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  html: string;
};

type ActiveImage = {
  src: string;
  alt: string;
};

export function ArticleBody({ html }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeImage, setActiveImage] = useState<ActiveImage | null>(null);

  const normalizedHtml = useMemo(() => sanitizeLegacyHtml(html), [html]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const clickHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!(target instanceof HTMLImageElement)) return;
      const source = target.getAttribute("src");
      if (!source) return;
      event.preventDefault();
      setActiveImage({
        src: source,
        alt: target.getAttribute("alt") || "Seitenbild",
      });
    };

    const images = root.querySelectorAll("img");
    images.forEach((image) => {
      image.loading = "lazy";
      image.classList.add("article-inline-image");
      image.setAttribute("decoding", "async");
    });

    root.addEventListener("click", clickHandler);
    return () => root.removeEventListener("click", clickHandler);
  }, [normalizedHtml]);

  useEffect(() => {
    if (!activeImage) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveImage(null);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [activeImage]);

  return (
    <>
      <div ref={containerRef} className="article-body" dangerouslySetInnerHTML={{ __html: normalizedHtml }} />

      {activeImage ? (
        <div className="lightbox-backdrop" role="dialog" aria-modal="true" onClick={() => setActiveImage(null)}>
          <button type="button" className="lightbox-close" onClick={() => setActiveImage(null)}>
            Schliessen
          </button>
          <div className="lightbox-frame" onClick={(event) => event.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activeImage.src} alt={activeImage.alt} className="lightbox-image" />
          </div>
        </div>
      ) : null}
    </>
  );
}

function sanitizeLegacyHtml(input: string) {
  const raw = String(input || "");
  if (!raw.trim()) return "";

  let html = raw;

  html = rewriteWpAssetUrls(html);

  // Remove executable/noisy blocks that are not needed in a static relaunch.
  html = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<!--([\s\S]*?)-->/g, "");

  // Drop legacy chrome/logo images that would pollute article content.
  html = html.replace(
    /<(a[^>]*>)?\s*<img[^>]*(mei[_-]?energy[_-]?logo|neu-mei[_-]?energy[_-]?logo|footer-logo|favicon)[^>]*>\s*(<\/a>)?/gi,
    "",
  );

  // Neutralize legacy inline layout that caused broken widths and giant blank areas.
  html = html
    .replace(/\sstyle=("[^"]*"|'[^']*')/gi, "")
    .replace(/\swidth=("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\sheight=("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\sdata-elementor-type=("[^"]*"|'[^']*')/gi, "")
    .replace(/\sdata-elementor-id=("[^"]*"|'[^']*')/gi, "")
    .replace(/\saria-hidden=("[^"]*"|'[^']*')/gi, "");

  // Remove empty wrappers and repeated blank paragraphs.
  html = html
    .replace(/<(p|div|span)>(\s|&nbsp;|<br\s*\/?\s*>)*<\/\1>/gi, "")
    .replace(/(<br\s*\/?\s*>\s*){3,}/gi, "<br /><br />");

  return html.trim();
}

function rewriteWpAssetUrls(source: string) {
  const hosts = ["meienergy.de", "www.meienergy.de"];
  const protocols = ["https", "http"];
  let html = source;

  for (const protocol of protocols) {
    for (const host of hosts) {
      const origin = `${protocol}://${host}`;
      const local = `/legacy-assets/${host}`;
      html = html
        .replaceAll(`src=\"${origin}/wp-content/`, `src=\"${local}/wp-content/`)
        .replaceAll(`href=\"${origin}/wp-content/`, `href=\"${local}/wp-content/`)
        .replaceAll(`data-src=\"${origin}/wp-content/`, `data-src=\"${local}/wp-content/`)
        .replaceAll(`data-lazy-src=\"${origin}/wp-content/`, `data-lazy-src=\"${local}/wp-content/`)
        .replaceAll(`${origin}/wp-content/`, `${local}/wp-content/`);
    }
  }

  return html;
}
