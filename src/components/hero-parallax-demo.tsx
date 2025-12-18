"use client";
import { HeroParallax } from "@/components/ui/hero-parallax";
import productsData from "@/data/products.json";

export default function HeroParallaxDemo() {
  return <HeroParallax products={products} sections={sections} />;
}

type HeroParallaxSectionId = "links" | "research" | "open-source" | "resources";

type Product = {
  title: string;
  description?: string;
  link: string;
  thumbnail: string;
  aspectRatio?: string | number;
  icon?: string;
  borderColor?: string;
  actions?: Array<{
    label?: string;
    href: string;
    icon: string;
    ariaLabel?: string;
  }>;
  tag?: HeroParallaxSectionId;
  row?: 1 | 2 | 3; // deprecated; kept for older data
  position?: number;
};

type SectionConfig = {
  /**
   * Horizontal gap between cards in px (mobile/default).
   * Previous default: 40px (Tailwind `gap-10`).
   */
  gapPx?: number;
  /**
   * Horizontal gap between cards in px at `md` breakpoint and above.
   * Previous default: 80px (Tailwind `md:gap-20`).
   */
  gapMdPx?: number;
  /**
   * Initial horizontal scroll offset (in px) for the section.
   * Positive/negative values are allowed.
   */
  initialScrollPx?: number;
};

type ProductsJsonV2 = {
  sections?: Partial<Record<HeroParallaxSectionId, SectionConfig>>;
  products: Product[];
};

type ProductsJsonV1 = Product[];

function parseProductsJson(input: unknown): {
  products: Product[];
  sections?: Partial<Record<HeroParallaxSectionId, SectionConfig>>;
} {
  if (Array.isArray(input)) {
    return { products: input as ProductsJsonV1 };
  }

  if (input && typeof input === "object") {
    const maybe = input as Partial<ProductsJsonV2>;
    if (Array.isArray(maybe.products)) {
      return { products: maybe.products, sections: maybe.sections };
    }
  }

  return { products: [] };
}

const parsed = parseProductsJson(productsData as unknown);

// Backwards-compatible: keep the same named export as before.
export const products = parsed.products;
export const sections = parsed.sections;


