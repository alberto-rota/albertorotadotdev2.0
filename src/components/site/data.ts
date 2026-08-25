import raw from "@/data/products.json";
import type {
  Announcement,
  Collaborator,
  ContactLink,
  DetailBlock,
  DetailSection,
  HeroConfig,
  Institution,
  Product,
  ProductAction,
  ProductDetails,
  ProductMedia,
  SectionConfig,
  SectionId,
  SiteData,
  TerminalLine,
} from "./types";

const VALID: SectionId[] = [
  "research",
  "terminal-tools",
  "vsc-extensions",
  "resources",
  "designs",
];

function isSectionId(value: unknown): value is SectionId {
  return typeof value === "string" && (VALID as string[]).includes(value);
}

function parseActions(raw: unknown): ProductAction[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return (raw as Array<Record<string, unknown>>)
    .map((a) => ({
      label: typeof a.label === "string" ? a.label : undefined,
      href: typeof a.href === "string" ? a.href : undefined,
      copy: typeof a.copy === "string" ? a.copy : undefined,
      doi: typeof a.doi === "string" ? a.doi : undefined,
      pdf: typeof a.pdf === "string" ? a.pdf : undefined,
      icon: typeof a.icon === "string" ? a.icon : undefined,
      ariaLabel: typeof a.ariaLabel === "string" ? a.ariaLabel : undefined,
    }))
    .filter((a) => a.label || a.href || a.copy || a.icon);
}

function parseCollaborators(raw: unknown): Collaborator[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const list = (raw as Array<Record<string, unknown>>)
    .map((c) => ({
      name: typeof c.name === "string" ? c.name : "",
      href: typeof c.href === "string" ? c.href : undefined,
      role: typeof c.role === "string" ? c.role : undefined,
      affiliation: typeof c.affiliation === "string" ? c.affiliation : undefined,
    }))
    .filter((c) => c.name);
  return list.length ? list : undefined;
}

function parseInstitutions(raw: unknown): Institution[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const list = (raw as Array<Record<string, unknown>>)
    .map((i) => ({
      name: typeof i.name === "string" ? i.name : "",
      href: typeof i.href === "string" ? i.href : undefined,
      logo: typeof i.logo === "string" ? i.logo : undefined,
    }))
    .filter((i) => i.name);
  return list.length ? list : undefined;
}

function parseAnnouncementItem(raw: unknown): Announcement | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  if (r.enabled === false) return undefined;
  return {
    enabled: r.enabled !== false,
    accent: typeof r.accent === "string" ? r.accent : undefined,
    label: typeof r.label === "string" ? r.label : undefined,
    title: typeof r.title === "string" ? r.title : undefined,
    body: typeof r.body === "string" ? r.body : undefined,
    dates: typeof r.dates === "string" ? r.dates : undefined,
    location: typeof r.location === "string" ? r.location : undefined,
    actions: parseActions(r.actions),
    image: typeof r.image === "string" ? r.image : undefined,
    imageAlt: typeof r.imageAlt === "string" ? r.imageAlt : undefined,
  };
}

function parseAnnouncements(raw: {
  announcement?: unknown;
  announcements?: unknown;
}): Announcement[] {
  if (Array.isArray(raw.announcements)) {
    return raw.announcements
      .map(parseAnnouncementItem)
      .filter((a): a is Announcement => a !== undefined);
  }
  const single = parseAnnouncementItem(raw.announcement);
  return single ? [single] : [];
}

function parseContacts(raw: unknown): ContactLink[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Array<Record<string, unknown>>)
    .map((c) => ({
      id: typeof c.id === "string" ? c.id : undefined,
      label: typeof c.label === "string" ? c.label : undefined,
      href: typeof c.href === "string" ? c.href : undefined,
      icon: typeof c.icon === "string" ? c.icon : undefined,
      pinned: c.pinned === true,
    }))
    .filter((c) => c.href);
}

