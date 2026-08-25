"use client";

import * as React from "react";
import NextImage from "next/image";
import { motion } from "motion/react";
import { ArrowUpRight, Check, Copy, Plus } from "lucide-react";
import { Icon } from "./Icon";
import type { Product, ProductAction, SectionId } from "./types";
import { cn, shouldBypassImageOptimization } from "@/lib/utils";

type CardSize = "default" | "compact";
type ActionVariant = "research" | "default";

const actionBtnBase =
  "inline-flex h-9 min-w-9 shrink-0 items-center rounded-full border overflow-hidden transition-all duration-500 ease-out";
const actionBtnResearch =
  "bg-black/80 border-white/25 text-white hover:bg-white hover:border-white hover:text-black";
const actionBtnDefault =
  "bg-white/10 border-white/15 backdrop-blur text-white hover:bg-white hover:border-white hover:text-black";

const actionLabelBase =
  "overflow-hidden whitespace-nowrap font-display text-sm uppercase tracking-[0.12em] leading-none transition-all duration-500 ease-out";

const actionLabelClasses = cn(
  actionLabelBase,
  "max-w-0 opacity-0",
  "group-hover/btn:max-w-[13rem] group-hover/btn:opacity-100 group-hover/btn:pr-3.5"
);

function CardActionButton({
  label,
  variant,
  icon,
  className,
  ...props
}: {
  label: string;
  variant: ActionVariant;
  icon: React.ReactNode;
} & React.ComponentPropsWithoutRef<"button">) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        actionBtnBase,
        "group/btn",
        variant === "research" ? actionBtnResearch : actionBtnDefault,
        className
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center">{icon}</span>
      <span className={actionLabelClasses}>{label}</span>
    </button>
  );
}

