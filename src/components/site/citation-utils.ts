import type { Product, ProductDetails } from "./types";

/** Resolve a citation reference to a public URL under `/bibtex/`. */
export function resolveCitationPath(citation: string): string {
  if (citation.startsWith("/")) return citation;
  const base = citation.replace(/\.(txt|bib)$/i, "");
  return `/bibtex/${base}.bib`;
}

export function getCitationPath(
  product: Product,
  details?: ProductDetails
): string | null {
  const raw = details?.citation;
  if (!raw) return null;
  return resolveCitationPath(raw);
}