function parseDetailBlocks(raw: unknown): DetailBlock[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const blocks = (raw as Array<Record<string, unknown>>)
    .map((b): DetailBlock | null => {
      const type = b.type;
      if (type === "paragraph" && typeof b.text === "string" && b.text.trim()) {
        return { type: "paragraph", text: b.text };
      }
      if (type === "list" && Array.isArray(b.items)) {
        const items = b.items.filter(
          (item): item is string => typeof item === "string" && item.trim().length > 0
        );
        if (items.length === 0) return null;
        return { type: "list", items };
      }
      if (type === "image" && typeof b.src === "string" && b.src) {
        const width = typeof b.width === "number" && b.width > 0 ? b.width : undefined;
        const height = typeof b.height === "number" && b.height > 0 ? b.height : undefined;
        return {
          type: "image",
          src: b.src,
          alt: typeof b.alt === "string" ? b.alt : undefined,
          caption: typeof b.caption === "string" ? b.caption : undefined,
          width,
          height,
        };
      }
      return null;
    })
    .filter((b): b is DetailBlock => b !== null);
  return blocks.length ? blocks : undefined;
}

function parseDetailSections(raw: unknown): DetailSection[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const sections = (raw as Array<Record<string, unknown>>)
    .map((s): DetailSection | null => {
      const title = typeof s.title === "string" ? s.title.trim() : "";
      const blocks = parseDetailBlocks(s.blocks);
      if (!title || !blocks?.length) return null;
      return { title, blocks };
    })
    .filter((s): s is DetailSection => s !== null);
  return sections.length ? sections : undefined;
}

function parseTerminal(raw: unknown): ProductDetails["terminal"] {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.lines)) return undefined;
  const lines = (r.lines as Array<Record<string, unknown>>)
    .map((l): TerminalLine | null => {
      const text = typeof l.text === "string" ? l.text : "";
      if (!text) return null;
      const tone = l.tone;
      return {
        text,
        prompt: typeof l.prompt === "string" ? l.prompt : undefined,
        tone: tone === "cmd" || tone === "out" || tone === "note" ? tone : undefined,
      };
    })
    .filter((l): l is TerminalLine => l !== null);
  if (!lines.length) return undefined;
  return { title: typeof r.title === "string" ? r.title : undefined, lines };
}

function parseHero(raw: unknown): HeroConfig | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  const tagline = typeof r.tagline === "string" ? r.tagline : undefined;
  if (!tagline) return undefined;
  return { tagline };
}

