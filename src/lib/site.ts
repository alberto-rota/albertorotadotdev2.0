import { loadSiteData } from "@/components/site/data";
import type { Product, SectionId } from "@/components/site/types";

export const SITE_URL = "https://www.albertorota.dev";
export const SITE_NAME = "Alberto Rota";
export const SITE_TITLE =
  "Alberto Rota — Surgical Robotics, Medical AI, and Open Source";
export const SITE_DESCRIPTION =
  "PhD candidate in Bioengineering at Politecnico di Milano. Research, open-source tools, and visual systems for surgical robotics and medical AI.";

/** Sections that get their own indexable URLs. */
export const INDEXABLE_SECTIONS: SectionId[] = [
  "research",
  "terminal-tools",
  "vsc-extensions",
  "designs",
];

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path.replace(/^http:\/\//i, "https://");
  const trimmed = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${trimmed}`;
}

export function productPath(product: Product): string | null {
  if (!product.slug || !product.tag) return null;
  if (!INDEXABLE_SECTIONS.includes(product.tag)) return null;
  return `/${product.tag}/${product.slug}`;
}

export function productDescription(product: Product): string {
  const fromDetails = product.details?.body?.split(/\n\s*\n/)[0]?.trim();
  const text =
    product.description?.trim() ||
    product.subtitle?.trim() ||
    fromDetails ||
    `${product.title} by ${SITE_NAME}.`;
  return text.length > 320 ? `${text.slice(0, 317)}…` : text;
}

export function indexableProducts(products: Product[] = loadSiteData().products): Product[] {
  return products.filter((p) => productPath(p));
}

export function relatedProducts(product: Product, limit = 4): Product[] {
  return indexableProducts()
    .filter((p) => p.slug !== product.slug && p.tag === product.tag)
    .slice(0, limit);
}

export function profileSameAs(): string[] {
  const data = loadSiteData();
  const fromProducts = data.products
    .filter((p) => p.tag === "resources" && p.link && p.link.startsWith("https://"))
    .map((p) => p.link as string);
  const fromContacts = data.contacts
    .map((c) => c.href)
    .filter((href): href is string => Boolean(href?.startsWith("https://")));
  return Array.from(new Set([...fromProducts, ...fromContacts]));
}
