import type { MetadataRoute } from "next";
import { loadSiteData } from "@/components/site/data";
import { SITE_URL, productPath } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const data = loadSiteData();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  for (const product of data.products) {
    const path = productPath(product);
    if (!path) continue;
    entries.push({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: product.tag === "research" ? 0.9 : 0.7,
    });
  }

  return entries;
}
