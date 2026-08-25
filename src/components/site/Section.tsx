"use client";

import * as React from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { bindRowWheel } from "./scroll-utils";
import type { Product, SectionConfig, SectionId } from "./types";
import { cn } from "@/lib/utils";

export function Section({
  id,
  title,
  subtitle,
  products,
  layout,
  cardAspect,
  cardFit,
  cardInset,
  maxWidth,
  onOpenDetail,
}: {
  id: SectionId;
  title: string;
  subtitle?: string;
  products: Product[];
  layout?: SectionConfig["layout"];
  cardAspect?: string;
  cardFit?: SectionConfig["cardFit"];
  cardInset?: boolean;
  maxWidth?: string;
  onOpenDetail: (p: Product) => void;
}) {
  const bound = maxWidth ?? "max-w-6xl";
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = React.useState(false);
  const [canRight, setCanRight] = React.useState(false);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const update = () => {
      const left = el.scrollLeft;
      const max = el.scrollWidth - el.clientWidth - 2;
      setCanLeft(left > 4);
      setCanRight(left < max);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);

    const unbindWheel = bindRowWheel(el);

    return () => {
      el.removeEventListener("scroll", update);
      unbindWheel();
      ro.disconnect();
    };
  }, [products.length]);

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = Math.max(280, el.clientWidth * 0.78);
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  if (!products.length) return null;

  const isCompact = layout === "compact";
  const isGrid = layout === "grid";

  return (
    <section
      id={id}
      aria-label={title}
      className="relative py-12 sm:py-16 md:py-20 scroll-mt-24"
    >
      {/* Header always aligns with the page grid; `maxWidth` only widens the products row */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: 0.5 }}
              className="font-display tracking-[0.04em] uppercase text-4xl sm:text-5xl md:text-6xl leading-[0.95]"
            >
              {title}
            </motion.h2>
            {subtitle ? (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-15%" }}
                transition={{ duration: 0.5, delay: 0.06 }}
                className="mt-2 text-sm sm:text-base text-white/60"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {subtitle}
              </motion.p>
            ) : null}
          </div>

          {/* Desktop arrow controls */}
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              disabled={!canLeft}
              aria-label={`Scroll ${title} left`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.1] transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              disabled={!canRight}
              aria-label={`Scroll ${title} right`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.1] transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </header>
      </div>

      <div className="relative">
        <div
          ref={scrollerRef}
          className="snap-row no-scrollbar fade-x overflow-x-auto overflow-y-hidden"
        >
          {isGrid ? (
            /* Horizontally scrolling two-line grid: items fill columns
               left-to-right, new products extend the row to the right */
            <div className="mx-auto grid w-max grid-flow-col grid-rows-2 auto-cols-[100vw] md:auto-cols-[40rem] gap-4 sm:gap-5 px-4 sm:px-6 py-2">
              {products.map((p, i) => (
                <ProductCard
                  key={p.slug || `${p.title}-${i}`}
                  product={p}
                  sectionId={id}
                  defaultCardAspect={cardAspect}
                  defaultCardFit={cardFit}
                  inGrid
                  inset={cardInset}
                  index={i}
                  onOpenDetail={onOpenDetail}
                />
              ))}
            </div>
          ) : (
            <div
              className={
                isCompact
                  ? cn("flex gap-3 sm:gap-4 px-4 sm:px-6 py-2 mx-auto", bound)
                  : cn("flex gap-4 sm:gap-5 px-4 sm:px-6 py-2 mx-auto", bound)
              }
            >
              {products.map((p, i) => (
                <ProductCard
                  key={p.slug || `${p.title}-${i}`}
                  product={p}
                  sectionId={id}
                  defaultCardAspect={cardAspect}
                  defaultCardFit={cardFit}
                  size={isCompact ? "compact" : "default"}
                  inset={cardInset}
                  index={i}
                  onOpenDetail={onOpenDetail}
                />
              ))}
            </div>
          )}
        </div>

        {/* Mobile swipe hint shown only when there are >1 items */}
        {products.length > 1 ? (
          <div className="md:hidden mt-3 px-6 text-[10px] uppercase tracking-[0.22em] text-white/35" style={{ fontFamily: "var(--font-body)" }}>
            Swipe →
          </div>
        ) : null}
      </div>
    </section>
  );
}
