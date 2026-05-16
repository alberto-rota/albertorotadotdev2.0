"use client";

import * as React from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { Product, SectionConfig, SectionId } from "./types";

export function Section({
  id,
  title,
  subtitle,
  products,
  layout,
  cardAspect,
  cardFit,
  onOpenDetail,
}: {
  id: SectionId;
  title: string;
  subtitle?: string;
  products: Product[];
  layout?: SectionConfig["layout"];
  cardAspect?: string;
  cardFit?: SectionConfig["cardFit"];
  onOpenDetail: (p: Product) => void;
}) {
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

    // Vertical wheel over overflow-x rows is captured by the browser for
    // horizontal scroll — forward it to the page instead.
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (e.deltaY === 0) return;
      e.preventDefault();
      window.scrollBy({ top: e.deltaY });
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("scroll", update);
      el.removeEventListener("wheel", onWheel);
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

  return (
    <section
      id={id}
      aria-label={title}
      className="relative py-12 sm:py-16 md:py-20 scroll-mt-24"
    >
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
                className="mt-2 text-sm sm:text-base text-black/60"
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/15 bg-black/[0.04] text-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/[0.1] transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              disabled={!canRight}
              aria-label={`Scroll ${title} right`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/15 bg-black/[0.04] text-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/[0.1] transition-colors"
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
          <div
            className={
              isCompact
                ? "flex gap-3 sm:gap-4 px-4 sm:px-6 py-2 max-w-6xl mx-auto"
                : "flex gap-4 sm:gap-5 px-4 sm:px-6 py-2 max-w-6xl mx-auto"
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
                index={i}
                onOpenDetail={onOpenDetail}
              />
            ))}
          </div>
        </div>

        {/* Mobile swipe hint shown only when there are >1 items */}
        {products.length > 1 ? (
          <div className="md:hidden mt-3 px-6 text-[10px] uppercase tracking-[0.22em] text-black/35" style={{ fontFamily: "var(--font-body)" }}>
            Swipe →
          </div>
        ) : null}
      </div>
    </section>
  );
}
