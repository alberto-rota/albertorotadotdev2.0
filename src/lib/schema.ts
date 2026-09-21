import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  absoluteUrl,
  productDescription,
  productPath,
  profileSameAs,
} from "@/lib/site";
import type { Product } from "@/components/site/types";

export function personSchema() {
  return {
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: SITE_NAME,
    url: SITE_URL,
    jobTitle: "PhD Candidate in Bioengineering",
    affiliation: {
      "@type": "CollegeOrUniversity",
      name: "Politecnico di Milano",
      url: "https://www.polimi.it/",
    },
    email: "mailto:alberto1.rota@polimi.it",
    sameAs: profileSameAs(),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_TITLE,
        description: SITE_DESCRIPTION,
        inLanguage: "en",
        publisher: { "@id": `${SITE_URL}/#person` },
      },
      personSchema(),
    ],
  };
}

export function productSchema(product: Product) {
  const path = productPath(product);
  const url = path ? absoluteUrl(path) : SITE_URL;
  const isResearch = product.tag === "research";
  const authors = (product.collaborators ?? []).map((c) => ({
    "@type": "Person",
    name: c.name,
    ...(c.href ? { url: c.href } : {}),
  }));

  return {
    "@context": "https://schema.org",
    "@type": isResearch ? "ScholarlyArticle" : "CreativeWork",
    "@id": `${url}#work`,
    url,
    name: product.title,
    headline: product.title,
    description: productDescription(product),
    image: product.thumbnail?.startsWith("http")
      ? product.thumbnail
      : absoluteUrl(product.thumbnail),
    author: [{ "@type": "Person", name: SITE_NAME, url: SITE_URL }, ...authors],
    ...(product.meta?.year ? { datePublished: product.meta.year } : {}),
    ...(product.meta?.venue ? { publisher: product.meta.venue } : {}),
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };
}
