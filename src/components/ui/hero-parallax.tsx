"use client";
import React from "react";
import NextImage from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  MotionValue,
} from "motion/react";
import { ArrowDown, FileDown, Github, Linkedin } from "lucide-react";
import * as LucideIcons from "lucide-react";

const aspectRatioCache = new Map<string, string>();

function clampNumber(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function useMediaQuery(query: string) {
  const getMatch = React.useCallback(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.matchMedia?.(query)?.matches);
  }, [query]);

  const [matches, setMatches] = React.useState<boolean>(getMatch);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia?.(query);
    if (!mql) return;

    const onChange = () => setMatches(Boolean(mql.matches));
    onChange();

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }

    // Safari < 14
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, [query]);

  return matches;
}

function useIsCoarsePointer() {
  // Treat touch-first / coarse-pointer devices as "coarse".
  // Including `(hover: none)` makes this more accurate on some mobile browsers.
  return useMediaQuery("(hover: none), (pointer: coarse)");
}

function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

function horizontalDeltaFromWheelEvent(e: WheelEvent) {
  // Prefer true horizontal input (trackpad / tilt wheel).
  if (e.deltaX !== 0) return e.deltaX;
  // Shift + vertical wheel is commonly used as horizontal scroll.
  if (e.shiftKey && e.deltaY !== 0) return e.deltaY;
  return 0;
}

function isPngIcon(v: unknown): v is string {
  return typeof v === "string" && v.toLowerCase().endsWith(".png");
}

function renderIcon(
  icon: string | undefined,
  {
    size,
    className,
  }: {
    size: number;
    className?: string;
  }
) {
  if (!icon) return null;

  if (isPngIcon(icon)) {
    return (
      <NextImage
        src={icon}
        alt=""
        width={size}
        height={size}
        className={className}
      />
    );
  }

  type LucideIconComponent = React.ComponentType<
    React.SVGProps<SVGSVGElement> & { "aria-hidden"?: boolean }
  >;
  const Icon = (LucideIcons as unknown as Record<string, LucideIconComponent>)[
    icon
  ];

  if (!Icon) return null;
  return <Icon className={className} aria-hidden={true} width={size} height={size} />;
}

type DragAxisLock = "none" | "h" | "v";
function useDragToScrollMotionValue(opts: {
  mv: MotionValue<number>;
  maxPx: number;
  enabled: boolean;
}) {
  const { mv, maxPx, enabled } = opts;
  const stateRef = React.useRef<{
    pointerId: number | null;
    lastX: number;
    lastY: number;
    lock: DragAxisLock;
  }>({ pointerId: null, lastX: 0, lastY: 0, lock: "none" });

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return;
      if (e.pointerType !== "touch" && e.pointerType !== "pen") return;

      stateRef.current.pointerId = e.pointerId;
      stateRef.current.lastX = e.clientX;
      stateRef.current.lastY = e.clientY;
      stateRef.current.lock = "none";
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [enabled]
  );

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return;
      if (stateRef.current.pointerId !== e.pointerId) return;

      const dx = e.clientX - stateRef.current.lastX;
      const dy = e.clientY - stateRef.current.lastY;

      if (stateRef.current.lock === "none") {
        // Decide intent after a small slop so vertical scroll remains natural.
        const slop = 6;
        if (Math.abs(dx) + Math.abs(dy) < slop) return;
        stateRef.current.lock = Math.abs(dx) > Math.abs(dy) * 1.15 ? "h" : "v";
      }

      if (stateRef.current.lock === "h") {
        // We own horizontal pan -> prevent browser from treating it as navigation/scroll.
        e.preventDefault();
        mv.set(clampNumber(mv.get() + dx, -maxPx, maxPx));
      }

      stateRef.current.lastX = e.clientX;
      stateRef.current.lastY = e.clientY;
    },
    [enabled, maxPx, mv]
  );

  const stop = React.useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return;
      if (stateRef.current.pointerId !== e.pointerId) return;
      stateRef.current.pointerId = null;
      stateRef.current.lock = "none";
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // Ignore (capture might already be released).
      }
    },
    [enabled]
  );

  return { onPointerDown, onPointerMove, onPointerUp: stop, onPointerCancel: stop };
}

