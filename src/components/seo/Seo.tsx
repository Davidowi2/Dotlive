import { useEffect } from "react";

export interface SeoProps {
  /** Document title. Falls back to current if omitted. */
  title?: string;
  /** Meta description. Overrides description + og:description + twitter:description. */
  description?: string;
  /** Absolute or root-relative image URL for og:image + twitter:image. */
  ogImage?: string;
  /** Open Graph type. Defaults to "website". */
  type?: "website" | "article";
  /** Canonical URL (optional). Sets <link rel="canonical">. */
  canonical?: string;
  /**
   * Optional path used to build the page <title>. When provided, the rendered
   * title becomes `${title} — DOT` so the brand is consistent across pages.
   */
  titleSuffix?: boolean;
}

/**
 * Lightweight client-side SEO helper. Mutates document.head so that
 * title and meta tags stay in sync with the current page. Safe to use
 * alongside TanStack Start's `head()` SSR config — values here simply
 * mirror/reinforce what the route exported, with a consistent brand
 * suffix and og tags.
 *
 * No new dependency — we touch document.head directly.
 */
export function Seo({
  title,
  description,
  ogImage,
  type = "website",
  canonical,
  titleSuffix = true,
}: SeoProps) {
  useEffect(() => {
    if (title) {
      document.title = titleSuffix && !/— DOT$/.test(title) ? `${title} — DOT` : title;
    }

    if (description) {
      upsertMeta('meta[name="description"]', "content", description, { name: "description" });
      upsertMeta('meta[property="og:description"]', "content", description, {
        property: "og:description",
      });
      upsertMeta('meta[name="twitter:description"]', "content", description, {
        name: "twitter:description",
      });
    }

    if (title) {
      const full = titleSuffix && !/— DOT$/.test(title) ? `${title} — DOT` : title;
      upsertMeta('meta[property="og:title"]', "content", full, { property: "og:title" });
      upsertMeta('meta[name="twitter:title"]', "content", full, { name: "twitter:title" });
    }

    upsertMeta('meta[property="og:type"]', "content", type, { property: "og:type" });

    if (ogImage) {
      upsertMeta('meta[property="og:image"]', "content", ogImage, { property: "og:image" });
      upsertMeta('meta[name="twitter:image"]', "content", ogImage, { name: "twitter:image" });
    }

    if (canonical) {
      upsertLink('link[rel="canonical"]', canonical);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, ogImage, type, canonical, titleSuffix]);

  return null;
}

/* ─────────────────────── internals ─────────────────────────── */

function upsertMeta(selector: string, attr: string, value: string, base: Record<string, string>) {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    for (const [k, v] of Object.entries(base)) el.setAttribute(k, v);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function upsertLink(selector: string, href: string) {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}
