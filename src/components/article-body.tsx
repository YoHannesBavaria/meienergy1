"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  html: string;
};

type ActiveImage = {
  src: string;
  alt: string;
};

const HOST = "https://meienergy.de";

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
      if (isDecorativeImage(image.getAttribute("src") || "")) {
        image.closest("figure")?.remove();
        image.remove();
      }
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

  html = normalizeAssetUrls(html);

  html = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<!--([\s\S]*?)-->/g, "");

  html = html
    .replace(/\sstyle=("[^"]*"|'[^']*')/gi, "")
    .replace(/\swidth=("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\sheight=("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\sdata-elementor-type=("[^"]*"|'[^']*')/gi, "")
    .replace(/\sdata-elementor-id=("[^"]*"|'[^']*')/gi, "")
    .replace(/\saria-hidden=("[^"]*"|'[^']*')/gi, "");

  html = html
    .replace(/<(p|div|span)>(\s|&nbsp;|<br\s*\/?\s*>)*<\/\1>/gi, "")
    .replace(/(<br\s*\/?\s*>\s*){3,}/gi, "<br /><br />")
    .replace(/<img[^>]*(mei[_-]?energy[_-]?logo|neu-mei[_-]?energy[_-]?logo|footer-logo|favicon)[^>]*>/gi, "");

  return html.trim();
}

function normalizeAssetUrls(source: string) {
  let html = source;

  html = html
    .replace(/="\/\/(www\.)?meienergy\.de\//gi, `="${HOST}/`)
    .replace(/='\/\/(www\.)?meienergy\.de\//gi, `='${HOST}/`)
    .replace(/="\/wp-content\//gi, `="${HOST}/wp-content/`)
    .replace(/='\/wp-content\//gi, `='${HOST}/wp-content/`);

  html = html.replace(/srcset=("[^"]*"|'[^']*')/gi, (full, quotedValue) => {
    const quote = quotedValue.startsWith("'") ? "'" : '"';
    const value = quotedValue.slice(1, -1);
    const normalized = value
      .split(",")
      .map((entry: string) => {
        const parts = entry.trim().split(/\s+/);
        if (parts.length === 0) return "";
        const [url, descriptor] = parts;
        const normalizedUrl = normalizeOneUrl(url || "");
        return descriptor ? `${normalizedUrl} ${descriptor}` : normalizedUrl;
      })
      .filter(Boolean)
      .join(", ");

    return `srcset=${quote}${normalized}${quote}`;
  });

  html = html.replace(/(?:src|href|data-src|data-lazy-src)=("[^"]*"|'[^']*')/gi, (full, quotedValue) => {
    const quote = quotedValue.startsWith("'") ? "'" : '"';
    const value = quotedValue.slice(1, -1);
    const normalized = normalizeOneUrl(value);
    return full.replace(quotedValue, `${quote}${normalized}${quote}`);
  });

  return html;
}

function normalizeOneUrl(value: string) {
  const url = String(value || "").trim();
  if (!url) return url;
  if (url.startsWith("data:")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/wp-content/")) return `${HOST}${url}`;
  return url;
}

function isDecorativeImage(source: string) {
  const value = String(source || "").toLowerCase();
  if (!value) return false;
  return /(logo|favicon|submit-spin|borlabs|wpforms-lite|elementor|award\.png)/i.test(value);
}