function CardActionLink({
  label,
  variant,
  icon,
  className,
  ...props
}: {
  label: string;
  variant: ActionVariant;
  icon: React.ReactNode;
} & React.ComponentPropsWithoutRef<"a">) {
  return (
    <a
      {...props}
      className={cn(
        actionBtnBase,
        "group/btn",
        variant === "research" ? actionBtnResearch : actionBtnDefault,
        className
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center">{icon}</span>
      <span className={actionLabelClasses}>{label}</span>
    </a>
  );
}

/** Action pill that copies `action.copy` to the clipboard, with feedback. */
function CardCopyButton({
  action,
  variant,
}: {
  action: ProductAction;
  variant: ActionVariant;
}) {
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
    <CardActionButton
      aria-label={action.ariaLabel ?? `Copy ${action.label ?? "command"} to clipboard`}
      label={copied ? "Copied!" : action.label ?? "Copy"}
      variant={variant}
      icon={
        copied ? (
          <Check className="h-4 w-4" />
        ) : action.icon ? (
          <Icon name={action.icon} size={16} />
        ) : (
          <Copy className="h-4 w-4" />
        )
      }
      onClick={(e) => {
        e.stopPropagation();
        handleCopy();
      }}
    />
  );
}

export function ProductCard({
  product,
  sectionId,
  defaultCardAspect,
  defaultCardFit,
  inGrid = false,
  inset = false,
  size = "default",
  index,
  onOpenDetail,
}: {
  product: Product;
  sectionId?: SectionId;
  defaultCardAspect?: string;
  defaultCardFit?: "cover" | "contain";
  /** Grid-cell mode: fill the parent cell; height follows the aspect ratio. */
  inGrid?: boolean;
  /** Hairline inner margin around the thumbnail with a seamless blurred fill. */
  inset?: boolean;
  size?: CardSize;
  index: number;
  onOpenDetail: (p: Product) => void;
}) {
  const accent = product.accent || "#ffffff";
  const primaryAction = product.actions?.find((a) => a.href) ?? null;
  const copyAction = product.actions?.find((a) => a.copy && !a.href) ?? null;
  const externalHref = product.link && product.link !== "#" ? product.link : primaryAction?.href ?? null;

  if (size === "compact") {
    return (
      <CompactCard product={product} accent={accent} externalHref={externalHref} index={index} />
    );
  }

  // Card sizing. Carousel mode: fixed height per breakpoint, width derived from
  // `cardAspect`. Grid mode: width fills the cell, height follows the aspect ratio.
  // Default ratio is portrait 5/6 so existing portrait thumbnails stay edge-to-edge.
  const aspect = (product.cardAspect ?? defaultCardAspect ?? "5/6").trim();
  const isResearch = sectionId === "research";
  const isDesigns = sectionId === "designs";
  const fit = product.cardFit ?? defaultCardFit ?? "cover";
  const isContain = fit === "contain";
  const actionVariant: ActionVariant = isResearch ? "research" : "default";
  const cardHeight = isDesigns
    ? "h-[clamp(380px,58vh,620px)]"
    : "h-[clamp(360px,52vh,560px)]";

  const venueChip = product.meta?.venue ? (
    <div
      className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs sm:text-sm uppercase tracking-[0.16em] text-white whitespace-nowrap"
      style={{ borderColor: `${accent}66` }}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: accent, boxShadow: `0 0 12px ${accent}` }}
      />
      <span className="truncate">{product.meta.venue}</span>
    </div>
  ) : null;

  const actionButtons = (
    <div className="flex h-9 shrink-0 flex-nowrap items-center gap-1.5">
      {copyAction ? <CardCopyButton action={copyAction} variant={actionVariant} /> : null}
      {externalHref ? (
        <CardActionLink
          href={externalHref}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${primaryAction?.label ?? product.title} link`}
          label={primaryAction?.label ?? "Open"}
          variant={actionVariant}
          icon={<ArrowUpRight className="h-4 w-4" />}
          onClick={(e) => e.stopPropagation()}
        />
      ) : null}
      <CardActionButton
        aria-label={`Open details for ${product.title}`}
        label="Details"
        variant={actionVariant}
        icon={<Plus className="h-4 w-4" />}
        onClick={() => onOpenDetail(product)}
      />
    </div>
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.3) }}
      className={cn(
        "group relative flex flex-col",
        inGrid
          ? "w-full snap-start"
          : cn("shrink-0 snap-start max-w-[88vw]", cardHeight)
      )}
      style={{ aspectRatio: aspect }}
    >
      {isResearch ? (
        <div className="mb-2 flex h-9 shrink-0 items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center overflow-hidden">
            {venueChip ?? <span aria-hidden />}
          </div>
          {actionButtons}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => onOpenDetail(product)}
        aria-label={`Open details for ${product.title}`}
        className="block min-h-0 w-full flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-3xl"
      >
        <div
          className="relative h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-black"
          style={
            {
              ["--accent" as string]: accent,
            } as React.CSSProperties
          }
        >
          {/* Blurred fill behind the thumbnail — bleeds the image's own edge
              colors into the hairline margin so the gap is invisible */}
          {isContain || inset ? (
            <NextImage
              src={product.thumbnail}
              alt=""
              fill
              sizes="(min-width: 768px) 700px, 90vw"
              className={cn(
                "absolute inset-0 h-full w-full object-cover scale-110 blur-2xl",
                inset && !isContain ? "opacity-70" : "opacity-40"
              )}
              unoptimized={shouldBypassImageOptimization(product.thumbnail)}
              loading="lazy"
              aria-hidden
            />
          ) : null}

          {inset ? (
            /* Hairline margin around the preview; wrapper clips the zoom so the
                image never bleeds back over the margin */
            <div className="absolute inset-2 overflow-hidden rounded-[20px]">
              <NextImage
                src={product.thumbnail}
                alt={product.title}
                fill
                sizes="(min-width: 768px) 700px, 90vw"
                className={cn(
                  "transition-transform duration-700 ease-out group-hover:scale-[1.04]",
                  isContain
                    ? cn("object-contain p-4 sm:p-6", isResearch && "object-top")
                    : isResearch
                      ? "object-cover object-top"
                      : "object-cover"
                )}
                unoptimized={shouldBypassImageOptimization(product.thumbnail)}
                loading="lazy"
              />
            </div>
          ) : (
            <NextImage
              src={product.thumbnail}
              alt={product.title}
              fill
              sizes="(min-width: 768px) 700px, 90vw"
              className={cn(
                "absolute inset-0 h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]",
                isContain
                  ? cn("object-contain p-4 sm:p-6", isResearch && "object-top")
                  : isResearch
                    ? "object-cover object-top"
                    : "object-cover"
              )}
              unoptimized={shouldBypassImageOptimization(product.thumbnail)}
              loading="lazy"
            />
          )}

          {/* Gradient — softer when image is contained so it isn't darkened */}
          <div
            className={cn(
              "absolute inset-0 pointer-events-none",
              isContain
                ? "bg-gradient-to-t from-black/85 via-black/10 to-transparent"
                : "bg-gradient-to-t from-black/85 via-black/30 to-black/10"
            )}
          />

          {/* Accent line — top */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px] opacity-60"
            style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
          />

          {/* Meta chip — venue / journal / conference tag (non-research only) */}
          {!isResearch && venueChip ? (
            <div className="absolute top-3 left-3">{venueChip}</div>
          ) : null}

          {/* Title block */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
            <div className="flex items-end gap-3">
              {product.icon ? (
                <div className="shrink-0 h-10 w-10 sm:h-11 sm:w-11 rounded-xl overflow-hidden bg-white/10 border border-white/15 flex items-center justify-center p-1.5">
                  <Icon name={product.icon} size={36} className="object-contain" />
                </div>
              ) : null}
              <div className="min-w-0">
                <h3 className="font-display tracking-[0.04em] text-white text-2xl sm:text-3xl leading-[1] uppercase">
                  {product.title}
                </h3>
                {product.subtitle ? (
                  <p
                    className="mt-1.5 text-white/75 text-xs sm:text-sm leading-snug line-clamp-2"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {product.subtitle}
                  </p>
                ) : null}
              </div>
            </div>

            {product.tech && product.tech.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {product.tech.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-white/80"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {/* Accent border on hover/focus */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-transparent transition-[box-shadow,ring] duration-300",
              "group-hover:ring-[var(--accent)]/40"
            )}
            style={{
              boxShadow: `inset 0 0 0 1px transparent`,
            }}
          />
        </div>
      </button>

      {/* Hover/Tap actions row (non-research only; research actions sit above
          the card). Sits outside the card button — a button can't nest inside
          a button — and overlays it at the same spot. */}
      {!isResearch ? (
        <div
          className="absolute top-3 right-3 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {actionButtons}
        </div>
      ) : null}
    </motion.article>
  );
}

function CompactCard({
  product,
  accent,
  externalHref,
  index,
}: {
  product: Product;
  accent: string;
  externalHref: string | null;
  index: number;
}) {
  const Wrapper: React.ElementType = externalHref ? "a" : "div";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.25) }}
      className="shrink-0 snap-start"
    >
      <Wrapper
        {...(externalHref
          ? { href: externalHref, target: "_blank", rel: "noreferrer" }
          : {})}
        className="group relative flex flex-col items-center justify-center gap-2 h-32 w-32 sm:h-36 sm:w-36 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/25 transition-colors"
        aria-label={product.title}
      >
        <div className="relative h-14 w-14 sm:h-16 sm:w-16">
          <NextImage
            src={product.thumbnail}
            alt={product.title}
            fill
            sizes="64px"
            className="object-contain"
            unoptimized={shouldBypassImageOptimization(product.thumbnail)}
          />
        </div>
        <div
          className="text-[10px] sm:text-xs uppercase tracking-[0.14em] text-white/70 group-hover:text-white transition-colors"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {product.title}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: `radial-gradient(120px 60px at 50% 0%, ${accent}26, transparent 70%)`,
          }}
        />
      </Wrapper>
    </motion.div>
  );
}
