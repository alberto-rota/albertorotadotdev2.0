export type SectionId =
  | "research"
  | "workshop"
  | "resources"
  | "designs";

export type ProductAction = {
  label?: string;
  href?: string;
  /** Text copied to the clipboard when clicked (e.g. an install command). */
  copy?: string;
  /** DOI landing page — used by the Paper morph button. */
  doi?: string;
  /** Direct PDF URL — used by the Paper morph button. */
  pdf?: string;
  /** Lucide icon name (e.g. "Github") or image path (e.g. "/icon.png"). */
  icon?: string;
  ariaLabel?: string;
};

export type ContactLink = {
  /** Stable id (e.g. "email", "linkedin"). */
  id?: string;
  /** Accessible label / tooltip. */
  label?: string;
  href?: string;
  /** Lucide icon name (e.g. "Mail") or image path (e.g. "/logo.png"). */
  icon?: string;
  /** When true, also surfaced as a circular icon button in the hero. */
  pinned?: boolean;
};

export type ProductMedia = {
  type: "image" | "video" | "embed";
  /** Local path or full remote image URL. */
  src: string;
  caption?: string;
  alt?: string;
  poster?: string;
};

/** A single block inside a research detail section (text, bullet list, or image). */
export type DetailBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | {
      type: "image";
      src: string;
      alt?: string;
      caption?: string;
      /** Intrinsic pixel size. When both are set the figure hugs the image
       *  instead of being letterboxed into a fixed aspect box. */
      width?: number;
      height?: number;
    }
  | {
      /** A compact results table. Copy numbers exactly from the source. */
      type: "table";
      columns: string[];
      rows: string[][];
      caption?: string;
      /** Index of the row to emphasise (usually the work being presented). */
      highlightRow?: number;
    };

/** Named section on a research detail page (Abstract, Overview, …). */
export type DetailSection = {
  title: string;
  blocks: DetailBlock[];
};

/** One line of the faux-terminal block shown on tool detail pages. */
export type TerminalLine = {
  /** Prompt glyph, e.g. "$" or ">". Omit for a bare comment line. */
  prompt?: string;
  text: string;
  /** "cmd" (default) = typed command, "out" = program output, "note" = comment. */
  tone?: "cmd" | "out" | "note";
};

export type ProductDetails = {
  body?: string;
  highlights?: string[];
  media?: ProductMedia[];
  /** DOI landing page for the Paper morph button. */
  doi?: string;
  /** Direct PDF path or URL for the Paper morph button. */
  pdf?: string;
  /** Citation filename or path (e.g. "unreflect-anything" → `/bibtex/unreflect-anything.bib`). */
  citation?: string;
  /** Structured sections with inline images. When set, overrides body/highlights layout. */
  sections?: DetailSection[];
  /** Lines rendered by the faux-terminal detail component. */
  terminal?: { title?: string; lines: TerminalLine[] };
};

export type Collaborator = {
  /** Display name, e.g. "Francesca Fati". */
  name: string;
  /** Optional profile / homepage link. */
  href?: string;
  /** Optional role, e.g. "Co-author", "Advisor". */
  role?: string;
  /** Optional short affiliation shown under the name. */
  affiliation?: string;
};

export type Institution = {
  /** Display name, e.g. "Politecnico di Milano". */
  name: string;
  /** Optional homepage link. */
  href?: string;
  /** Optional logo (image path), shown as a small badge. */
  logo?: string;
};

export type Product = {
  /** Stable id used to look up custom detail components. */
  slug?: string;
  title: string;
  subtitle?: string;
  description?: string;
  link?: string;
  /** Local path (e.g. "/images/x.png") or full remote image URL (e.g. "https://…/x.png"). */
  thumbnail: string;
  /** Optional small icon shown next to the title. */
  icon?: string;
  /** CSS color used as the card accent (border, glow, tag color). */
  accent?: string;
  /** Tag chips shown in the card / detail. */
  tech?: string[];
  /** Optional metadata block (venue, year, authors, ...). */
  meta?: Record<string, string>;
  /** People who contributed, shown as linkable chips in the detail panel. */
  collaborators?: Collaborator[];
  /** Institutions involved, shown as badges in the detail panel. */
  institutions?: Institution[];
  /** Pill buttons displayed in the card overlay and detail panel. */
  actions?: ProductAction[];
  tag?: SectionId;
  /** Compact "logo only" rendering in the resources row. */
  compact?: boolean;
  /**
   * When true, this entry is also surfaced as a circular icon-only button in
   * the page header. It still appears in its section / footer as usual.
   */
  pinned?: boolean;
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
  /** "default" = image cards in a single scrollable row, "compact" = small square
   *  logos, "grid" = two-line grid that scrolls horizontally (columns extend right). */
  layout?: "default" | "compact" | "grid";
  /** Default card aspect for products in this section (e.g. "2/3"). */
  cardAspect?: string;
  /** Default thumbnail fit for products in this section. */
  cardFit?: "cover" | "contain";
  /** When true, card thumbnails get a hairline inner margin filled by a blurred
   *  copy of the image (seamless color). Defaults to edge-to-edge. */
  cardInset?: boolean;
  /** Tailwind max-width class bounding the section's product row only
   *  (e.g. "max-w-7xl"). The title/header always stays at max-w-6xl.
   *  Defaults to "max-w-6xl". */
  maxWidth?: string;
};

export type Announcement = {
  enabled?: boolean;
  /** CSS color used for the label pill tag. */
  accent?: string;
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
  /** Optional image shown to the left of the text (e.g. `/images/figures/announcement/cvpr.png`). */
  image?: string;
  imageAlt?: string;
  /**
   * The image always fills the space left of the text (on mobile, a banner of
   * fixed height above it), so it gets cropped. "cover" (default) crops it;
   * "contain" shows it whole over a blurred copy of itself, for figures and
   * diagrams that must not be cut.
   */
  imageFit?: "cover" | "contain";
  /** CSS object-position for the crop, e.g. "center top" or "30% 50%". */
  imagePosition?: string;
  /**
   * Fixed frame ratio, as "W/H", "WxH" or "W:H" (e.g. "1/1"). The frame keeps
   * the full height and its width follows the ratio; the text moves up next
   * to it. Omitted: the image fills the whole column.
   */
  imageAspect?: string;
};

/** One word of the hero's glyph animation. `hold` is seconds it stays up. */
export type GlyphWord = { text: string; hold: number };

export type HeroConfig = {
  tagline?: string;
  /**
   * What the glyph band behind the hero spells. It plays `intro` once, in
   * order, then loops: `name`, a random pick from `topics`, `name`, …
   */
  glyph?: { name: GlyphWord; intro: GlyphWord[]; topics: GlyphWord[] };
};

export type SiteData = {
  hero?: HeroConfig;
  announcements: Announcement[];
  sections: Partial<Record<SectionId, SectionConfig>>;
  products: Product[];
  /** Quick "get in touch" links (email, LinkedIn, ...) usable in the hero. */
  contacts: ContactLink[];
};
