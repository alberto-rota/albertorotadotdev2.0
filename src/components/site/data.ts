import raw from "@/data/products.json";
import type {
  Announcement,
  Collaborator,
  ContactLink,
  HeroConfig,
  Institution,
  Product,
  ProductAction,
  ProductMedia,
  SectionConfig,
  SectionId,
  SiteData,
} from "./types";

const VALID: SectionId[] = ["research", "open-source", "resources", "designs"];

function isSectionId(value: unknown): value is SectionId {
  return typeof value === "string" && (VALID as string[]).includes(value);
}

function parseActions(raw: unknown): ProductAction[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return (raw as Array<Record<string, unknown>>)
    .map((a) => ({
      label: typeof a.label === "string" ? a.label : undefined,
      href: typeof a.href === "string" ? a.href : undefined,
      icon: typeof a.icon === "string" ? a.icon : undefined,
      ariaLabel: typeof a.ariaLabel === "string" ? a.ariaLabel : undefined,
    }))
    .filter((a) => a.label || a.href || a.icon);
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

function parseAnnouncement(raw: unknown): Announcement | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  if (r.enabled === false) return undefined;
  return {
    enabled: r.enabled !== false,
    label: typeof r.label === "string" ? r.label : undefined,
    title: typeof r.title === "string" ? r.title : undefined,
    body: typeof r.body === "string" ? r.body : undefined,
    dates: typeof r.dates === "string" ? r.dates : undefined,
    location: typeof r.location === "string" ? r.location : undefined,
    actions: parseActions(r.actions),
  };
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
    contacts?: unknown;
    sections?: Partial<Record<SectionId, SectionConfig>>;
    products?: Array<Record<string, unknown>>;
  };

  const hero = parseHero(data.hero);
  const announcement = parseAnnouncement(data.announcement);
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

  return { hero, announcement, sections, products, contacts };
}

export function bySection(products: Product[]): Record<SectionId, Product[]> {
  const grouped: Record<SectionId, Product[]> = {
    research: [],
    "open-source": [],
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
  "open-source": "Open Source",
  resources: "Profiles & Links",
  designs: "Designs",
};
