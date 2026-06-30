"use client";

import * as React from "react";
import NextImage from "next/image";
import { motion } from "motion/react";
import { Calendar, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Icon } from "./Icon";
import type { Announcement as AnnouncementData } from "./types";
import { cn } from "@/lib/utils";

/**
 * Sanitize a tiny HTML subset (<b>, <i>, <u>, <br>, <a href>).
 * Everything else is escaped.
 */
function renderRichText(input: string): React.ReactNode {
  const tokens: Array<{ type: "text" | "tag"; value: string }> = [];
  const tagRe = /<\/?(b|i|u|br|a)(\s+href=["']([^"']+)["'])?\s*\/?>/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(input))) {
    if (m.index > last) tokens.push({ type: "text", value: input.slice(last, m.index) });
    tokens.push({ type: "tag", value: m[0] });
    last = m.index + m[0].length;
  }
  if (last < input.length) tokens.push({ type: "text", value: input.slice(last) });

  const stack: Array<{ tag: string; href?: string; children: React.ReactNode[] }> = [
    { tag: "root", children: [] },
  ];

  for (const tok of tokens) {
    if (tok.type === "text") {
      stack[stack.length - 1].children.push(tok.value);
      continue;
    }
    const lower = tok.value.toLowerCase();
    if (lower.startsWith("</")) {
      const popped = stack.pop();
      if (!popped || stack.length === 0) continue;
      const parent = stack[stack.length - 1];
      switch (popped.tag) {
        case "b":
          parent.children.push(
            <strong key={parent.children.length} className="text-white">
              {popped.children}
            </strong>
          );
          break;
        case "i":
          parent.children.push(
            <em key={parent.children.length}>{popped.children}</em>
          );
          break;
        case "u":
          parent.children.push(
            <u key={parent.children.length}>{popped.children}</u>
          );
          break;
        case "a":
          parent.children.push(
            <a
              key={parent.children.length}
              href={popped.href}
              target={popped.href?.startsWith("http") ? "_blank" : undefined}
              rel={popped.href?.startsWith("http") ? "noreferrer" : undefined}
              className="text-white underline decoration-white/40 hover:decoration-white"
            >
              {popped.children}
            </a>
          );
          break;
      }
      continue;
    }
    if (lower.startsWith("<br")) {
      stack[stack.length - 1].children.push(
        <br key={stack[stack.length - 1].children.length} />
      );
      continue;
    }
    const tagMatch = /^<([a-z]+)(\s+href=["']([^"']+)["'])?/i.exec(tok.value);
    if (!tagMatch) continue;
    stack.push({ tag: tagMatch[1].toLowerCase(), href: tagMatch[3], children: [] });
  }

  return <>{stack[0].children}</>;
}

function AnnouncementImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10">
      <NextImage
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 36rem"
        unoptimized={src.toLowerCase().endsWith(".svg")}
      />
    </div>
  );
}

