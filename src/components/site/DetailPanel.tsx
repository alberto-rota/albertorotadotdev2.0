"use client";

import * as React from "react";
import NextImage from "next/image";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "motion/react";
import { ArrowUpRight, Check, User, X } from "lucide-react";
import { Icon } from "./Icon";
import { CustomScrollbar } from "./CustomScrollbar";
import { CiteButton } from "./CiteButton";
import { getCitationPath } from "./citation-utils";
import { PaperMorphButton } from "./PaperMorphButton";
import type { Collaborator, DetailBlock, DetailSection, Institution, Product, ProductAction, ProductMedia } from "./types";
import { getDetailComponent } from "./detail-components/registry";
import { getPaperLinks, getResearchSections, hasPaperMorph } from "./paper-utils";
import { shouldBypassImageOptimization } from "@/lib/utils";

const bodyTextClass =
  "text-white/80 text-[15px] sm:text-base leading-relaxed [font-family:var(--font-body)]";

/**
 * Renders a string with `backtick` spans as inline code. Content in
 * `products.json` is written in plain text, so this is the only markup it gets.
 */
function InlineText({ text }: { text: string }) {
  const parts = text.split(/`([^`]+)`/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <code
            key={i}
            className="rounded-[5px] bg-white/[0.08] px-1.5 py-0.5 text-[0.875em] text-white/90 [font-family:var(--font-mono)]"
          >
            {part}
          </code>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

function useMediaQuery(query: string) {
  const get = React.useCallback(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.matchMedia(query).matches);
  }, [query]);

  const [matches, setMatches] = React.useState(get);
  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, [query]);
  return matches;
}

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted || typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

export function DetailPanel({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const open = product !== null;

  // Lock body scroll while open.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Esc to close.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <Portal>
      <AnimatePresence>
        {open ? (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[80] bg-black/65 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
        ) : null}

        {open ? (
          isDesktop ? (
            <CenterPanel key="center" product={product!} onClose={onClose} />
          ) : (
            <BottomSheet key="sheet" product={product!} onClose={onClose} />
          )
        ) : null}
      </AnimatePresence>
    </Portal>
  );
}

function CenterPanel({ product, onClose }: { product: Product; onClose: () => void }) {
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 280, damping: 34 }}
      className="fixed inset-0 z-[81] flex items-end justify-center px-2 sm:px-3 lg:px-4 pt-3 pointer-events-none"
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={product.title}
        className="pointer-events-auto relative h-[95vh] w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl overflow-hidden rounded-t-3xl bg-black border-x border-t border-white/10 shadow-[0_-30px_80px_-20px_rgba(0,0,0,0.8)]"
      >
        <DetailContent product={product} onClose={onClose} />
      </aside>
    </motion.div>
  );
}

function BottomSheet({ product, onClose }: { product: Product; onClose: () => void }) {
  const y = useMotionValue(0);
  const sheetOpacity = useTransform(y, [0, 200], [1, 0.6]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 140 || info.velocity.y > 600) {
      onClose();
    } else {
      y.set(0);
    }
  };

  return (
    <motion.aside
      role="dialog"
      aria-modal="true"
      aria-label={product.title}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      style={{ y, opacity: sheetOpacity }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={onDragEnd}
      className="fixed inset-x-0 bottom-0 z-[81] h-[92vh] rounded-t-3xl bg-black border-t border-white/10 shadow-[0_-30px_80px_-20px_rgba(0,0,0,0.8)]"
    >
      <div className="pt-2.5 pb-1 flex items-center justify-center">
        <div className="h-1.5 w-12 rounded-full bg-white/15" />
      </div>
      <DetailContent product={product} onClose={onClose} compact />
    </motion.aside>
  );
}

function DetailContent({
  product,
  onClose,
  compact = false,
}: {
  product: Product;
  onClose: () => void;
  compact?: boolean;
}) {
  const accent = product.accent || "#ffffff";
  const Custom = product.detailComponent ? getDetailComponent(product.detailComponent) : null;
  const details = product.details;
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  const sharedProps = { product, accent, details, Custom, compact };

  return (
    <div ref={scrollRef} className="relative h-full overflow-y-auto overscroll-contain no-scrollbar">
      {/* Header bar */}
      <PanelHeader product={product} accent={accent} onClose={onClose} />

      {/* Category-specific body */}
      {product.tag === "research" ? (
        <ResearchLayout {...sharedProps} />
      ) : product.tag === "designs" ? (
        <DesignLayout {...sharedProps} />
      ) : (
        <DefaultLayout {...sharedProps} />
      )}

      {!compact ? (
        <CustomScrollbar targetRef={scrollRef} zIndex={90} hideDelay={1400} />
      ) : null}
    </div>
  );
}

/* ─── Shared sub-components ─── */

function PanelHeader({
  product,
  accent,
  onClose,
}: {
  product: Product;
  accent: string;
  onClose: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 bg-black/85 backdrop-blur border-b border-white/8">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-2 w-2 rounded-full" style={{ background: accent }} aria-hidden />
          <span className="text-[11px] uppercase tracking-[0.2em] text-white/55 truncate" style={{ fontFamily: "var(--font-body)" }}>
            {product.tag ?? "Detail"}
            {product.meta?.venue ? ` · ${product.meta.venue}` : ""}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close detail panel"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

type LayoutProps = {
  product: Product;
  accent: string;
  details: Product["details"];
  Custom: React.ComponentType<{ product: Product }> | null;
  compact: boolean;
};

function TitleBlock({ product, accent }: { product: Product; accent: string }) {
  return (
    <header>
      <h2 className="font-display tracking-[0.03em] uppercase text-white text-4xl sm:text-5xl leading-[0.95]">
        {product.title}
      </h2>
      {product.subtitle ? (
        <p className="mt-3 text-white/75 text-base sm:text-lg leading-snug" style={{ fontFamily: "var(--font-body)" }}>
          {product.subtitle}
        </p>
      ) : null}
      {product.tech && product.tech.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {product.tech.map((t) => (
            <span key={t} className="rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-white/80" style={{ fontFamily: "var(--font-body)" }}>
              {t}
            </span>
          ))}
        </div>
      ) : null}
    </header>
  );
}

const actionPillClass =
  "inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-sm font-display tracking-[0.12em] uppercase leading-none text-black hover:bg-white/90 transition-colors";

/** Pill that copies `action.copy` to the clipboard, with feedback. */
function CopyActionPill({ action }: { action: ProductAction }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    const text = action.copy ?? "";
    if (!text) return;
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => {});
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={action.ariaLabel ?? `Copy ${action.label ?? "command"} to clipboard`}
      className={actionPillClass}
    >
      {copied ? <Check className="h-4 w-4" /> : <Icon name={action.icon} size={16} className="h-4 w-4 object-contain" />}
      {copied ? "Copied!" : action.label ?? "Copy"}
    </button>
  );
}

function ActionsRow({ product }: { product: Product }) {
  if (!product.actions || product.actions.length === 0) return null;
  const actions = product.actions.filter((a) => a.href || a.copy);
  if (actions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a, i) =>
        a.copy && !a.href ? (
          <CopyActionPill key={`${a.label}-${i}`} action={a} />
        ) : (
          <a
            key={`${a.href}-${i}`}
            href={a.href}
            target={a.href?.startsWith("http") ? "_blank" : undefined}
            rel={a.href?.startsWith("http") ? "noreferrer" : undefined}
            aria-label={a.ariaLabel ?? a.label ?? "Open link"}
            className={actionPillClass}
          >
            <Icon name={a.icon} size={16} className="h-4 w-4 object-contain" />
            {a.label ?? "Open"}
            <ArrowUpRight className="h-4 w-4 opacity-70" />
          </a>
        )
      )}
    </div>
  );
}

function MetaGrid({ product }: { product: Product }) {
  if (!product.meta || Object.keys(product.meta).length === 0) return null;
  return (
    <dl className="grid grid-cols-2 gap-3 sm:gap-4">
      {Object.entries(product.meta).map(([k, v]) => (
        <div key={k} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3">
          <dt className="text-[10px] uppercase tracking-[0.18em] text-white/45" style={{ fontFamily: "var(--font-body)" }}>
            {k}
          </dt>
          <dd className="mt-1 text-white text-sm" style={{ fontFamily: "var(--font-body)" }}>
            {v}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function CollaboratorsBlock({ product, accent }: { product: Product; accent: string }) {
  if (!product.collaborators || product.collaborators.length === 0) return null;
  return (
    <section className="space-y-3">
      <SectionLabel>Collaborators</SectionLabel>
      <ul className="flex flex-wrap gap-2">
        {product.collaborators.map((c, i) => (
          <li key={`${c.name}-${i}`}>
            <CollaboratorChip person={c} accent={accent} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function InstitutionsBlock({ product }: { product: Product }) {
  if (!product.institutions || product.institutions.length === 0) return null;
  return (
    <section className="space-y-3">
      <SectionLabel>Institutions</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {product.institutions.map((inst, i) => (
          <InstitutionBadge key={`${inst.name}-${i}`} institution={inst} />
        ))}
      </div>
    </section>
  );
}

function BodyText({ product, details }: { product: Product; details: Product["details"] }) {
  if (details?.body) {
    return (
      <div className="text-white/80 text-[15px] sm:text-base leading-relaxed space-y-4" style={{ fontFamily: "var(--font-body)" }}>
        {details.body.split(/\n\s*\n/).map((para, i) => (
          <p key={i}>
            <InlineText text={para} />
          </p>
        ))}
      </div>
    );
  }
  if (product.description) {
    return (
      <p className="text-white/80 text-[15px] sm:text-base leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
        {product.description}
      </p>
    );
  }
  return null;
}

function Highlights({ details, accent }: { details: Product["details"]; accent: string }) {
  if (!details?.highlights || details.highlights.length === 0) return null;
  return (
    <ul className="space-y-2.5">
      {details.highlights.map((h, i) => (
        <li key={i} className="flex items-start gap-3">
          <span aria-hidden className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: accent }} />
          <span className="text-white/80 leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
            <InlineText text={h} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function MediaGallery({ details, accent }: { details: Product["details"]; accent: string }) {
  if (!details?.media || details.media.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="text-[11px] uppercase tracking-[0.2em] text-white/45" style={{ fontFamily: "var(--font-body)" }}>Media</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {details.media.map((m, i) => (
          <MediaTile key={`${m.src}-${i}`} item={m} accent={accent} />
        ))}
      </div>
    </div>
  );
}

function CustomSlot({ Custom, product }: { Custom: React.ComponentType<{ product: Product }> | null; product: Product }) {
  if (!Custom) return null;
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <Custom product={product} />
    </div>
  );
}

function FooterAccent({ accent }: { accent: string }) {
  return (
    <div className="pt-2 pb-4">
      <div className="h-px w-full opacity-50" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
    </div>
  );
}

/* ─── RESEARCH layout ─── */

function ResearchActionsRow({
  product,
  details,
}: {
  product: Product;
  details: Product["details"];
}) {
  const paperLinks = getPaperLinks(product, details);
  const useMorph = hasPaperMorph(product, details);
  const citationPath = getCitationPath(product, details);
  const actions = product.actions?.filter((a) => a.href) ?? [];

  if (actions.length === 0 && !useMorph && !citationPath) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((a, i) => {
        const isPaper = a.label?.toLowerCase() === "paper";
        if (isPaper && useMorph && paperLinks.doi && paperLinks.pdf) {
          return (
            <PaperMorphButton
              key={`paper-morph-${i}`}
              doi={paperLinks.doi}
              pdf={paperLinks.pdf}
              label={a.label}
              icon={a.icon}
            />
          );
        }

        return (
          <a
            key={`${a.href}-${i}`}
            href={a.href}
            target={a.href?.startsWith("http") ? "_blank" : undefined}
            rel={a.href?.startsWith("http") ? "noreferrer" : undefined}
            aria-label={a.ariaLabel ?? a.label ?? "Open link"}
            className={actionPillClass}
          >
            <Icon name={a.icon} size={16} className="h-4 w-4 object-contain" />
            {a.label ?? "Open"}
            <ArrowUpRight className="h-4 w-4 opacity-70" />
          </a>
        );
      })}
      {citationPath ? <CiteButton key="cite" citationPath={citationPath} /> : null}
    </div>
  );
}

function PaperCover({ product }: { product: Product }) {
  return (
    <div className="relative shrink-0 w-full sm:w-48 md:w-56">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <NextImage
          src={product.thumbnail}
          alt={`${product.title} paper preview`}
          fill
          sizes="(min-width: 768px) 224px, 100vw"
          className="object-contain object-top"
          unoptimized={shouldBypassImageOptimization(product.thumbnail)}
          priority
        />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 pointer-events-none" />
      </div>
    </div>
  );
}

/** Ceiling on how tall a section figure may render inside the detail panel. */
const FIGURE_MAX_H = "38vh";

function SectionImageBlock({
  block,
  accent,
}: {
  block: Extract<DetailBlock, { type: "image" }>;
  accent: string;
}) {
  const bypass = shouldBypassImageOptimization(block.src);
  // With intrinsic dimensions the figure takes the image's own aspect ratio, so
  // wide diagrams do not sit inside letterbox bands. Without them, fall back to
  // a fixed box and fit the image into it.
  const intrinsic = block.width && block.height ? { w: block.width, h: block.height } : null;
  // Cap the rendered height so a figure never fills the panel. Bounding the
  // *figure* by `ratio * FIGURE_MAX_H` rather than the image keeps it snug on
  // both axes: the box shrinks with the image instead of letterboxing it.
  const maxWidth = intrinsic
    ? `calc(${(intrinsic.w / intrinsic.h).toFixed(4)} * ${FIGURE_MAX_H})`
    : undefined;
  return (
    <figure
      className="mx-auto overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
      style={{ maxWidth }}
    >
      {intrinsic ? (
        <NextImage
          src={block.src}
          alt={block.alt ?? block.caption ?? ""}
          width={intrinsic.w}
          height={intrinsic.h}
          sizes="(min-width: 768px) 640px, 90vw"
          className="block h-auto w-full"
          unoptimized={bypass}
        />
      ) : (
        <div className="relative aspect-[16/10] w-full">
          <NextImage
            src={block.src}
            alt={block.alt ?? block.caption ?? ""}
            fill
            sizes="(min-width: 768px) 640px, 90vw"
            className="object-contain"
            unoptimized={bypass}
          />
        </div>
      )}
      {block.caption ? (
        <figcaption
          className="px-4 py-3 text-xs text-white/55 border-t border-white/8 leading-relaxed [font-family:var(--font-body)]"
        >
          <span
            className="mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle"
            style={{ background: accent }}
            aria-hidden
          />
          <InlineText text={block.caption} />
        </figcaption>
      ) : null}
    </figure>
  );
}

function SectionListBlock({
  items,
  accent,
}: {
  items: string[];
  accent: string;
}) {
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2">
      {items.map((item, i) => (
        <li
          key={i}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5"
        >
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
              style={{ background: accent }}
            />
            <span className={bodyTextClass}>
              <InlineText text={item} />
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function DetailBlockView({
  block,
  accent,
}: {
  block: DetailBlock;
  accent: string;
}) {
  if (block.type === "paragraph") {
    return (
      <p className={bodyTextClass}>
        <InlineText text={block.text} />
      </p>
    );
  }
  if (block.type === "list") {
    return <SectionListBlock items={block.items} accent={accent} />;
  }
  return <SectionImageBlock block={block} accent={accent} />;
}

function ResearchSectionView({
  section,
  accent,
}: {
  section: DetailSection;
  accent: string;
}) {
  return (
    <section className="space-y-4 [font-family:var(--font-body)]">
      <SectionLabel>{section.title}</SectionLabel>
      <div className="space-y-4">
        {section.blocks.map((block, i) => (
          <DetailBlockView key={i} block={block} accent={accent} />
        ))}
      </div>
    </section>
  );
}

function ResearchSections({
  sections,
  accent,
}: {
  sections: DetailSection[];
  accent: string;
}) {
  if (sections.length === 0) return null;
  return (
    <div className="space-y-7">
      {sections.map((section, i) => (
        <ResearchSectionView key={`${section.title}-${i}`} section={section} accent={accent} />
      ))}
    </div>
  );
}

function ResearchLayout({ product, accent, details, Custom, compact }: LayoutProps) {
  const researchSections = getResearchSections(details, product.description);

  return (
    <>
      <div className={compact ? "px-4 py-5 space-y-5" : "px-4 sm:px-6 py-6 sm:py-8 space-y-7"}>
        <div className="flex flex-col sm:flex-row gap-5 sm:gap-7">
          <PaperCover product={product} />

          <div className="flex flex-col gap-4 min-w-0 flex-1">
            <TitleBlock product={product} accent={accent} />
            <MetaGrid product={product} />
            <ResearchActionsRow product={product} details={details} />
          </div>
        </div>

        <ResearchSections sections={researchSections} accent={accent} />
        <CollaboratorsBlock product={product} accent={accent} />
        <InstitutionsBlock product={product} />
        <MediaGallery details={details} accent={accent} />
        <CustomSlot Custom={Custom} product={product} />
        <FooterAccent accent={accent} />
      </div>
    </>
  );
}

/* ─── DESIGNS layout (bento grid) ─── */

function DesignLayout({ product, accent, details, Custom }: LayoutProps) {
  const media = details?.media ?? [];

  return (
    <>
      {/* Full-bleed hero — showcase the brand mark large */}
      <div className="relative w-full aspect-square sm:aspect-[4/3] max-h-[50vh] overflow-hidden bg-white/[0.02]">
        <NextImage
          src={product.thumbnail}
          alt={product.title}
          fill
          sizes="(min-width: 768px) 640px, 100vw"
          className="object-contain p-8 sm:p-12"
          unoptimized={shouldBypassImageOptimization(product.thumbnail)}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      </div>

      {/* Bento body */}
      <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-7">
        <TitleBlock product={product} accent={accent} />
        <ActionsRow product={product} />
        <BodyText product={product} details={details} />

        {/* Bento image gallery */}
        {media.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {media.map((m, i) => (
              <figure
                key={`${m.src}-${i}`}
                className={`overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] ${
                  i === 0 ? "col-span-2 row-span-2" : ""
                }`}
              >
                <div className="relative aspect-square w-full h-full">
                  <NextImage
                    src={m.src}
                    alt={m.alt ?? m.caption ?? ""}
                    fill
                    sizes="(min-width: 768px) 280px, 45vw"
                    className="object-cover"
                    unoptimized={shouldBypassImageOptimization(m.src)}
                  />
                </div>
                {m.caption ? (
                  <figcaption className="px-3 py-2 text-xs text-white/55 border-t border-white/8" style={{ fontFamily: "var(--font-body)" }}>
                    <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: accent }} />
                    {m.caption}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        ) : null}

        <Highlights details={details} accent={accent} />
        <CustomSlot Custom={Custom} product={product} />
        <FooterAccent accent={accent} />
      </div>
    </>
  );
}

/* ─── DEFAULT layout (open-source / fallback — wide hero) ─── */

function DefaultLayout({ product, accent, details, Custom, compact }: LayoutProps) {
  return (
    <>
      {/* Wide hero image */}
      <div className={compact ? "relative w-full aspect-[16/10] overflow-hidden" : "relative w-full aspect-[16/10] max-h-[40vh] overflow-hidden"}>
        <NextImage
          src={product.thumbnail}
          alt={product.title}
          fill
          sizes="(min-width: 768px) 640px, 100vw"
          className="object-cover"
          unoptimized={shouldBypassImageOptimization(product.thumbnail)}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      </div>

      {/* Body */}
      <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-7">
        <TitleBlock product={product} accent={accent} />
        <ActionsRow product={product} />
        <MetaGrid product={product} />
        <CollaboratorsBlock product={product} accent={accent} />
        <InstitutionsBlock product={product} />
        <BodyText product={product} details={details} />
        <Highlights details={details} accent={accent} />
        {details?.sections?.length ? (
          <ResearchSections sections={details.sections} accent={accent} />
        ) : null}
        <MediaGallery details={details} accent={accent} />
        <CustomSlot Custom={Custom} product={product} />
        <FooterAccent accent={accent} />
      </div>
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[11px] uppercase tracking-[0.2em] text-white/45"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {children}
    </div>
  );
}

function CollaboratorChip({
  person,
  accent,
}: {
  person: Collaborator;
  accent: string;
}) {
  const Container: React.ElementType = person.href ? "a" : "div";
  const external = person.href?.startsWith("http");
  return (
    <Container
      {...(person.href
        ? {
            href: person.href,
            target: external ? "_blank" : undefined,
            rel: external ? "noreferrer" : undefined,
          }
        : {})}
      className="group inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 transition-colors hover:border-white/30 hover:bg-white/[0.07]"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <User className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
      <span className="text-sm text-white/85 group-hover:text-white">
        {person.name}
        {person.role ? <span className="text-white/45"> · {person.role}</span> : null}
        {person.affiliation ? (
          <span className="text-white/45"> · {person.affiliation}</span>
        ) : null}
      </span>
      {person.href ? (
        <ArrowUpRight className="h-3.5 w-3.5 text-white/40 group-hover:text-white transition-colors" />
      ) : null}
    </Container>
  );
}

function InstitutionBadge({ institution }: { institution: Institution }) {
  const Container: React.ElementType = institution.href ? "a" : "div";
  const external = institution.href?.startsWith("http");
  return (
    <Container
      {...(institution.href
        ? {
            href: institution.href,
            target: external ? "_blank" : undefined,
            rel: external ? "noreferrer" : undefined,
          }
        : {})}
      className="group inline-flex items-center gap-2.5 rounded-2xl border border-white/12 bg-white/[0.04] px-3.5 py-2 transition-colors hover:border-white/30 hover:bg-white/[0.07]"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {institution.logo ? (
        <span className="relative inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-md bg-white/10">
          <NextImage
            src={institution.logo}
            alt=""
            width={20}
            height={20}
            className="object-contain"
            unoptimized={institution.logo ? shouldBypassImageOptimization(institution.logo) : false}
          />
        </span>
      ) : null}
      <span className="text-sm text-white/85 group-hover:text-white">
        {institution.name}
      </span>
      {institution.href ? (
        <ArrowUpRight className="h-3.5 w-3.5 text-white/40 group-hover:text-white transition-colors" />
      ) : null}
    </Container>
  );
}

function MediaTile({ item, accent }: { item: ProductMedia; accent: string }) {
  const isSvg = shouldBypassImageOptimization(item.src);

  if (item.type === "image") {
    return (
      <figure className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="relative aspect-[16/10]">
          <NextImage
            src={item.src}
            alt={item.alt ?? item.caption ?? ""}
            fill
            sizes="(min-width: 768px) 320px, 90vw"
            className="object-cover"
            unoptimized={isSvg}
          />
        </div>
        {item.caption ? (
          <figcaption
            className="px-3 py-2 text-xs text-white/55 border-t border-white/8"
            style={{ fontFamily: "var(--font-body)" }}
          >
            <span
              className="mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle"
              style={{ background: accent }}
            />
            {item.caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  if (item.type === "video") {
    return (
      <figure className="overflow-hidden rounded-2xl border border-white/10 bg-black">
        <video
          src={item.src}
          controls
          playsInline
          poster={item.poster}
          className="w-full aspect-[16/10] object-cover"
        />
        {item.caption ? (
          <figcaption
            className="px-3 py-2 text-xs text-white/55 border-t border-white/8"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {item.caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  return (
    <figure className="overflow-hidden rounded-2xl border border-white/10 bg-black">
      <iframe
        src={item.src}
        title={item.caption ?? "Embedded media"}
        className="w-full aspect-[16/10]"
        loading="lazy"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      />
      {item.caption ? (
        <figcaption
          className="px-3 py-2 text-xs text-white/55 border-t border-white/8"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {item.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
