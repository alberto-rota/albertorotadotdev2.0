"use client";
import { HeroParallax, type HeroParallaxAnnouncement } from "@/components/ui/hero-parallax";
import productsData from "@/data/products.json";

export default function HeroParallaxDemo() {
  return (
    <HeroParallax
      products={products}
      sections={sections}
      announcements={announcements}
    />
  );
}

type HeroParallaxSectionId = "links" | "research" | "open-source" | "resources" | "designs";

type Product = {
  title: string;
  description?: string;
  link: string;
  thumbnail?: string;
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
  announcements?: unknown[];
  products: Product[];
};

type ProductsJsonV1 = Product[];

function parseProductsJson(input: unknown): {
  products: Product[];
  sections?: Partial<Record<HeroParallaxSectionId, SectionConfig>>;
  announcements?: unknown[];
} {
  if (Array.isArray(input)) {
    return { products: input as ProductsJsonV1 };
  }

  if (input && typeof input === "object") {
    const maybe = input as Partial<ProductsJsonV2>;
    if (Array.isArray(maybe.products)) {
      return {
        products: maybe.products,
        sections: maybe.sections,
        announcements: maybe.announcements,
      };
    }
  }

  return { products: [] };
}

const parsed = parseProductsJson(productsData as unknown);

// Validate that all product tags correspond to available section names
const validTags: HeroParallaxSectionId[] = ["links", "research", "open-source", "resources", "designs"];

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // Validate section names in config
  if (parsed.sections) {
    const sectionKeys = Object.keys(parsed.sections);
    sectionKeys.forEach((key) => {
      if (!validTags.includes(key as HeroParallaxSectionId)) {
        console.warn(
          `Section "${key}" in config is not a valid section name. ` +
          `Valid section names are: ${validTags.join(", ")}.`
        );
      }
    });
  }

  // Validate product tags
  parsed.products.forEach((product, index) => {
    if (product.tag && !validTags.includes(product.tag)) {
      console.warn(
        `Product at index ${index} (${product.title || "untitled"}) has invalid tag "${product.tag}". ` +
        `Valid tags are: ${validTags.join(", ")}. ` +
        `This product may not be displayed correctly.`
      );
    }
    if (!product.tag && !product.row) {
      console.warn(
        `Product at index ${index} (${product.title || "untitled"}) has no tag or row. ` +
        `It will be assigned to a section using fallback logic.`
      );
    }
  });
}

// Backwards-compatible: keep the same named exports as before.
export const products = parsed.products;
export const sections = parsed.sections;
export const announcements =
  parsed.announcements as HeroParallaxAnnouncement[];