function AnnouncementCard({
  data,
  delay = 0.4,
  animate = true,
  uniformSize = false,
}: {
  data: AnnouncementData;
  delay?: number;
  animate?: boolean;
  uniformSize?: boolean;
}) {
  const actions = data.actions?.filter((a) => a.href) ?? [];
  const accent = data.accent || "#34d399";
  const imageAlt = data.imageAlt?.trim() || data.title || data.label || "Announcement";

  const rightColumn = data.image || actions.length > 0;

  return (
    <motion.article
      initial={animate ? { opacity: 0, y: 10 } : false}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "relative w-full overflow-hidden rounded-3xl border border-white/12 bg-white/[0.04] backdrop-blur",
        uniformSize && "min-h-[340px] sm:min-h-[380px] flex flex-col justify-center"
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px opacity-60"
        style={{
          background:
            "radial-gradient(800px 200px at 0% 0%, rgba(255,255,255,0.10), transparent 60%)",
        }}
      />
      <div
        className={cn(
          "relative grid gap-5 p-5 sm:p-6",
          rightColumn && "md:grid-cols-[1.5fr_1fr] md:items-center"
        )}
      >
        <div>
          {data.label ? (
            <div
              className="inline-flex items-center gap-2 rounded-full border bg-white/[0.05] px-3 py-1 text-[11px] sm:text-xs uppercase tracking-[0.22em] text-white/80"
              style={{ borderColor: `${accent}66` }}
            >
              <span className="relative inline-flex h-2 w-2">
                <span
                  className="absolute inset-0 rounded-full animate-soft-pulse"
                  style={{ background: accent, opacity: 0.55 }}
                />
                <span
                  className="absolute inset-[2px] rounded-full"
                  style={{ background: accent, boxShadow: `0 0 10px ${accent}` }}
                />
              </span>
              {data.label}
            </div>
          ) : null}

          {data.title ? (
            <h2 className="mt-3 font-display tracking-[0.03em] uppercase text-3xl sm:text-4xl md:text-5xl leading-[0.95] text-white">
              {data.title}
            </h2>
          ) : null}

          {data.body ? (
            <p
              className="mt-3 text-sm sm:text-base text-white/75 leading-relaxed max-w-2xl"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {renderRichText(data.body)}
            </p>
          ) : null}

          {(data.dates || data.location) && (
            <div
              className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-white/65"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {data.dates ? (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> {data.dates}
                </span>
              ) : null}
              {data.location ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {data.location}
                </span>
              ) : null}
            </div>
          )}
        </div>

        {rightColumn ? (
          <div className="flex flex-col gap-4 md:items-stretch">
            {data.image ? (
              <AnnouncementImage src={data.image} alt={imageAlt} />
            ) : null}
            {actions.length > 0 ? (
              <div className="flex flex-wrap gap-2 md:justify-end">
                {actions.map((a, i) => (
                  <a
                    key={`${a.href}-${i}`}
                    href={a.href}
                    target={a.href?.startsWith("http") ? "_blank" : undefined}
                    rel={a.href?.startsWith("http") ? "noreferrer" : undefined}
                    className={
                      i === 0
                        ? "inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2.5 text-sm font-medium uppercase tracking-[0.14em] hover:bg-white/90 transition-colors"
                        : "inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-sm font-medium uppercase tracking-[0.14em] text-white hover:bg-white/10 transition-colors"
                    }
                  >
                    <Icon name={a.icon} size={16} className="h-4 w-4" />
                    {a.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}

function getActiveIndex(scroller: HTMLElement): number {
  const center = scroller.scrollLeft + scroller.clientWidth / 2;
  let best = 0;
  let bestDist = Infinity;

  for (let i = 0; i < scroller.children.length; i++) {
    const slide = scroller.children[i] as HTMLElement;
    const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
    const dist = Math.abs(center - slideCenter);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }

  return best;
}

function slideState(index: number, activeIndex: number): "active" | "adjacent" | "distant" {
  if (index === activeIndex) return "active";
  if (Math.abs(index - activeIndex) === 1) return "adjacent";
  return "distant";
}

function AnnouncementCarousel({ items }: { items: AnnouncementData[] }) {
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [canLeft, setCanLeft] = React.useState(false);
  const [canRight, setCanRight] = React.useState(false);

  const scrollToIndex = React.useCallback((index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const slide = el.children[index] as HTMLElement | undefined;
    if (!slide) return;
    const target = slide.offsetLeft + slide.offsetWidth / 2 - el.clientWidth / 2;
    el.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, []);

  const snapToNearest = React.useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollerRef.current;
    if (!el) return;
    const index = getActiveIndex(el);
    const slide = el.children[index] as HTMLElement | undefined;
    if (!slide) return;
    const target = slide.offsetLeft + slide.offsetWidth / 2 - el.clientWidth / 2;
    const max = el.scrollWidth - el.clientWidth;
    el.scrollTo({
      left: Math.min(max, Math.max(0, target)),
      behavior,
    });
  }, []);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const update = () => {
      const left = el.scrollLeft;
      const max = el.scrollWidth - el.clientWidth - 2;
      setCanLeft(left > 4);
      setCanRight(left < max);
      setActiveIndex(getActiveIndex(el));
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const onScrollEnd = () => {
      snapToNearest();
    };
    el.addEventListener("scrollend", onScrollEnd);
    const ro = new ResizeObserver(() => {
      update();
      snapToNearest("instant");
    });
    ro.observe(el);

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (e.deltaY === 0) return;
      e.preventDefault();
      window.scrollBy({ top: e.deltaY });
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("scroll", update);
      el.removeEventListener("scrollend", onScrollEnd);
      el.removeEventListener("wheel", onWheel);
      ro.disconnect();
    };
  }, [items.length, snapToNearest]);

  React.useEffect(() => {
    snapToNearest("instant");
  }, [items.length, snapToNearest]);

  const scrollBy = (dir: -1 | 1) => {
    const next = Math.min(items.length - 1, Math.max(0, activeIndex + dir));
    scrollToIndex(next);
  };

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 -mt-4 sm:-mt-2 pb-2">
        <div className="hidden md:flex justify-end">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              disabled={!canLeft}
              aria-label="Previous announcement"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.1] transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              disabled={!canRight}
              aria-label="Next announcement"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.1] transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative pb-4 sm:pb-6">
        <div
          ref={scrollerRef}
          className="snap-x snap-mandatory no-scrollbar overflow-x-auto overflow-y-hidden flex"
        >
          {items.map((data, i) => {
            const state = slideState(i, activeIndex);
            const isActive = state === "active";

            return (
              <div
                key={`${data.label ?? ""}-${data.title ?? ""}-${i}`}
                role="group"
                aria-hidden={!isActive}
                aria-label={isActive ? undefined : data.title || data.label || `Announcement ${i + 1}`}
                onClick={() => {
                  if (!isActive) scrollToIndex(i);
                }}
                className={cn(
                  "flex w-full min-w-full shrink-0 snap-center justify-center px-4 sm:px-6 transition-[opacity,filter] duration-300 ease-out",
                  state === "active" && "opacity-100 blur-0 z-10",
                  state === "adjacent" &&
                    "opacity-[0.14] blur-[3px] cursor-pointer hover:opacity-[0.22]",
                  state === "distant" && "opacity-[0.06] blur-[4px] cursor-pointer hover:opacity-[0.12]"
                )}
              >
                <div className="w-full max-w-6xl">
                  <AnnouncementCard data={data} animate={i === 0} uniformSize />
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="md:hidden mt-3 px-6 text-[10px] uppercase tracking-[0.22em] text-white/35"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Swipe →
        </div>
      </div>
    </>
  );
}

export function Announcements({ items }: { items: AnnouncementData[] }) {
  const visible = items.filter(
    (a) => a.enabled !== false && (a.title || a.body)
  );
  if (!visible.length) return null;

  if (visible.length === 1) {
    return (
      <section aria-label="Announcements" className="relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 -mt-4 sm:-mt-2 pb-4 sm:pb-6">
          <AnnouncementCard data={visible[0]} uniformSize />
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Announcements" className="relative">
      <AnnouncementCarousel items={visible} />
    </section>
  );
}