export type HeroParallaxProduct = {
  title: string;
  /** Short description shown on hover in section view. */
  description?: string;
  link: string;
  thumbnail: string;
  /**
   * Optional aspect ratio for the product card, overriding auto-detection.
   *
   * Examples:
   * - "16 / 9"
   * - "1077 / 1296"
   * - 1.7777778
   */
  aspectRatio?: string | number;
  /**
   * Optional product icon used in the hover title pill (section stage).
   * If omitted/empty, the title occupies the full width.
   *
   * Accepts either:
   * - a png path (e.g. "/github.png")
   * - a Lucide icon name (e.g. "Github", "ExternalLink")
   */
  icon?: string;
  /**
   * Optional extra actions shown on hover (section stage only).
   * Each action renders as a pill button with an icon.
   */
  actions?: Array<{
    /** Button text (optional). */
    label?: string;
    /** Redirect URL. */
    href: string;
    /**
     * Icon to display.
     * Accepts either:
     * - a png path (e.g. "/github.png")
     * - a Lucide icon name (e.g. "Github", "ExternalLink")
     */
    icon: string;
    /** Optional accessibility label (recommended if `label` is omitted). */
    ariaLabel?: string;
  }>;
  /**
   * Optional hover border color (used when the hero header is visible / top stage).
   * Any valid CSS color string, e.g. "#ffffff", "rgb(255 255 255)", "white".
   */
  borderColor?: string;
  /**
   * Which section to render this product into.
   *
   * Expected values match the section ids in this component:
   * - "links"
   * - "research"
   * - "open-source"
   * - "resources"
   */
  tag?: "links" | "research" | "open-source" | "resources";
  /**
   * Optional thumbnail *display* sizing overrides.
   *
   * The rows are horizontally stacked, so a fixed height per section is desired,
   * while the width can vary per product.
   *
   * Recommended usage:
   * - Set `thumbHeightPx` once on (at least) one product per `tag` to define the
   *   common height for that entire section.
   * - Optionally set `thumbWidthPx` per product to force a specific width.
   * - Otherwise, width is derived from `aspectRatio` (or auto-detected).
   */
  thumbHeightPx?: number;
  thumbWidthPx?: number;
  /**
   * Legacy row-based placement (deprecated).
   * Kept only for backwards compatibility; prefer `tag`.
   */
  row?: 1 | 2 | 3;
  /**
   * Order within its row. Lower comes first.
   * If omitted, order falls back to JSON order (stable).
   */
  position?: number;
};

function arrangeProducts(products: HeroParallaxProduct[]) {
  type WithIdx = HeroParallaxProduct & { __idx: number };
  const rows: WithIdx[][] = [[], [], []]; // [research, open-source, resources]
  const unassigned: WithIdx[] = [];

  products.forEach((p, i) => {
    const withIdx: WithIdx = { ...p, __idx: i };
    if (
      withIdx.tag === "research" ||
      withIdx.tag === "open-source" ||
      withIdx.tag === "resources"
    ) {
      type RowTag = Extract<
        NonNullable<HeroParallaxProduct["tag"]>,
        "research" | "open-source" | "resources"
      >;
      const tagToRowIdx: Record<RowTag, number> = {
        research: 0,
        "open-source": 1,
        resources: 2,
      };
      rows[tagToRowIdx[withIdx.tag]].push(withIdx);
      return;
    }

    // Legacy mapping: row 1->research, 2->open-source, 3->resources
    if (withIdx.row === 1 || withIdx.row === 2 || withIdx.row === 3) {
      rows[withIdx.row - 1].push(withIdx);
      return;
    }

    unassigned.push(withIdx);
  });

  // Backwards-compatible placement for products without an explicit `tag`/`row`.
  // Matches the previous slicing behavior: first 5 -> section 1, next 5 -> section 2, next 5 -> section 3.
  unassigned.forEach((p) => {
    const fallbackRowIdx = Math.min(2, Math.floor(p.__idx / 5));
    rows[fallbackRowIdx].push(p);
  });

  const sortRow = (a: WithIdx, b: WithIdx) => {
    const pa = a.position ?? Number.POSITIVE_INFINITY;
    const pb = b.position ?? Number.POSITIVE_INFINITY;
    if (pa !== pb) return pa - pb;
    return a.__idx - b.__idx;
  };

  return {
    firstRow: rows[0].sort(sortRow),
    secondRow: rows[1].sort(sortRow),
    thirdRow: rows[2].sort(sortRow),
  };
}

