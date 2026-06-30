import type { DetailSection, Product, ProductAction, ProductDetails } from "./types";

/** Paper / PDF action from product links. */
export function getPaperAction(product: Product): ProductAction | undefined {
  return product.actions?.find(
    (a) =>
      a.href &&
      (a.label?.toLowerCase() === "paper" ||
        a.icon === "FileText" ||
        /\.pdf(?:$|[?#])/i.test(a.href))
  );
}

/** Normalize a PDF path from JSON (local or absolute URL). */
export function normalizePdfUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
    return url;
  }
  return `/${url}`;
}

/** DOI + PDF links for the Paper morph button. */
export function getPaperLinks(
  product: Product,
  details?: ProductDetails
): { doi?: string; pdf?: string } {
  const paper = getPaperAction(product);

  const doi =
    details?.doi ??
    paper?.doi ??
    (paper?.href && /doi\.org|arxiv\.org\/abs/i.test(paper.href) ? paper.href : undefined);

  let pdf = details?.pdf ? normalizePdfUrl(details.pdf) : undefined;
  pdf = pdf ?? (paper?.pdf ? normalizePdfUrl(paper.pdf) : undefined);

  if (!pdf && paper?.href) {
    const resolved = resolvePdfUrl(paper.href);
    if (resolved) pdf = resolved;
    else if (isDirectPdfUrl(paper.href)) pdf = paper.href;
  }

  return { doi, pdf };
}

export function hasPaperMorph(product: Product, details?: ProductDetails): boolean {
  const { doi, pdf } = getPaperLinks(product, details);
  return Boolean(doi && pdf);
}

/** @deprecated Inline viewer removed — use getPaperLinks instead. */
export function getProductPdfUrl(
  product: Product,
  details?: ProductDetails
): string | null {
  return getPaperLinks(product, details).pdf ?? null;
}

export function isDirectPdfUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      /\.pdf$/i.test(parsed.pathname) ||
      parsed.searchParams.get("format") === "pdf"
    );
  } catch {
    return /\.pdf(?:$|[?#])/i.test(url);
  }
}

/** Resolve a viewer-friendly PDF URL when possible (arXiv abstract → PDF, etc.). */
export function resolvePdfUrl(url: string): string | null {
  if (isDirectPdfUrl(url)) return url;

  const arxivAbs = url.match(/arxiv\.org\/abs\/([\d.]+(?:v\d+)?)/i);
  if (arxivAbs) return `https://arxiv.org/pdf/${arxivAbs[1]}.pdf`;

  const arxivOld = url.match(/arxiv\.org\/(?:pdf|ftp)\/([\d.]+(?:v\d+)?)/i);
  if (arxivOld) return `https://arxiv.org/pdf/${arxivOld[1]}.pdf`;

  return null;
}

export function splitPaperBody(body: string): { abstract: string; sections: string[] } {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length <= 1) {
    return { abstract: paragraphs[0] ?? "", sections: [] };
  }

  return {
    abstract: paragraphs[0] ?? "",
    sections: paragraphs.slice(1),
  };
}

/** Build research sections from legacy `body` + `highlights` when `sections` is omitted. */
export function buildLegacyResearchSections(details?: ProductDetails): DetailSection[] {
  if (!details) return [];

  const body = details.body ?? "";
  if (!body && (!details.highlights || details.highlights.length === 0)) return [];

  const { abstract, sections } = splitPaperBody(body);
  const result: DetailSection[] = [];

  if (abstract) {
    result.push({
      title: "Abstract",
      blocks: [{ type: "paragraph", text: abstract }],
    });
  }

  if (details.highlights && details.highlights.length > 0) {
    result.push({
      title: "Key Contributions",
      blocks: [{ type: "list", items: details.highlights }],
    });
  }

  if (sections.length > 0) {
    result.push({
      title: "Overview",
      blocks: sections.map((text) => ({ type: "paragraph" as const, text })),
    });
  }

  return result;
}

export function getResearchSections(
  details?: ProductDetails,
  fallbackBody?: string
): DetailSection[] {
  if (details?.sections && details.sections.length > 0) {
    return details.sections;
  }
  return buildLegacyResearchSections({
    ...details,
    body: details?.body ?? fallbackBody,
  });
}
