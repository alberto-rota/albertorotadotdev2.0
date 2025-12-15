"use client";
import { HeroParallax } from "@/components/ui/hero-parallax";
import productsData from "@/data/products.json";

export default function HeroParallaxDemo() {
  return <HeroParallax products={products} />;
}

// Backwards-compatible: keep the same named export as before, but source it from JSON.
export const products = productsData as {
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
  tag?: "links" | "research" | "open-source" | "resources";
  row?: 1 | 2 | 3; // deprecated; kept for older data
  position?: number;
}[];


