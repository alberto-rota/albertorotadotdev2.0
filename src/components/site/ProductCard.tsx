"use client";

import * as React from "react";
import NextImage from "next/image";
import { motion } from "motion/react";
import { ArrowUpRight, Plus } from "lucide-react";
import { Icon } from "./Icon";
import type { Product, SectionId } from "./types";
import { cn } from "@/lib/utils";

type CardSize = "default" | "compact";

const actionBtnBase =
  "inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors";
// Research thumbnails are usually white paper pages — dark pill stands out.
const actionBtnResearch =
  "bg-black/85 border-black/20 text-white hover:bg-black";
// Open-source / Funded thumbnails skew dark — cream pill stands out.
const actionBtnDefault =
  "bg-[var(--surface-tint)] border-black/15 backdrop-blur text-black hover:bg-black hover:text-white";

export function ProductCard({
  product,
  sectionId,
  defaultCardAspect,
  defaultCardFit,
  size = "default",
  index,
  onOpenDetail,
}: {
  product: Product;
  sectionId?: SectionId;
  defaultCardAspect?: string;
  defaultCardFit?: "cover" | "contain";
  size?: CardSize;
  index: number;
  onOpenDetail: (p: Product) => void;
}) {
  const accent = product.accent || "#000000";
  const primaryAction = product.actions?.find((a) => a.href) ?? null;
  const externalHref = product.link && product.link !== "#" ? product.link : primaryAction?.href ?? null;

  if (size === "compact") {
    return (
      <CompactCard product={product} accent={accent} externalHref={externalHref} index={index} />
    );
  }

  // Card sizing: fixed height per breakpoint, width derived from `cardAspect`.
  // Default ratio is portrait 5/6 so existing portrait thumbnails stay edge-to-edge.
  const aspect = (product.cardAspect ?? defaultCardAspect ?? "5/6").trim();
  const fit = product.cardFit ?? defaultCardFit ?? "cover";
  const isContain = fit === "contain";
  const isResearch = sectionId === "research";
  const isFunded = sectionId === "funded";
  const actionBtn = cn(actionBtnBase, isResearch ? actionBtnResearch : actionBtnDefault);
  const cardHeight = isFunded
    ? "h-[clamp(360px,52vh,560px)]"
    : "h-[clamp(360px,52vh,560px)]";

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.3) }}
      className={cn("group relative shrink-0 snap-start max-w-[88vw]", cardHeight)}
      style={{ aspectRatio: aspect }}
    >
      <button
        type="button"
        onClick={() => onOpenDetail(product)}
        aria-label={`Open details for ${product.title}`}
        className="block w-full h-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40 rounded-3xl"
      >
        <div
          className="relative h-full w-full overflow-hidden rounded-3xl border border-black/10 bg-[var(--surface-tint)]"
          style={
            {
              ["--accent" as string]: accent,
            } as React.CSSProperties
          }
        >
          {/* Smart accent backdrop for the Funded section — survives transparent PNG logos */}
          {isFunded ? (
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(120% 85% at 22% 16%, color-mix(in srgb, ${accent} 55%, transparent), transparent 60%),
                  radial-gradient(130% 100% at 80% 88%, color-mix(in srgb, ${accent} 38%, transparent), transparent 65%),
                  linear-gradient(140deg, color-mix(in srgb, ${accent} 8%, var(--surface-tint)), color-mix(in srgb, ${accent} 22%, var(--surface-tint)))
                `,
              }}
            />
          ) : isContain ? (
            /* Backdrop image (blurred fill) behind contained thumbnails in other sections. */
            <NextImage
              src={product.thumbnail}
              alt=""
              fill
              sizes="(min-width: 768px) 700px, 90vw"
              className="absolute inset-0 h-full w-full object-cover scale-110 blur-2xl opacity-40"
              unoptimized={product.thumbnail.toLowerCase().endsWith(".svg")}
              loading="lazy"
              aria-hidden
            />
          ) : null}

          {/* Image */}
          <NextImage
            src={product.thumbnail}
            alt={product.title}
            fill
            sizes="(min-width: 768px) 700px, 90vw"
            className={cn(
              "absolute inset-0 h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]",
              isContain
                ? isFunded
                  ? "object-contain p-6 sm:p-10"
                  : "object-contain p-4 sm:p-6"
                : "object-cover"
            )}
            unoptimized={product.thumbnail.toLowerCase().endsWith(".svg")}
            loading="lazy"
          />

          {/* Bottom scrim so the title block reads against any thumbnail.
              Solid cream for the title zone, then a quick fade so the image stays visible. */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background: isFunded
                ? "linear-gradient(to top, var(--surface-tint) 0%, color-mix(in srgb, var(--surface-tint) 70%, transparent) 18%, transparent 38%)"
                : "linear-gradient(to top, var(--surface-tint) 0%, var(--surface-tint) 22%, color-mix(in srgb, var(--surface-tint) 35%, transparent) 38%, transparent 55%)",
            }}
          />

          {/* Accent line — top */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px] opacity-60"
            style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
          />

          {/* Meta chip — venue/funder/journal/conference tag.
              Research thumbnails are mostly white → dark pill for contrast.
              Other thumbnails skew dark → cream pill. */}
          {product.meta?.venue || product.meta?.funder ? (
            <div
              className={cn(
                "absolute top-3 left-3 inline-flex items-center gap-2 rounded-full border backdrop-blur px-3 py-1.5 text-xs sm:text-sm tracking-[0.02em]",
                isResearch
                  ? "bg-black/85 text-white"
                  : "bg-[var(--surface-tint)]/90 text-black"
              )}
              style={{ borderColor: isResearch ? `${accent}aa` : `${accent}66` }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: accent, boxShadow: `0 0 12px ${accent}` }}
              />
              {product.meta.venue ?? product.meta.funder}
            </div>
          ) : null}

          {/* Hover/Tap actions row (visible always on mobile, on hover desktop) */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            {externalHref ? (
              <a
                href={externalHref}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${product.title} link`}
                onClick={(e) => e.stopPropagation()}
                className={actionBtn}
              >
                <ArrowUpRight className="h-4 w-4" />
              </a>
            ) : null}
            <span aria-hidden className={actionBtn}>
              <Plus className="h-4 w-4" />
            </span>
          </div>

          {/* Title block */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
            <div className="flex items-end gap-3">
              {product.icon ? (
                <div className="shrink-0 h-10 w-10 sm:h-11 sm:w-11 rounded-xl overflow-hidden bg-black/10 border border-black/15 flex items-center justify-center p-1.5">
                  <Icon name={product.icon} size={36} className="object-contain" />
                </div>
              ) : null}
              <div className="min-w-0">
                <h3 className="font-display tracking-[0.01em] text-black text-2xl sm:text-3xl leading-[1.05]">
                  {product.title}
                </h3>
                {product.subtitle ? (
                  <p
                    className="mt-1.5 text-black/75 text-xs sm:text-sm leading-snug line-clamp-2"
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
                    className="rounded-full border border-black/15 bg-black/[0.06] px-2 py-0.5 text-[11px] tracking-[0.02em] text-black/80"
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
        className="group relative flex flex-col items-center justify-center gap-2 h-32 w-32 sm:h-36 sm:w-36 rounded-2xl border border-black/10 bg-black/[0.04] hover:bg-black/[0.07] hover:border-black/25 transition-colors"
        aria-label={product.title}
      >
        <div className="relative h-14 w-14 sm:h-16 sm:w-16">
          <NextImage
            src={product.thumbnail}
            alt={product.title}
            fill
            sizes="64px"
            className="object-contain"
            unoptimized={product.thumbnail.toLowerCase().endsWith(".svg")}
          />
        </div>
        <div
          className="text-[11px] sm:text-xs tracking-[0.02em] text-black/70 group-hover:text-black transition-colors"
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