export const HeroParallax = ({
  products,
}: {
  products: HeroParallaxProduct[];
}) => {
  const isCoarsePointer = useIsCoarsePointer();
  const DEFAULT_THUMB_HEIGHT_PX = isCoarsePointer ? 240 : 420;

  const linksRow = React.useMemo(
    () => products.filter((p) => p.tag === "links"),
    [products]
  );
  const otherProducts = React.useMemo(
    () => products.filter((p) => p.tag !== "links"),
    [products]
  );
  const { firstRow, secondRow, thirdRow } = arrangeProducts(otherProducts);

  // Section-level default thumbnail heights, inferred from the first product that sets it.
  // This makes it easy to keep the same height for all products in a tag without duplication.
  const tagThumbHeightPx = React.useMemo(() => {
    const map: Partial<Record<NonNullable<HeroParallaxProduct["tag"]>, number>> = {};
    for (const p of products) {
      if (!p.tag) continue;
      if (typeof p.thumbHeightPx !== "number" || !Number.isFinite(p.thumbHeightPx)) continue;
      if (map[p.tag] == null) map[p.tag] = p.thumbHeightPx;
    }
    return map;
  }, [products]);

  const getDisplayHeightPx = React.useCallback(
    (p: HeroParallaxProduct) => {
      const fromTag = p.tag ? tagThumbHeightPx[p.tag] : undefined;
      const fromSelf =
        typeof p.thumbHeightPx === "number" && Number.isFinite(p.thumbHeightPx)
          ? p.thumbHeightPx
          : undefined;
      return fromTag ?? fromSelf ?? DEFAULT_THUMB_HEIGHT_PX;
    },
    [tagThumbHeightPx, DEFAULT_THUMB_HEIGHT_PX]
  );

  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const [isHeaderVisible, setIsHeaderVisible] = React.useState(true);
  const [showScrollCue, setShowScrollCue] = React.useState(true);
  const prefersReducedMotion = usePrefersReducedMotion();
  const reduceFancyMotion = isCoarsePointer || prefersReducedMotion;

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };
  const MAX_ROW_SCROLL_PX = 2000;

  // Per-row horizontal scroll offsets (driven by wheel/trackpad while hovering a row).
  const row0Ref = React.useRef<HTMLDivElement | null>(null);
  const row1Ref = React.useRef<HTMLDivElement | null>(null);
  const row2Ref = React.useRef<HTMLDivElement | null>(null);
  const row3Ref = React.useRef<HTMLDivElement | null>(null);
  const row0ScrollRaw = useMotionValue(0);
  const row1ScrollRaw = useMotionValue(0);
  const row2ScrollRaw = useMotionValue(0);
  const row3ScrollRaw = useMotionValue(0);
  const row0Scroll = useSpring(row0ScrollRaw, { stiffness: 250, damping: 35 });
  const row1Scroll = useSpring(row1ScrollRaw, { stiffness: 250, damping: 35 });
  const row2Scroll = useSpring(row2ScrollRaw, { stiffness: 250, damping: 35 });
  const row3Scroll = useSpring(row3ScrollRaw, { stiffness: 250, damping: 35 });

  // Mouse-at-viewport-edge auto scroll (applies to the row currently hovered).
  const hoveredRowRef = React.useRef<{
    mv: MotionValue<number> | null;
  }>({ mv: null });
  const mouseXRef = React.useRef<number | null>(null);
  const edgeRafRef = React.useRef<number | null>(null);
  const edgeLastTRef = React.useRef<number | null>(null);

  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 1000]),
    springConfig
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -1000]),
    springConfig
  );

  const row1Translate = useTransform(
    [translateX, row1Scroll],
    (latest: number[]) => (latest[0] ?? 0) + (latest[1] ?? 0)
  );
  const row2Translate = useTransform(
    [translateXReverse, row2Scroll],
    (latest: number[]) => (latest[0] ?? 0) + (latest[1] ?? 0)
  );
  const row3Translate = useTransform(
    [translateX, row3Scroll],
    (latest: number[]) => (latest[0] ?? 0) + (latest[1] ?? 0)
  );
  const row0Translate = useTransform(
    [translateXReverse, row0Scroll],
    (latest: number[]) => ((latest[0] ?? 0) + 1000) + (latest[1] ?? 0)
  );

  const row0Drag = useDragToScrollMotionValue({
    mv: row0ScrollRaw,
    maxPx: MAX_ROW_SCROLL_PX,
    enabled: isCoarsePointer,
  });
  const row1Drag = useDragToScrollMotionValue({
    mv: row1ScrollRaw,
    maxPx: MAX_ROW_SCROLL_PX,
    enabled: isCoarsePointer,
  });
  const row2Drag = useDragToScrollMotionValue({
    mv: row2ScrollRaw,
    maxPx: MAX_ROW_SCROLL_PX,
    enabled: isCoarsePointer,
  });
  const row3Drag = useDragToScrollMotionValue({
    mv: row3ScrollRaw,
    maxPx: MAX_ROW_SCROLL_PX,
    enabled: isCoarsePointer,
  });

  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [15, 0]),
    springConfig
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [0.2, 1]),
    springConfig
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [20, 0]),
    springConfig
  );
  const translateY = useSpring(
    // Start the parallax stage a bit higher on initial load.
    useTransform(scrollYProgress, [0, 0.2], [-900, 500]),
    springConfig
  );

  React.useEffect(() => {
    const SCROLL_SENSITIVITY = 1;

    const attach = (
      el: HTMLDivElement | null,
      mv: MotionValue<number>
    ) => {
      if (!el) return;
      const onWheel = (e: WheelEvent) => {
        const dx = horizontalDeltaFromWheelEvent(e);
        if (dx === 0) return;

        // deltaMode: 0=pixel, 1=line, 2=page
        const modeScale =
          e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerWidth : 1;
        const scaledDx = dx * modeScale * SCROLL_SENSITIVITY;

        // Prevent the page from scrolling when we are handling horizontal intent.
        e.preventDefault();

        const next = clampNumber(
          mv.get() - scaledDx,
          -MAX_ROW_SCROLL_PX,
          MAX_ROW_SCROLL_PX
        );
        mv.set(next);
      };

      el.addEventListener("wheel", onWheel, { passive: false });
      return () => {
        el.removeEventListener("wheel", onWheel);
      };
    };

    const cleanups = [
      attach(row0Ref.current, row0ScrollRaw),
      attach(row1Ref.current, row1ScrollRaw),
      attach(row2Ref.current, row2ScrollRaw),
      attach(row3Ref.current, row3ScrollRaw),
    ].filter(Boolean) as Array<() => void>;

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [row0ScrollRaw, row1ScrollRaw, row2ScrollRaw, row3ScrollRaw]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
    // Edge auto-scroll is a desktop affordance; keep it off on touch devices.
    if (window.matchMedia?.("(hover: none), (pointer: coarse)")?.matches) return;

    const EDGE_PX = 300;
    const MAX_SPEED_PX_PER_S = 1000;

    const stop = () => {
      if (edgeRafRef.current != null) {
        cancelAnimationFrame(edgeRafRef.current);
        edgeRafRef.current = null;
      }
      edgeLastTRef.current = null;
    };

    const edgeDxPerSecond = (x: number, w: number) => {
      const leftProximityPx = EDGE_PX - x;
      if (leftProximityPx > 0) {
        const t = clampNumber(leftProximityPx / EDGE_PX, 0, 1);
        return -MAX_SPEED_PX_PER_S * t * t;
      }

      const rightProximityPx = x - (w - EDGE_PX);
      if (rightProximityPx > 0) {
        const t = clampNumber(rightProximityPx / EDGE_PX, 0, 1);
        return MAX_SPEED_PX_PER_S * t * t;
      }

      return 0;
    };

    const tick = (now: number) => {
      const mv = hoveredRowRef.current.mv;
      const x = mouseXRef.current;

      if (!mv || x == null) {
        stop();
        return;
      }

      const dxPerS = edgeDxPerSecond(x, window.innerWidth);
      if (dxPerS === 0) {
        stop();
        return;
      }

      const last = edgeLastTRef.current ?? now;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      edgeLastTRef.current = now;

      // Mirror the wheel handler: mv <- mv - dx
      const next = clampNumber(
        mv.get() - dxPerS * dt,
        -MAX_ROW_SCROLL_PX,
        MAX_ROW_SCROLL_PX
      );
      mv.set(next);

      edgeRafRef.current = requestAnimationFrame(tick);
    };

    const maybeStart = () => {
      if (edgeRafRef.current != null) return;
      edgeRafRef.current = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      mouseXRef.current = e.clientX;
      const mv = hoveredRowRef.current.mv;
      if (!mv) {
        stop();
        return;
      }
      const dxPerS = edgeDxPerSecond(e.clientX, window.innerWidth);
      if (dxPerS === 0) {
        stop();
        return;
      }
      maybeStart();
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      stop();
    };
  }, []);

  React.useEffect(() => {
    // `scrollYProgress` is relative to this component's container, so it's a
    // better signal for "Header is visible" than `window.scrollY`.
    const HEADER_VISIBLE_THRESHOLD = 0.03;
    const SCROLL_CUE_VISIBLE_THRESHOLD = 0.004;
    const unsubscribe = scrollYProgress.on("change", (v) => {
      setIsHeaderVisible(v <= HEADER_VISIBLE_THRESHOLD);
      setShowScrollCue(v <= SCROLL_CUE_VISIBLE_THRESHOLD);
    });
    return () => {
      unsubscribe();
    };
  }, [scrollYProgress]);

  return (
    <div
      ref={ref}
      className="h-[260vh] sm:h-[320vh] md:h-[400vh] py-16 md:py-40 overflow-hidden antialiased relative flex flex-col self-auto perspective-[1000px] transform-3d"
    >
      <Header showScrollCue={showScrollCue} />
      <motion.div
        style={{
          rotateX: reduceFancyMotion ? 0 : rotateX,
          rotateZ: reduceFancyMotion ? 0 : rotateZ,
          translateY: reduceFancyMotion ? 0 : translateY,
          opacity,
        }}
        className="relative z-0"
      >
        <section aria-label="Links" className="mb-20">
          <motion.div
            ref={row0Ref}
            {...row0Drag}
            onPointerEnter={() => {
              hoveredRowRef.current.mv = row0ScrollRaw;
            }}
            onPointerLeave={() => {
              if (hoveredRowRef.current.mv === row0ScrollRaw) {
                hoveredRowRef.current.mv = null;
              }
            }}
            className="flex flex-row space-x-10 md:space-x-20 touch-pan-y"
          >
            {linksRow.map((product, idx) => (
              <ProductCard
                product={product}
                translate={row0Translate}
                displayHeightPx={getDisplayHeightPx(product)}
                scrollToId="links"
                centerOnClickMv={row0ScrollRaw}
                maxRowScrollPx={MAX_ROW_SCROLL_PX}
                isHeaderVisible={isHeaderVisible}
                isCoarsePointer={isCoarsePointer}
                key={`${product.title}-${product.thumbnail}-${product.link}-${idx}`}
              />
            ))}
          </motion.div>
        </section>

        <section aria-label="Research" className="mb-20">
          <div id="research" className="scroll-mt-40 px-4 mb-6">
            <span className="text-3xl sm:text-5xl font-extrabold text-black dark:text-white">
              Research
            </span>
          </div>
          <motion.div
            ref={row1Ref}
            {...row1Drag}
            onPointerEnter={() => {
              if (isCoarsePointer) return;
              hoveredRowRef.current.mv = row1ScrollRaw;
            }}
            onPointerLeave={() => {
              if (isCoarsePointer) return;
              if (hoveredRowRef.current.mv === row1ScrollRaw) {
                hoveredRowRef.current.mv = null;
              }
            }}
            className="flex flex-row-reverse space-x-reverse space-x-10 md:space-x-20 touch-pan-y"
          >
            {firstRow.map((product, idx) => (
              <ProductCard
                product={product}
                translate={row1Translate}
                displayHeightPx={getDisplayHeightPx(product)}
                scrollToId="research"
                centerOnClickMv={row1ScrollRaw}
                maxRowScrollPx={MAX_ROW_SCROLL_PX}
                isHeaderVisible={isHeaderVisible}
                isCoarsePointer={isCoarsePointer}
                key={`${product.title}-${product.thumbnail}-${product.link}-${idx}`}
              />
            ))}
          </motion.div>
        </section>

        <section aria-label="Open Source" className="mb-20">
          <div id="open-source" className="scroll-mt-40 px-4 mb-6">
          <span className="text-3xl sm:text-5xl font-extrabold text-black dark:text-white">
          Open Source
            </span>
          </div>
          <motion.div
            ref={row2Ref}
            {...row2Drag}
            onPointerEnter={() => {
              if (isCoarsePointer) return;
              hoveredRowRef.current.mv = row2ScrollRaw;
            }}
            onPointerLeave={() => {
              if (isCoarsePointer) return;
              if (hoveredRowRef.current.mv === row2ScrollRaw) {
                hoveredRowRef.current.mv = null;
              }
            }}
            className="flex flex-row space-x-10 md:space-x-20 touch-pan-y"
          >
            {secondRow.map((product, idx) => (
              <ProductCard
                product={product}
                translate={row2Translate}
                displayHeightPx={getDisplayHeightPx(product)}
                scrollToId="open-source"
                centerOnClickMv={row2ScrollRaw}
                maxRowScrollPx={MAX_ROW_SCROLL_PX}
                isHeaderVisible={isHeaderVisible}
                isCoarsePointer={isCoarsePointer}
                key={`${product.title}-${product.thumbnail}-${product.link}-${idx}`}
              />
            ))}
          </motion.div>
        </section>

        <section aria-label="Resources">
          <div id="resources" className="scroll-mt-40 px-4 mb-6">
          <span className="text-3xl sm:text-5xl font-extrabold text-black dark:text-white">
          Resources
            </span>
          </div>
          <motion.div
            ref={row3Ref}
            {...row3Drag}
            onPointerEnter={() => {
              if (isCoarsePointer) return;
              hoveredRowRef.current.mv = row3ScrollRaw;
            }}
            onPointerLeave={() => {
              if (isCoarsePointer) return;
              if (hoveredRowRef.current.mv === row3ScrollRaw) {
                hoveredRowRef.current.mv = null;
              }
            }}
            className="flex flex-row-reverse space-x-reverse space-x-10 md:space-x-20 touch-pan-y"
          >
            {thirdRow.map((product, idx) => (
              <ProductCard
                product={product}
                translate={row3Translate}
                displayHeightPx={getDisplayHeightPx(product)}
                scrollToId="resources"
                centerOnClickMv={row3ScrollRaw}
                maxRowScrollPx={MAX_ROW_SCROLL_PX}
                isHeaderVisible={isHeaderVisible}
                isCoarsePointer={isCoarsePointer}
                key={`${product.title}-${product.thumbnail}-${product.link}-${idx}`}
              />
            ))}
          </motion.div>
        </section>
      </motion.div>
    </div>
  );
};

