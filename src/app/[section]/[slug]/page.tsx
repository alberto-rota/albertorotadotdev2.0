import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductArticle } from "@/components/site/ProductArticle";
import { JsonLd } from "@/components/site/JsonLd";
import type { SectionId } from "@/components/site/types";
import { productSchema } from "@/lib/schema";
import {
  INDEXABLE_SECTIONS,
  SITE_NAME,
  absoluteUrl,
  indexableProducts,
  productDescription,
  productPath,
} from "@/lib/site";

type Params = { section: string; slug: string };

function findProduct(section: string, slug: string) {
  return indexableProducts().find((p) => p.tag === section && p.slug === slug);
}

export function generateStaticParams() {
  return indexableProducts().map((p) => ({
    section: p.tag as string,
    slug: p.slug as string,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { section, slug } = await params;
  const product = findProduct(section, slug);
  if (!product) return {};
  const path = productPath(product) ?? `/${section}/${slug}`;
  const title = product.title;
  const description = productDescription(product);
  const image = product.thumbnail?.startsWith("http")
    ? product.thumbnail
    : absoluteUrl(product.thumbnail);

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      type: product.tag === "research" ? "article" : "website",
      url: absoluteUrl(path),
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [{ url: image, alt: `${product.title} cover` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [image],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { section, slug } = await params;
  if (!INDEXABLE_SECTIONS.includes(section as SectionId)) notFound();
  const product = findProduct(section, slug);
  if (!product) notFound();

  return (
    <>
      <JsonLd data={productSchema(product)} />
      <ProductArticle product={product} />
    </>
  );
}

export const dynamicParams = false;
