import { useEffect } from 'react';

interface SEOOptions {
  title: string;
  description?: string;
  /** Absolute canonical URL for the page, e.g. https://www.taskmint.click/blog */
  canonical?: string;
}

function setMeta(selector: string, attr: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    const [, name] = selector.match(/\[(?:name|property)="([^"]+)"/) || [];
    if (selector.includes('property=')) el.setAttribute('property', name);
    else el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

/**
 * Lightweight per-page SEO: sets document.title, the meta description,
 * the canonical link and the matching Open Graph / Twitter tags.
 */
export function useSEO({ title, description, canonical }: SEOOptions) {
  useEffect(() => {
    document.title = title;
    setMeta('meta[name="description"]', 'content', description ?? '');
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[name="twitter:title"]', 'content', title);
    if (description) {
      setMeta('meta[property="og:description"]', 'content', description);
      setMeta('meta[name="twitter:description"]', 'content', description);
    }
    if (canonical) {
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical);
      setMeta('meta[property="og:url"]', 'content', canonical);
    }
  }, [title, description, canonical]);
}