export const Header = ({ showScrollCue }: { showScrollCue: boolean }) => {
  const rafRef = React.useRef<number | null>(null);

  const getDocumentTopPx = React.useCallback((el: HTMLElement) => {
    // Compute layout top, ignoring CSS transforms (important for Motion-transformed content).
    let top = 0;
    let node: HTMLElement | null = el;
    while (node) {
      top += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }
    return top;
  }, []);

  const animateScrollTo = React.useCallback((targetY: number, durationMs: number) => {
    if (typeof window === "undefined") return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      window.scrollTo({ top: targetY });
      return;
    }

    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const startY = window.scrollY;
    const delta = targetY - startY;
    const startT = performance.now();

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startT) / durationMs);
      const eased = easeInOutCubic(t);
      window.scrollTo({ top: startY + delta * eased });
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const scrollTo = React.useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;
      const NAV_OFFSET_PX = -450; // aligns with `scroll-mt-40` used on section headings
      const y = Math.max(0, getDocumentTopPx(el) - NAV_OFFSET_PX);
      animateScrollTo(y, 900);
    },
    [animateScrollTo, getDocumentTopPx]
  );

  const pillClassName =
    "inline-flex items-center rounded-full border bg-white/70 px-4 py-2 text-sm md:text-base font-medium shadow-sm backdrop-blur transition-colors duration-250 ease-out " +
    "border-black/20 text-black " +
    "hover:bg-black hover:text-white hover:border-black/70 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 " +
    "dark:border-white/20 dark:bg-black/40 dark:text-white " +
    "dark:hover:bg-white dark:hover:text-black dark:hover:border-white/70 " +
    "dark:focus-visible:ring-white/40";

  const iconPillClassName =
    "group inline-flex items-center justify-center rounded-full border bg-white/70 shadow-sm backdrop-blur transition-all duration-250 ease-out transform-gpu " +
    "h-10 w-10 md:h-11 md:w-11 " +
    "border-black/20 text-black " +
    "hover:bg-black hover:text-white hover:border-black/70 hover:scale-[1.04] " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 " +
    "dark:border-white/20 dark:bg-black/40 dark:text-white " +
    "dark:hover:bg-white dark:hover:text-black dark:hover:border-white/70 " +
    "dark:focus-visible:ring-white/40";

  const cvPillClassName =
    "inline-flex items-center gap-2 rounded-full border bg-white/70 px-4 py-2 text-sm md:text-base font-medium shadow-sm backdrop-blur transition-colors duration-250 ease-out " +
    "border-black/20 text-black " +
    "hover:bg-black hover:text-white hover:border-black/70 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 " +
    "dark:border-white/20 dark:bg-black/40 dark:text-white " +
    "dark:hover:bg-white dark:hover:text-black dark:hover:border-white/70 " +
    "dark:focus-visible:ring-white/40";

  return (
    <div className="max-w-7xl relative z-50 isolate pointer-events-auto mx-auto pt-10 md:pt-14 px-2 w-full">
      <div className="mx-auto w-full max-w-184 text-center flex flex-col items-center">
        <h1 className="text-3xl md:text-7xl lg:text-8xl font-bold tracking-tight dark:text-white">
          Alberto
        </h1>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        
          <button
            type="button"
            onClick={() => scrollTo("research")}
            className={pillClassName}
          >
            Research
          </button>
          <button
            type="button"
            onClick={() => scrollTo("open-source")}
            className={pillClassName}
          >
            Open Source
          </button>
          <button
            type="button"
            onClick={() => scrollTo("resources")}
            className={pillClassName}
          >
            Resources
          </button>
        </div>
        <div className="mt-5 flex items-center justify-center gap-3">
          <a
            href="https://github.com/alberto-rota"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className={iconPillClassName}
          >
            <Github className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
          </a>
          <a
            href="https://www.linkedin.com/in/albe-rota/"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className={iconPillClassName}
          >
            <Linkedin className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
          </a>
          <a
            href="/CV_Alberto_Rota.pdf"
            download
            aria-label="Download my CV"
            className={cvPillClassName}
          >
            <FileDown className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
            <span>Download my CV</span>
          </a>
        </div>

        {/* Scroll cue inside the header; fades out once the user scrolls. */}
        <div
          className={[
            "mt-10 flex items-center justify-center pointer-events-none",
            "text-black/70 dark:text-white/70",
            "transition-opacity duration-300 ease-out",
            showScrollCue ? "opacity-100" : "opacity-0",
          ].join(" ")}
        >
          <ArrowDown
            className="h-12 w-12 md:h-14 md:w-14"
            aria-hidden="true"
          />
          <span className="sr-only">Scroll down</span>
        </div>
        <p className="max-w-2xl text-base md:text-xl mt-8 dark:text-neutral-200"></p>
      </div>
    </div>
  );
};