/** Parse the products.json blob into a strongly-typed `SiteData`. */
export function loadSiteData(): SiteData {
  const data = raw as {
    hero?: unknown;
    announcement?: unknown;
    announcements?: unknown;
    contacts?: unknown;
    sections?: Partial<Record<SectionId, SectionConfig>>;
    products?: Array<Record<string, unknown>>;
  };

  const hero = parseHero(data.hero);
  const announcements = parseAnnouncements(data);
  const contacts = parseContacts(data.contacts);

  const sections: Partial<Record<SectionId, SectionConfig>> = {};
  for (const id of VALID) {
    const raw = data.sections?.[id] ?? {};
    sections[id] = {
      ...raw,
      cardAspect: typeof raw.cardAspect === "string" ? raw.cardAspect : undefined,
      cardFit:
        raw.cardFit === "contain" || raw.cardFit === "cover" ? raw.cardFit : undefined,
    };
  }

  const products: Product[] = (data.products ?? [])
    .map((p): Product | null => {
      const tag = isSectionId(p.tag) ? p.tag : undefined;
      if (!tag) return null;
      if (typeof p.thumbnail !== "string" || !p.thumbnail) return null;

      return {
        slug: typeof p.slug === "string" ? p.slug : undefined,
        title: typeof p.title === "string" ? p.title : "",
        subtitle: typeof p.subtitle === "string" ? p.subtitle : undefined,
        description: typeof p.description === "string" ? p.description : undefined,
        link: typeof p.link === "string" ? p.link : undefined,
        thumbnail: p.thumbnail,
        icon: typeof p.icon === "string" ? p.icon : undefined,
        accent: typeof p.accent === "string" ? p.accent : undefined,
        tech: Array.isArray(p.tech) ? (p.tech.filter((t) => typeof t === "string") as string[]) : undefined,
        meta:
          p.meta && typeof p.meta === "object"
            ? (Object.fromEntries(
                Object.entries(p.meta as Record<string, unknown>).filter(
                  ([, v]) => typeof v === "string"
                )
              ) as Record<string, string>)
            : undefined,
        collaborators: parseCollaborators(p.collaborators),
        institutions: parseInstitutions(p.institutions),
        actions: parseActions(p.actions),
        tag,
        compact: p.compact === true,
        pinned: p.pinned === true,
        cardAspect: typeof p.cardAspect === "string" ? p.cardAspect : undefined,
        cardFit:
          p.cardFit === "contain" || p.cardFit === "cover" ? p.cardFit : undefined,
        details:
          p.details && typeof p.details === "object"
            ? {
                body:
                  typeof (p.details as Record<string, unknown>).body === "string"
                    ? ((p.details as Record<string, unknown>).body as string)
                    : undefined,
                highlights: Array.isArray((p.details as Record<string, unknown>).highlights)
                  ? (((p.details as Record<string, unknown>).highlights as unknown[]).filter(
                      (h) => typeof h === "string"
                    ) as string[])
                  : undefined,
                sections: parseDetailSections((p.details as Record<string, unknown>).sections),
                terminal: parseTerminal((p.details as Record<string, unknown>).terminal),
                doi:
                  typeof (p.details as Record<string, unknown>).doi === "string"
                    ? ((p.details as Record<string, unknown>).doi as string)
                    : undefined,
                pdf:
                  typeof (p.details as Record<string, unknown>).pdf === "string"
                    ? ((p.details as Record<string, unknown>).pdf as string)
                    : undefined,
                citation:
                  typeof (p.details as Record<string, unknown>).citation === "string"
                    ? ((p.details as Record<string, unknown>).citation as string)
                    : undefined,
                media: Array.isArray((p.details as Record<string, unknown>).media)
                  ? (((p.details as Record<string, unknown>).media as Array<Record<string, unknown>>)
                      .map((m): ProductMedia | null => {
                        const type = m.type;
                        const src = typeof m.src === "string" ? m.src : undefined;
                        if (!src) return null;
                        if (type !== "image" && type !== "video" && type !== "embed") return null;
                        return {
                          type,
                          src,
                          caption: typeof m.caption === "string" ? m.caption : undefined,
                          alt: typeof m.alt === "string" ? m.alt : undefined,
                          poster: typeof m.poster === "string" ? m.poster : undefined,
                        };
                      })
                      .filter((m): m is ProductMedia => m !== null))
                  : undefined,
              }
            : undefined,
        detailComponent:
          typeof p.detailComponent === "string" ? p.detailComponent : undefined,
      };
    })
    .filter((p): p is Product => p !== null);

  return { hero, announcements, sections, products, contacts };
}

export function bySection(products: Product[]): Record<SectionId, Product[]> {
  const grouped: Record<SectionId, Product[]> = {
    research: [],
    "terminal-tools": [],
    "vsc-extensions": [],
    resources: [],
    designs: [],
  };
  for (const p of products) {
    if (p.tag) grouped[p.tag].push(p);
  }
  return grouped;
}

export function orderedSections(
  sections: Partial<Record<SectionId, SectionConfig>>
): SectionId[] {
  return VALID.slice().sort((a, b) => {
    const oa = sections[a]?.order ?? 99;
    const ob = sections[b]?.order ?? 99;
    return oa - ob;
  });
}

export const SECTION_FALLBACK_TITLES: Record<SectionId, string> = {
  research: "Research",
  "terminal-tools": "Terminal Tools",
  "vsc-extensions": "VS Code Extensions",
  resources: "Profiles & Links",
  designs: "Designs",
};
