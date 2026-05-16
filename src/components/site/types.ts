export type SectionId = "research" | "open-source" | "resources" | "designs";

export type ProductAction = {
  label?: string;
  href?: string;
  /** Lucide icon name (e.g. "Github") or image path (e.g. "/icon.png"). */
  icon?: string;
  ariaLabel?: string;
};

export type ProductMedia = {
  type: "image" | "video" | "embed";
  src: string;
  caption?: string;
  alt?: string;
  poster?: string;
};

export type ProductDetails = {
  body?: string;
  highlights?: string[];
  media?: ProductMedia[];
};

export type Product = {
  /** Stable id used to look up custom detail components. */
  slug?: string;
  title: string;
  subtitle?: string;
  description?: string;
  link?: string;
  thumbnail: string;
  /** Optional small icon shown next to the title. */
  icon?: string;
  /** CSS color used as the card accent (border, glow, tag color). */
  accent?: string;
  /** Tag chips shown in the card / detail. */
  tech?: string[];
  /** Optional metadata block (venue, year, authors, ...). */
  meta?: Record<string, string>;
  /** Pill buttons displayed in the card overlay and detail panel. */
  actions?: ProductAction[];
  tag?: SectionId;
  /** Compact "logo only" rendering in the resources row. */
  compact?: boolean;
  /**
   * Aspect ratio for the card thumbnail. Examples: "5/6" (portrait, default),
   * "1/1" (square), "16/9" (wide), "9/16" (tall mobile screenshot).
   * When omitted, the card uses the section default.
   */
  cardAspect?: string;
  /**
   * How the thumbnail should be fit into the card.
   * - "cover" (default): fill and crop.
   * - "contain": fit the entire image (no crop). Use for wide screenshots you do not want cropped.
   */
  cardFit?: "cover" | "contain";
  /** Rich detail payload shown in the side / bottom sheet. */
  details?: ProductDetails;
  /**
   * Optional slug of a custom detail component registered in
   * `src/components/site/detail-components/registry.ts`.
   * Renders inside the detail panel after the standard `details` block.
   */
  detailComponent?: string;
};

export type SectionConfig = {
  title?: string;
  subtitle?: string;
  order?: number;
  /** "default" = image cards, "compact" = small square logos. */
  layout?: "default" | "compact";
  /** Default card aspect for products in this section (e.g. "2/3"). */
  cardAspect?: string;
  /** Default thumbnail fit for products in this section. */
  cardFit?: "cover" | "contain";
};

export type Announcement = {
  enabled?: boolean;
  /** Small uppercase pill shown at top of the banner. */
  label?: string;
  /** Headline. */
  title?: string;
  /** Body text. Supports a tiny HTML subset: <b>, <i>, <u>, <a href>. */
  body?: string;
  /** Optional dates / location lines. */
  dates?: string;
  location?: string;
  /** CTA buttons. */
  actions?: ProductAction[];
};

export type HeroConfig = {
  tagline?: string;
};

export type SiteData = {
  hero?: HeroConfig;
  announcement?: Announcement;
  sections: Partial<Record<SectionId, SectionConfig>>;
  products: Product[];
};