export const ProductCard = ({
  product,
  translate,
  displayHeightPx,
  scrollToId,
  centerOnClickMv,
  maxRowScrollPx,
  isHeaderVisible,
  isCoarsePointer,
}: {
  product: HeroParallaxProduct;
  translate: MotionValue<number>;
  /** Target rendered card height in px (width is derived from AR or optional override). */
  displayHeightPx: number;
  /**
   * Optional in-page anchor id to scroll to when the page is at the very top
   * (i.e. when the Hero header is visible).
   */
  scrollToId?: string;
  /**
   * Optional row scroll MotionValue to recenter this card horizontally when the
   * top-stage click override (scroll-to-section) is used.
   */
  centerOnClickMv?: MotionValue<number>;
  /**
   * Clamp range for `centerOnClickMv` (should match the parent row's max).
   */
  maxRowScrollPx?: number;
  /**
   * When true, clicking a product scrolls to `scrollToId` instead of navigating
   * to `product.link`.
   */
  isHeaderVisible?: boolean;
  /** If true, avoid hover-only UI and show touch-safe affordances. */
  isCoarsePointer?: boolean;
}) => {
  const [aspectRatio, setAspectRatio] = React.useState<string>(() => {
    if (typeof product.aspectRatio === "string" && product.aspectRatio.trim()) {
      return product.aspectRatio.trim();
    }
    if (typeof product.aspectRatio === "number" && Number.isFinite(product.aspectRatio)) {
      return String(product.aspectRatio);
    }
    return aspectRatioCache.get(product.thumbnail) ?? "1 / 1";
  });
  const [descHeightPx, setDescHeightPx] = React.useState<number>(64);
  const descRef = React.useRef<HTMLDivElement | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const isTouch = Boolean(isCoarsePointer);
  const hoverEnabled = !isHeaderVisible && !isTouch;
  const topStageBorderEnabled = Boolean(isHeaderVisible);
  const topStageHoverBorderColor = (product.borderColor?.trim() || "#ffffff") as string;
  const descriptionText = product.description?.trim() ?? "";
  const revealDescription = (hoverEnabled || (!isHeaderVisible && isTouch)) && descriptionText.length > 0;
  const actions = Array.isArray(product.actions)
    ? product.actions.filter((a) => Boolean(a?.href && a?.icon))
    : [];

  const sectionStageTouch = !isHeaderVisible && isTouch;
  const topStageTouch = Boolean(isHeaderVisible) && isTouch;

  type RevealVarsStyle = React.CSSProperties & {
    ["--desc-reveal"]?: string;
  };

  type TopStageBorderStyle = React.CSSProperties & {
    ["--top-stage-hover-border-color"]?: string;
  };
  const topStageBorderStyle: TopStageBorderStyle = {
    ["--top-stage-hover-border-color"]: topStageHoverBorderColor,
  };

  const actionPillClassName =
    "inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-2 text-xs md:text-sm font-medium shadow-sm backdrop-blur transition-colors duration-250 ease-out " +
    "border-black/20 text-black " +
    "hover:bg-black hover:text-white hover:border-black/70 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 " +
    "dark:border-white/20 dark:bg-black/40 dark:text-white " +
    "dark:hover:bg-white dark:hover:text-black dark:hover:border-white/70 " +
    "dark:focus-visible:ring-white/40";

  React.useEffect(() => {
    // If a per-product aspect ratio is provided, always prefer it (no auto-detection).
    if (typeof product.aspectRatio === "string" && product.aspectRatio.trim()) {
      setAspectRatio(product.aspectRatio.trim());
      return;
    }
    if (typeof product.aspectRatio === "number" && Number.isFinite(product.aspectRatio)) {
      setAspectRatio(String(product.aspectRatio));
      return;
    }

    const cached = aspectRatioCache.get(product.thumbnail);
    if (cached) {
      setAspectRatio(cached);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.decoding = "async";
    img.src = product.thumbnail;
    img.onload = () => {
      if (cancelled) return;
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        const ar = `${img.naturalWidth} / ${img.naturalHeight}`;
        aspectRatioCache.set(product.thumbnail, ar);
        setAspectRatio(ar);
      }
    };

    return () => {
      cancelled = true;
    };
  }, [product.thumbnail, product.aspectRatio]);

  React.useEffect(() => {
    if (!revealDescription) return;
    const el = descRef.current;
    if (!el) return;

    const measure = () => {
      // Keep the old baseline (64px) but allow full content height.
      setDescHeightPx(Math.max(64, Math.ceil(el.scrollHeight)));
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [revealDescription, descriptionText]);
  
  const getDocumentTopPx = (el: HTMLElement) => {
    // Compute layout top, ignoring CSS transforms (important for Motion-transformed content).
    let top = 0;
    let node: HTMLElement | null = el;
    while (node) {
      top += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }
    return top;
  };

  const animateScrollTo = (targetY: number, durationMs: number) => {
    if (typeof window === "undefined") return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      window.scrollTo({ top: targetY });
      return;
    }

    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const startY = window.scrollY;
    const delta = targetY - startY;
    const startT = performance.now();

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startT) / durationMs);
      const eased = easeInOutCubic(t);
      window.scrollTo({ top: startY + delta * eased });
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  const centerSelfInViewport = React.useCallback(
    (anchorEl: HTMLElement) => {
      if (typeof window === "undefined") return;
      const mv = centerOnClickMv;
      if (!mv) return;
      const max = maxRowScrollPx ?? 2000;

      const viewportCenterX = window.innerWidth / 2;
      const rect = anchorEl.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const deltaX = viewportCenterX - cardCenterX;
      if (Math.abs(deltaX) < 0.5) return;

      mv.set(clampNumber(mv.get() + deltaX, -max, max));

      // Correct once after Motion applies the new transform.
      requestAnimationFrame(() => {
        const rect2 = anchorEl.getBoundingClientRect();
        const cardCenterX2 = rect2.left + rect2.width / 2;
        const deltaX2 = viewportCenterX - cardCenterX2;
        if (Math.abs(deltaX2) < 0.5) return;
        mv.set(clampNumber(mv.get() + deltaX2, -max, max));
      });
    },
    [centerOnClickMv, maxRowScrollPx]
  );

  const onProductClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only override the click when the Hero header is visible.
    // Otherwise, preserve the original navigation to `product.link`.
    if (!scrollToId) return;
    if (typeof window === "undefined") return;
    if (!isHeaderVisible) return;

    const el = document.getElementById(scrollToId);
    if (!el) return;

    e.preventDefault();
    centerSelfInViewport(e.currentTarget);
    const NAV_OFFSET_PX = -450;
    const y = Math.max(0, getDocumentTopPx(el) - NAV_OFFSET_PX);
    animateScrollTo(y, 900);
  };

  return (
    <motion.div
      style={(() => {
        const widthPx =
          typeof product.thumbWidthPx === "number" && Number.isFinite(product.thumbWidthPx)
            ? product.thumbWidthPx
            : undefined;
        return widthPx != null
          ? {
              x: translate,
              width: widthPx,
              height: displayHeightPx,
            }
          : {
              x: translate,
              height: displayHeightPx,
              aspectRatio,
            };
      })()}
      whileHover={
        hoverEnabled
          ? {
              y: -20,
            }
          : undefined
      }
      key={product.title}
      className={
        "group/product relative shrink-0 " +
        // Allow the always-visible description on touch to extend below the image.
        (sectionStageTouch ? "overflow-visible" : "overflow-hidden") +
        " rounded-2xl"
      }
    >
      <div className="block w-full h-full relative group-hover/product:shadow-2xl">
        {/**
         * When a description exists (section stage), we "reveal" it by extending the
         * container height by the real description height and translating it upward on hover.
         * This avoids truncation / ellipses entirely.
         */}
        <div
          className={[
            "relative grid w-full h-full transition-transform duration-300 ease-out",
            hoverEnabled && revealDescription ? "group-hover/product:-translate-y-(--desc-reveal)" : "",
          ].join(" ")}
          style={
            revealDescription
              ? ({
                  ["--desc-reveal"]: `${descHeightPx}px`,
                  height: "calc(100% + var(--desc-reveal))",
                  gridTemplateRows: "1fr var(--desc-reveal)",
                } as RevealVarsStyle)
              : {
                  height: "100%",
                  gridTemplateRows: "1fr",
                }
          }
        >
          <div className="relative w-full h-full overflow-hidden rounded-2xl">
            {/* Primary click target (kept as a real link for semantics). */}
            <a
              href={product.link}
              onClick={onProductClick}
              aria-label={product.title}
              className="absolute inset-0 z-20 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 dark:focus-visible:ring-white/40"
            />
            <NextImage
              src={product.thumbnail}
              alt={product.title}
              fill
              sizes="(min-width: 768px) 480px, 90vw"
              className="absolute inset-0 h-full w-full object-cover object-center rounded-2xl"
              loading="lazy"
              priority={false}
            />

            {/* Top stage (header visible): show a white border on hover. */}
            {topStageBorderEnabled ? (
              <div
                style={topStageBorderStyle}
                className={[
                  "absolute inset-0 rounded-2xl border-2 transition-colors duration-200 ease-out pointer-events-none",
                  topStageTouch
                    ? "border-(--top-stage-hover-border-color)"
                    : "border-transparent group-hover/product:border-(--top-stage-hover-border-color)",
                ].join(" ")}
              />
            ) : null}

            {/* Top stage (header visible): show centered title on hover. */}
            {topStageBorderEnabled ? (
              <div
                className={[
                  "absolute inset-0 flex items-center justify-center transition-opacity duration-200 ease-out pointer-events-none",
                  topStageTouch ? "opacity-100" : "opacity-0 group-hover/product:opacity-100",
                ].join(" ")}
              >
                <div className="rounded-xl bg-black/45 px-4 py-2 backdrop-blur-sm">
                  <span className="text-white text-base md:text-lg font-semibold leading-tight">
                    {product.title}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Lighter overlay + icon/title (only in section stage). */}
            {hoverEnabled || sectionStageTouch ? (
              <>
                <div
                  className={[
                    "absolute inset-0 h-full w-full bg-black pointer-events-none transition-opacity duration-200 ease-out",
                    sectionStageTouch ? "opacity-25" : "opacity-0 group-hover/product:opacity-35",
                  ].join(" ")}
                ></div>
                {/* Title label (non-interactive) */}
                <div
                  className={[
                    "absolute bottom-4 left-4 right-4 transition-opacity duration-200 ease-out pointer-events-none",
                    sectionStageTouch ? "opacity-100" : "opacity-0 group-hover/product:opacity-100",
                  ].join(" ")}
                >
                  <div className="w-full rounded-xl bg-black/50 px-3 py-2 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      {product.icon ? (
                        <div className="w-1/8 flex items-center justify-center">
                          {renderIcon(product.icon, {
                            size: 44,
                            className: "h-11 w-11 rounded-lg",
                          })}
                        </div>
                      ) : null}
                      <div className={product.icon ? "w-7/8" : "w-full"}>
                        <h2 className="text-white text-sm md:text-base font-semibold leading-tight">
                          {product.title}
                        </h2>
                      </div>
                    </div>
                    {sectionStageTouch && descriptionText.length > 0 ? (
                      <p
                        className="mt-2 text-xs sm:text-sm font-normal leading-snug text-white/90 overflow-hidden [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical]"
                        style={{ fontFamily: "var(--font-bbh-bogle)" }}
                      >
                        {descriptionText}
                      </p>
                    ) : null}
                    {sectionStageTouch && actions.length > 0 ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {actions.map((action, i) => (
                          <a
                            key={`${action.href}-${action.icon}-${action.label ?? ""}-${i}`}
                            href={action.href}
                            aria-label={
                              action.ariaLabel ?? action.label ?? `${product.title} action`
                            }
                            className={actionPillClassName + " touch-manipulation"}
                          >
                            {renderIcon(action.icon, {
                              size: 18,
                              className: "h-[18px] w-[18px] rounded-[4px]",
                            })}
                            {action.label ? (
                              <span className="leading-none">{action.label}</span>
                            ) : null}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Action buttons overlay (interactive; section stage only). */}
                {actions.length > 0 && (hoverEnabled || sectionStageTouch) ? (
                  <div
                    className={[
                      "absolute inset-0 z-30 flex items-center justify-center transition-opacity duration-200 ease-out",
                      sectionStageTouch
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 group-hover/product:opacity-100 pointer-events-none group-hover/product:pointer-events-auto",
                    ].join(" ")}
                  >
                    <div className="w-[90%] max-w-[90%]">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {actions.map((action, i) => (
                          <a
                            key={`${action.href}-${action.icon}-${action.label ?? ""}-${i}`}
                            href={action.href}
                            aria-label={
                              action.ariaLabel ?? action.label ?? `${product.title} action`
                            }
                            className={actionPillClassName}
                          >
                            {renderIcon(action.icon, {
                              size: 18,
                              className: "h-[18px] w-[18px] rounded-[4px]",
                            })}
                            {action.label ? (
                              <span className="leading-none">{action.label}</span>
                            ) : null}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>

          {revealDescription ? (
            <div
              ref={descRef}
              className="min-h-16 px-4 py-3 bg-white/80 dark:bg-black/60 text-black dark:text-white flex items-start"
            >
              <p
                className="text-lg md:text-xl font-light leading-snug whitespace-normal wrap-break-word"
                style={{ fontFamily: "var(--font-bbh-bogle)" }}
              >
                {descriptionText}
              </p>
            </div>
          ) : null}
        </div>

      </div>
    </motion.div>
  );
};


