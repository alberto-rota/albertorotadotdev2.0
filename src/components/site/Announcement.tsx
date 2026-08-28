"use client";

import * as React from "react";
import NextImage from "next/image";
import { motion } from "motion/react";
import { Calendar, MapPin } from "lucide-react";
import { Icon } from "./Icon";
import { bindRowWheel } from "./scroll-utils";
import type { Announcement as AnnouncementData } from "./types";
import { cn, shouldBypassImageOptimization } from "@/lib/utils";

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
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 md:aspect-auto md:h-full md:min-h-[12rem]">
      <NextImage
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 22rem"
        unoptimized={shouldBypassImageOptimization(src)}
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
  const imageSrc = data.image?.trim();
  const imageAlt = data.imageAlt?.trim() || data.title || data.label || "Announcement";
  const hasImage = Boolean(imageSrc);
  const hasActions = actions.length > 0;

  const actionButtons = hasActions ? (
    <div className={cn("flex flex-wrap gap-2", !hasImage && "md:justify-end")}>
      {actions.map((a, i) => (
        <a
          key={`${a.href}-${i}`}
          href={a.href}
          target={a.href?.startsWith("http") ? "_blank" : undefined}
          rel={a.href?.startsWith("http") ? "noreferrer" : undefined}
          className={
            i === 0
              ? "inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2 text-[12px] font-medium uppercase tracking-[0.14em] hover:bg-white/90 transition-colors"
              : "inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-[12px] font-medium uppercase tracking-[0.14em] text-white hover:bg-white/10 transition-colors"
          }
        >
          <Icon name={a.icon} size={16} className="h-4 w-4" />
          {a.label}
        </a>
      ))}
    </div>
  ) : null;

  return (
    <motion.article
      initial={animate ? { opacity: 0, y: 10 } : false}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "relative w-full overflow-hidden rounded-3xl border border-white/12 bg-white/[0.04] backdrop-blur",
        uniformSize && "min-h-[280px] sm:min-h-[320px] flex flex-col justify-center"
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
          hasImage && "md:grid-cols-[minmax(10rem,1fr)_minmax(0,1.6fr)] md:items-stretch",
          !hasImage && hasActions && "md:grid-cols-[1.5fr_1fr] md:items-center"
        )}
      >
        {imageSrc ? <AnnouncementImage src={imageSrc} alt={imageAlt} /> : null}

        <div>
          {data.label ? (
            <div
              className="inline-flex items-center gap-2 rounded-full border bg-white/[0.05] px-3 py-1 text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-white/80"
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
            <h2 className="mt-3 font-display tracking-[0.03em] uppercase text-2xl sm:text-3xl md:text-4xl leading-[0.95] text-white">
              {data.title}
            </h2>
          ) : null}

          {data.body ? (
            <p
              className="mt-3 text-[13px] sm:text-sm text-white/75 leading-relaxed max-w-3xl"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {renderRichText(data.body)}
            </p>
          ) : null}

          {(data.dates || data.location) && (
            <div
              className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] sm:text-xs text-white/65"
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

          {hasImage && actionButtons ? <div className="mt-4">{actionButtons}</div> : null}
        </div>

        {!hasImage && actionButtons ? (
          <div className="flex flex-col gap-4 md:items-stretch">{actionButtons}</div>
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

/** Parse "#rgb" / "#rrggbb" into an [r,g,b] triple. Falls back to the default accent. */
function parseHex(hex: string): [number, number, number] {
  const s = hex.trim().replace("#", "");
  const full = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  if (!/^[0-9a-f]{6}$/i.test(full)) return [52, 211, 153];
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

const rgba = ([r, g, b]: [number, number, number], a: number) =>
  `rgba(${r}, ${g}, ${b}, ${a})`;

/** Blend the accents of the two slides the pager sits between. */
function blendAccent(items: AnnouncementData[], progress: number): [number, number, number] {
  const p = Math.max(0, Math.min(items.length - 1, progress));
  const i = Math.floor(p);
  const t = p - i;
  const a = parseHex(items[i]?.accent || "#34d399");
  const b = parseHex(items[Math.min(items.length - 1, i + 1)]?.accent || "#34d399");
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function AnnouncementCarousel({ items }: { items: AnnouncementData[] }) {
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const navRef = React.useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  /**
   * Fractional slide position. Every slide is exactly one scroller wide, so
   * `scrollLeft / clientWidth` is the position between slides — that lets the
   * rail marker follow the swipe continuously instead of snapping after it.
   */
  const [progress, setProgress] = React.useState(0);
  const [marker, setMarker] = React.useState<{ top: number; height: number } | null>(null);

  const accent = blendAccent(items, progress);

  const scrollToIndex = React.useCallback((index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const slide = el.children[index] as HTMLElement | undefined;
    if (!slide) return;
    const target = slide.offsetLeft + slide.offsetWidth / 2 - el.clientWidth / 2;
    el.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, []);

  /**
   * Centre the nearest slide. `tolerance` is how far off-centre we tolerate
   * before correcting — CSS `snap-mandatory` already lands the rest position,
   * so a re-snap that fires on every scroll end just fights the scroll it is
   * reacting to, which reads as the carousel grabbing at the pointer.
   */
  const snapToNearest = React.useCallback(
    (behavior: ScrollBehavior = "smooth", tolerance = 0) => {
      const el = scrollerRef.current;
      if (!el) return;
      const index = getActiveIndex(el);
      const slide = el.children[index] as HTMLElement | undefined;
      if (!slide) return;
      const target = slide.offsetLeft + slide.offsetWidth / 2 - el.clientWidth / 2;
      const max = el.scrollWidth - el.clientWidth;
      const left = Math.min(max, Math.max(0, target));
      if (Math.abs(el.scrollLeft - left) <= tolerance) return;
      el.scrollTo({ left, behavior });
    },
    []
  );

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    // The centring correction has to wait for the gesture to be over, not for
    // `scrollend`: a trackpad flick has gaps in it, so `scrollend` fires while
    // the user is still scrolling and each correction cancels the momentum. The
    // pager then creeps a couple of hundred pixels and springs back, and paging
    // by wheel becomes impossible. Debouncing on quiet instead leaves the whole
    // gesture alone and only tidies up the rest position.
    const SETTLE_MS = 160;
    let settleTimer = 0;

    const update = () => {
      const left = el.scrollLeft;
      setActiveIndex(getActiveIndex(el));
      setProgress(el.clientWidth > 0 ? left / el.clientWidth : 0);
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => snapToNearest("smooth", 4), SETTLE_MS);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(() => {
      update();
      snapToNearest("instant");
    });
    ro.observe(el);

    const unbindWheel = bindRowWheel(el);

    return () => {
      window.clearTimeout(settleTimer);
      el.removeEventListener("scroll", update);
      unbindWheel();
      ro.disconnect();
    };
  }, [items.length, snapToNearest]);

  React.useEffect(() => {
    snapToNearest("instant");
  }, [items.length, snapToNearest]);

  // Slide the rail marker to match the pager. Rail rows are fixed height, so
  // interpolating between two rows' boxes is enough — no measuring per frame.
  React.useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const place = () => {
      const rows = Array.from(
        nav.querySelectorAll<HTMLElement>("[data-nav-index]")
      );
      if (!rows.length) return;
      const p = Math.max(0, Math.min(rows.length - 1, progress));
      const i = Math.floor(p);
      const t = p - i;
      const a = rows[i];
      const b = rows[Math.min(rows.length - 1, i + 1)];
      setMarker({
        top: a.offsetTop + (b.offsetTop - a.offsetTop) * t,
        height: a.offsetHeight + (b.offsetHeight - a.offsetHeight) * t,
      });
    };

    place();
    const ro = new ResizeObserver(place);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [progress, items.length]);

  return (
    <div className="mx-auto max-w-[96rem] px-4 sm:px-8 -mt-4 sm:-mt-2 pb-4 sm:pb-6">
      <div className="grid gap-4 md:grid-cols-[minmax(10rem,14rem)_minmax(0,1fr)] md:gap-6">
        {/* Vertical rail — desktop */}
        <div
          ref={navRef}
          role="tablist"
          aria-label="All announcements"
          aria-orientation="vertical"
          className="relative hidden md:flex md:flex-col md:self-center"
        >
          {/* Spine + the segment that tracks the pager */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 bottom-0 w-px bg-white/10"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 w-[2px] rounded-full"
            style={{
              top: marker?.top ?? 0,
              height: marker?.height ?? 0,
              background: rgba(accent, 1),
              boxShadow: `0 0 14px ${rgba(accent, 0.7)}`,
              opacity: marker ? 1 : 0,
            }}
          />

          {items.map((a, i) => {
            const itemAccent = parseHex(a.accent || "#34d399");
            // Weight by distance to the pager so the highlight cross-fades
            // during a swipe rather than flipping at the halfway point.
            const w = Math.max(0, 1 - Math.abs(progress - i));
            const isActive = i === activeIndex;
            return (
              <button
                key={`${a.label ?? ""}-${a.title ?? ""}-${i}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-nav-index={i}
                onClick={() => scrollToIndex(i)}
                className="group relative block w-full rounded-r-lg py-2.5 pl-4 pr-2 text-left text-[11px] uppercase leading-snug tracking-[0.16em] transition-colors hover:bg-white/[0.04]"
                style={{
                  fontFamily: "var(--font-body)",
                  color: `rgba(255,255,255,${0.4 + 0.6 * w})`,
                  background: w > 0 ? rgba(itemAccent, 0.05 * w) : undefined,
                }}
              >
                {a.label || a.title || `Announcement ${i + 1}`}
              </button>
            );
          })}
        </div>

        {/* Compact rail — mobile */}
        <div className="flex items-center gap-3 md:hidden" role="tablist" aria-label="All announcements">
          <div className="flex items-center gap-1.5">
            {items.map((a, i) => {
              const itemAccent = parseHex(a.accent || "#34d399");
              const w = Math.max(0, 1 - Math.abs(progress - i));
              const isActive = i === activeIndex;
              return (
                <button
                  key={`${a.label ?? ""}-${a.title ?? ""}-${i}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={a.label || a.title || `Announcement ${i + 1}`}
                  onClick={() => scrollToIndex(i)}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${8 + 20 * w}px`,
                    background: rgba(itemAccent, 0.3 + 0.7 * w),
                    boxShadow: w > 0.5 ? `0 0 10px ${rgba(itemAccent, w)}` : "none",
                  }}
                />
              );
            })}
          </div>
          <span
            className="truncate text-[10px] uppercase tracking-[0.2em] text-white/45"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {items[activeIndex]?.label || items[activeIndex]?.title}
          </span>
        </div>

        <div className="min-w-0">
          <div
            ref={scrollerRef}
            className="snap-pager no-scrollbar relative flex overflow-x-auto overflow-y-hidden"
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
                    "flex w-full min-w-full shrink-0 snap-center justify-center transition-[opacity,filter] duration-300 ease-out",
                    state === "active" && "z-10 opacity-100 blur-0",
                    state === "adjacent" &&
                      "cursor-pointer opacity-[0.14] blur-[3px] hover:opacity-[0.22]",
                    state === "distant" &&
                      "cursor-pointer opacity-[0.06] blur-[4px] hover:opacity-[0.12]"
                  )}
                >
                  <div className="w-full">
                    <AnnouncementCard data={data} animate={i === 0} uniformSize />
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="mt-3 text-[10px] uppercase tracking-[0.22em] text-white/30 md:hidden"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Swipe →
          </div>
        </div>
      </div>
    </div>
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
        <div className="mx-auto max-w-[96rem] px-4 sm:px-8 -mt-4 sm:-mt-2 pb-4 sm:pb-6">
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
