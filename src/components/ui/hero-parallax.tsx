"use client";
import React from "react";
import NextImage from "next/image";
import { createPortal } from "react-dom";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  MotionValue,
} from "motion/react";
import {
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileDown,
  Pause,
  Play,
  Send,
  X,
} from "lucide-react";
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

function isSvgPath(v: unknown): v is string {
  return typeof v === "string" && v.toLowerCase().endsWith(".svg");
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

        // Avoid prematurely locking vertical on slightly diagonal horizontal swipes.
        // We only lock once the intent is clear; otherwise keep accumulating deltas.
        const H_BIAS = 1.05;
        const V_BIAS = 1.05;
        if (Math.abs(dx) > Math.abs(dy) * H_BIAS) {
          stateRef.current.lock = "h";
        } else if (Math.abs(dy) > Math.abs(dx) * V_BIAS) {
          stateRef.current.lock = "v";
        } else {
          return;
        }
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

type HeroParallaxProduct = {
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
    /** Redirect URL (required unless `kind` is "open-viewer"). */
    href?: string;
    /**
     * Icon to display.
     * Accepts either:
     * - a png path (e.g. "/github.png")
     * - a Lucide icon name (e.g. "Github", "ExternalLink")
     */
    icon: string;
    /** Optional accessibility label (recommended if `label` is omitted). */
    ariaLabel?: string;
    /**
     * Optional special action.
     * - "open-viewer": opens the in-page viewer modal for this product (if any)
     */
    kind?: "open-viewer";
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
  /**
   * Optional rich viewer for non-standard assets (e.g. PowerPoint decks).
   * If present, the product card can open an in-page modal viewer (section stage only).
   */
  viewer?:
    | {
        kind: "ppt-slideshow";
        /** Title shown in the viewer header (defaults to product.title). */
        title?: string;
        /**
         * Slide path generator.
         * Example: prefix "/resources/my-deck/slides/slide-" + pad 2 -> slide-01.svg
         */
        slides: {
          prefix: string;
          count: number;
          pad?: number;
          ext?: string; // e.g. "webp" | "png" | "jpg" | "svg"
        };
        /** Optional download link for the original file (e.g. .pptx). */
        downloadHref?: string;
        /** Autoplay interval in ms (disabled when prefers-reduced-motion). */
        autoplayMs?: number;
        /** Optional fixed aspect ratio (defaults to 16/9). */
        aspectRatio?: string | number;
      }
    | {
        /**
         * Online PPTX viewer via Microsoft Office for the web.
         * NOTE: the PPTX must be publicly reachable over HTTPS for Office to fetch it.
         */
        kind: "pptx-office";
        title?: string;
        /** PPTX path or URL. If relative ("/..."), it will be resolved against window.location.origin. */
        pptxHref: string;
        /** Optional download link for the file (defaults to `pptxHref`). */
        downloadHref?: string;
      };
};

export type { HeroParallaxProduct };

type HeroParallaxSectionId = "links" | "research" | "open-source" | "resources";

type HeroParallaxSectionConfig = {
  /**
   * Horizontal gap between cards (px) for this section (mobile/default).
   * Previously hardcoded as Tailwind `gap-10` (40px).
   */
  gapPx?: number;
  /**
   * Horizontal gap between cards (px) for this section at `md` breakpoint and above.
   * Previously hardcoded as Tailwind `md:gap-20` (80px).
   */
  gapMdPx?: number;
  /**
   * Initial horizontal scroll offset (px) for this section.
   * Positive/negative values are allowed.
   */
  initialScrollPx?: number;
};

export type { HeroParallaxSectionId, HeroParallaxSectionConfig };

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
  sections,
}: {
  products: HeroParallaxProduct[];
  sections?: Partial<Record<HeroParallaxSectionId, HeroParallaxSectionConfig>>;
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
  // Mobile should still start in the "parallax stage" (so the initial view isn't the
  // scrolled-down/section view), but we avoid heavy 3D rotations on coarse pointers.
  const reduce3dMotion = isCoarsePointer || prefersReducedMotion;

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };
  const MAX_ROW_SCROLL_PX = 2000;

  const clampFinite = React.useCallback(
    (v: unknown, fallback: number) => {
      const n = typeof v === "number" ? v : Number.NaN;
      return Number.isFinite(n) ? n : fallback;
    },
    []
  );

  const getSectionCfg = React.useCallback(
    (id: HeroParallaxSectionId) => {
      const DEFAULT_GAP_PX = 40; // Tailwind `gap-10`
      const DEFAULT_GAP_MD_PX = 80; // Tailwind `md:gap-20`
      const cfg = sections?.[id];
      return {
        gapPx: clampFinite(cfg?.gapPx, DEFAULT_GAP_PX),
        gapMdPx: clampFinite(cfg?.gapMdPx, DEFAULT_GAP_MD_PX),
        initialScrollPx: clampNumber(
          clampFinite(cfg?.initialScrollPx, 0),
          -MAX_ROW_SCROLL_PX,
          MAX_ROW_SCROLL_PX
        ),
      };
    },
    [MAX_ROW_SCROLL_PX, clampFinite, sections]
  );

  type GapVarsStyle = React.CSSProperties & {
    ["--gap"]?: string;
    ["--gap-md"]?: string;
  };

  const gapVars = React.useMemo(() => {
    const links = getSectionCfg("links");
    const research = getSectionCfg("research");
    const openSource = getSectionCfg("open-source");
    const resources = getSectionCfg("resources");
    return {
      linksStyle: { ["--gap"]: `${links.gapPx}px`, ["--gap-md"]: `${links.gapMdPx}px` } as GapVarsStyle,
      researchStyle: { ["--gap"]: `${research.gapPx}px`, ["--gap-md"]: `${research.gapMdPx}px` } as GapVarsStyle,
      openSourceStyle: {
        ["--gap"]: `${openSource.gapPx}px`,
        ["--gap-md"]: `${openSource.gapMdPx}px`,
      } as GapVarsStyle,
      resourcesStyle: {
        ["--gap"]: `${resources.gapPx}px`,
        ["--gap-md"]: `${resources.gapMdPx}px`,
      } as GapVarsStyle,
      initial: {
        links: links.initialScrollPx,
        research: research.initialScrollPx,
        openSource: openSource.initialScrollPx,
        resources: resources.initialScrollPx,
      },
    };
  }, [getSectionCfg]);

  // Per-row horizontal scroll offsets (driven by wheel/trackpad while hovering a row).
  const row0Ref = React.useRef<HTMLDivElement | null>(null);
  const row1Ref = React.useRef<HTMLDivElement | null>(null);
  const row2Ref = React.useRef<HTMLDivElement | null>(null);
  const row3Ref = React.useRef<HTMLDivElement | null>(null);
  const row0ScrollRaw = useMotionValue(gapVars.initial.links);
  const row1ScrollRaw = useMotionValue(gapVars.initial.research);
  const row2ScrollRaw = useMotionValue(gapVars.initial.openSource);
  const row3ScrollRaw = useMotionValue(gapVars.initial.resources);
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
  const mobileStartY = -600;
  const desktopStartY = -900;
  const mobileEndY = 350;
  const desktopEndY = 500;
  const translateY = useSpring(
    // Start the parallax stage a bit higher on initial load.
    useTransform(scrollYProgress, [0, 0.2], [
      isCoarsePointer ? mobileStartY : desktopStartY,
      isCoarsePointer ? mobileEndY : desktopEndY,
    ]),
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
      className="min-h-[185vh] sm:min-h-[220vh] md:min-h-[255vh] py-14 md:py-24 overflow-hidden antialiased relative flex flex-col self-auto perspective-[1000px] transform-3d"
    >
      <Header showScrollCue={showScrollCue} />
      <motion.div
        style={{
          rotateX: reduce3dMotion ? 0 : rotateX,
          rotateZ: reduce3dMotion ? 0 : rotateZ,
          // Keep vertical parallax on mobile (unless user requests reduced motion).
          translateY: prefersReducedMotion ? 0 : translateY,
          opacity,
        }}
        className="relative z-0"
      >
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
            style={gapVars.researchStyle}
            className="flex flex-row-reverse gap-(--gap) md:gap-(--gap-md) touch-pan-y"
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
            style={gapVars.openSourceStyle}
            className="flex flex-row gap-(--gap) md:gap-(--gap-md) touch-pan-y"
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
            style={gapVars.resourcesStyle}
            className="flex flex-row-reverse gap-(--gap) md:gap-(--gap-md) touch-pan-y"
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

        <section aria-label="Links" className="mb-8">
          <div id="links" className="scroll-mt-40 px-4 mb-6" />
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
            style={gapVars.linksStyle}
            className="flex flex-row gap-(--gap) md:gap-(--gap-md) touch-pan-y"
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

  const cvPillClassName =
    "inline-flex items-center gap-2 rounded-full border bg-white/70 px-4 py-2 text-sm md:text-base font-medium shadow-sm backdrop-blur transition-colors duration-250 ease-out " +
    "border-black/20 text-black " +
    "hover:bg-black hover:text-white hover:border-black/70 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 " +
    "dark:border-white/20 dark:bg-black/40 dark:text-white " +
    "dark:hover:bg-white dark:hover:text-black dark:hover:border-white/70 " +
    "dark:focus-visible:ring-white/40";

  return (
    <div className="max-w-7xl relative z-50 isolate pointer-events-none mx-auto pt-10 md:pt-14 px-2 w-full">
      {/*
        Preserve original layout/position, but shrink the "blocking" area:
        - Containers are pointer-events-none (so empty space doesn't block hover).
        - Only real visible/interactive elements are pointer-events-auto.
      */}
      <div className="mx-auto w-full max-w-184 text-center flex flex-col items-center pointer-events-none">
        <h1 className="inline-block pointer-events-auto text-3xl md:text-7xl lg:text-8xl font-bold tracking-tight dark:text-white">
          Alberto
        </h1>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 pointer-events-none">
        
          <button
            type="button"
            onClick={() => scrollTo("research")}
            className={pillClassName + " pointer-events-auto"}
          >
            Research
          </button>
          <button
            type="button"
            onClick={() => scrollTo("open-source")}
            className={pillClassName + " pointer-events-auto"}
          >
            Open Source
          </button>
          <button
            type="button"
            onClick={() => scrollTo("resources")}
            className={pillClassName + " pointer-events-auto"}
          >
            Resources
          </button>
        </div>
        <div className="mt-5 flex items-center justify-center gap-3 pointer-events-none">
          <button
            type="button"
            onClick={() => scrollTo("contact")}
            aria-label="Get in touch"
            className={cvPillClassName + " pointer-events-auto"}
          >
            <Send className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
            <span>Get in touch</span>
          </button>
          <a
            href="/CV_Alberto_Rota.pdf"
            download
            aria-label="Download my CV"
            className={cvPillClassName + " pointer-events-auto"}
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
  const titleText = product.title?.trim?.() ?? "";
  const viewer = product.viewer;
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [aspectRatio, setAspectRatio] = React.useState<string>(() => {
    if (typeof product.aspectRatio === "string" && product.aspectRatio.trim()) {
      return product.aspectRatio.trim();
    }
    if (typeof product.aspectRatio === "number" && Number.isFinite(product.aspectRatio)) {
      return String(product.aspectRatio);
    }
    return aspectRatioCache.get(product.thumbnail) ?? "1 / 1";
  });
  const [descHeightPx, setDescHeightPx] = React.useState<number>(0);
  const descRef = React.useRef<HTMLDivElement | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const isTouch = Boolean(isCoarsePointer);
  const hoverEnabled = !isHeaderVisible && !isTouch;
  const topStageBorderEnabled = Boolean(isHeaderVisible);
  const topStageHoverBorderColor = (product.borderColor?.trim() || "#ffffff") as string;
  const descriptionText = product.description?.trim() ?? "";
  const revealDescription = (hoverEnabled || (!isHeaderVisible && isTouch)) && descriptionText.length > 0;
  const actions = Array.isArray(product.actions)
    ? product.actions.filter((a) => {
        if (!a?.icon) return false;
        if (a.kind === "open-viewer") return true;
        return Boolean(a.href);
      })
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
      // Use the real content height so the hover lift matches the actual number of lines.
      setDescHeightPx(Math.max(0, Math.ceil(el.scrollHeight)));
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

  const animateScrollTo = (
    targetY: number,
    durationMs: number,
    onDone?: () => void
  ) => {
    if (typeof window === "undefined") return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      window.scrollTo({ top: targetY });
      onDone?.();
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
        onDone?.();
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
    },
    [centerOnClickMv, maxRowScrollPx]
  );

  const onProductClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window === "undefined") return;

    // Top-stage: only override the click when the Hero header is visible.
    // Otherwise, preserve the original navigation to `product.link` (or open viewer).
    if (scrollToId && isHeaderVisible) {
      const el = document.getElementById(scrollToId);
      if (!el) return;

      e.preventDefault();
      // Center immediately (top stage), then re-center after the vertical scroll completes,
      // because the base parallax translate changes with scroll progress.
      centerSelfInViewport(e.currentTarget);
      const NAV_OFFSET_PX = -450;
      const y = Math.max(0, getDocumentTopPx(el) - NAV_OFFSET_PX);
      animateScrollTo(y, 900, () => centerSelfInViewport(e.currentTarget));
      return;
    }
  };

  return (
    <motion.div
      style={(() => {
        const widthPx =
          typeof product.thumbWidthPx === "number" && Number.isFinite(product.thumbWidthPx)
            ? product.thumbWidthPx
            : undefined;
        // Some research thumbnails have slightly different aspect ratios; when the row is
        // heavily perspective-transformed, this can read as inconsistent "gaps" between cards.
        // Normalize research card widths (unless explicitly overridden) for a cleaner row rhythm.
        const normalizedWidthPx =
          widthPx == null && product.tag === "research"
            ? Math.round(displayHeightPx * 0.77)
            : undefined;
        return widthPx != null
          ? {
              x: translate,
              width: widthPx,
              height: displayHeightPx,
            }
          : normalizedWidthPx != null
          ? {
              x: translate,
              width: normalizedWidthPx,
              height: displayHeightPx,
            }
          : {
              x: translate,
              height: displayHeightPx,
              aspectRatio,
            };
      })()}
      // Only apply a "cosmetic" lift when there is no description reveal.
      // When we reveal a description, the inner container already shifts up by exactly `descHeightPx`.
      whileHover={
        hoverEnabled && !revealDescription
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
              aria-label={titleText || "Open item"}
              className="absolute inset-0 z-20 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 dark:focus-visible:ring-white/40"
            />
            <NextImage
              src={product.thumbnail}
              alt={titleText}
              fill
              sizes="(min-width: 768px) 480px, 90vw"
              className="absolute inset-0 h-full w-full object-cover object-center rounded-2xl"
              // Next's image optimizer doesn't support SVG; render them unoptimized.
              unoptimized={isSvgPath(product.thumbnail)}
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

            {/* Top stage (header visible): show centered title on hover (skip if empty title). */}
            {topStageBorderEnabled && titleText.length > 0 ? (
              <div
                className={[
                  "absolute inset-0 flex items-center justify-center transition-opacity duration-200 ease-out pointer-events-none",
                  topStageTouch ? "opacity-100" : "opacity-0 group-hover/product:opacity-100",
                ].join(" ")}
              >
                <div className="rounded-xl bg-black/45 px-4 py-2 backdrop-blur-sm">
                  <span className="text-white text-base md:text-lg font-semibold leading-tight">
                    {titleText}
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
                {/* Title label (non-interactive): only render if title is non-empty. */}
                {titleText.length > 0 ? (
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
                            {titleText}
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
                          action.kind === "open-viewer" ? (
                            <button
                              key={`open-viewer-${action.icon}-${action.label ?? ""}-${i}`}
                              type="button"
                              onClick={() => setViewerOpen(true)}
                              aria-label={
                                action.ariaLabel ?? action.label ?? `${titleText} viewer`
                              }
                              className={actionPillClassName + " touch-manipulation"}
                              disabled={!viewer}
                              title={!viewer ? "Viewer not available for this item" : undefined}
                            >
                              {renderIcon(action.icon, {
                                size: 18,
                                className: "h-[18px] w-[18px] rounded-[4px]",
                              })}
                              {action.label ? (
                                <span className="leading-none">{action.label}</span>
                              ) : null}
                            </button>
                          ) : (
                            <a
                              key={`${action.href}-${action.icon}-${action.label ?? ""}-${i}`}
                              href={action.href}
                              aria-label={
                                action.ariaLabel ?? action.label ?? `${titleText} action`
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
                          )
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

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
                          action.kind === "open-viewer" ? (
                            <button
                              key={`open-viewer-${action.icon}-${action.label ?? ""}-${i}`}
                              type="button"
                              onClick={() => setViewerOpen(true)}
                              aria-label={
                                action.ariaLabel ?? action.label ?? `${product.title} viewer`
                              }
                              className={actionPillClassName}
                              disabled={!viewer}
                              title={!viewer ? "Viewer not available for this item" : undefined}
                            >
                              {renderIcon(action.icon, {
                                size: 18,
                                className: "h-[18px] w-[18px] rounded-[4px]",
                              })}
                              {action.label ? (
                                <span className="leading-none">{action.label}</span>
                              ) : null}
                            </button>
                          ) : (
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
                          )
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
              className="px-4 py-3 bg-white/80 dark:bg-black/60 text-black dark:text-white flex items-start"
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
      {viewer ? (
        viewer.kind === "ppt-slideshow" ? (
          <PptSlideshowModal
            open={viewerOpen}
            onClose={() => setViewerOpen(false)}
            viewer={viewer}
            fallbackTitle={titleText}
          />
        ) : viewer.kind === "pptx-office" ? (
          <PptxOfficeModal
            open={viewerOpen}
            onClose={() => setViewerOpen(false)}
            viewer={viewer}
            fallbackTitle={titleText}
          />
        ) : null
      ) : null}
    </motion.div>
  );
};

function padNumber(n: number, width: number) {
  const s = String(Math.max(0, Math.floor(n)));
  return s.length >= width ? s : "0".repeat(width - s.length) + s;
}

function buildSlidePaths(cfg: {
  prefix: string;
  count: number;
  pad?: number;
  ext?: string;
}) {
  const count = Math.max(0, Math.floor(cfg.count));
  const pad = typeof cfg.pad === "number" && Number.isFinite(cfg.pad) ? Math.max(0, Math.floor(cfg.pad)) : 0;
  const ext = (cfg.ext?.trim() || "svg").replace(/^\./, "");
  const out: string[] = [];
  for (let i = 1; i <= count; i++) {
    const idx = pad > 0 ? padNumber(i, pad) : String(i);
    out.push(`${cfg.prefix}${idx}.${ext}`);
  }
  return out;
}

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

function PptSlideshowModal({
  open,
  onClose,
  viewer,
  fallbackTitle,
}: {
  open: boolean;
  onClose: () => void;
  viewer: NonNullable<HeroParallaxProduct["viewer"]>;
  fallbackTitle: string;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const slides = React.useMemo(() => buildSlidePaths(viewer.slides), [viewer.slides]);
  const [idx, setIdx] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setIdx(0);
    setPaused(false);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx((v) => (slides.length ? (v - 1 + slides.length) % slides.length : 0));
      if (e.key === "ArrowRight") setIdx((v) => (slides.length ? (v + 1) % slides.length : 0));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, slides.length]);

  React.useEffect(() => {
    if (!open) return;
    if (prefersReducedMotion) return;
    if (paused) return;
    if (!slides.length) return;
    const ms = typeof viewer.autoplayMs === "number" && Number.isFinite(viewer.autoplayMs) ? viewer.autoplayMs : 1800;
    if (ms <= 0) return;
    const id = window.setInterval(() => {
      setIdx((v) => (slides.length ? (v + 1) % slides.length : 0));
    }, ms);
    return () => window.clearInterval(id);
  }, [open, paused, prefersReducedMotion, slides.length, viewer.autoplayMs]);

  const title = viewer.title?.trim() || fallbackTitle || "Slides";
  const ar =
    typeof viewer.aspectRatio === "string" && viewer.aspectRatio.trim()
      ? viewer.aspectRatio.trim()
      : typeof viewer.aspectRatio === "number" && Number.isFinite(viewer.aspectRatio)
      ? String(viewer.aspectRatio)
      : "16 / 9";

  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[1000]">
        {/* Backdrop */}
        <button
          type="button"
          aria-label="Close viewer"
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Dialog */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative w-full max-w-5xl rounded-2xl border border-black/20 dark:border-white/20 bg-white/85 dark:bg-black/75 shadow-2xl backdrop-blur-md overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-black/10 dark:border-white/10">
              <div className="min-w-0">
                <div className="text-sm md:text-base font-semibold text-black dark:text-white truncate">
                  {title}
                </div>
                <div className="text-xs text-black/60 dark:text-white/60">
                  {slides.length ? `Slide ${Math.min(slides.length, idx + 1)} / ${slides.length}` : "No slides found"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {viewer.downloadHref ? (
                  <a
                    href={viewer.downloadHref}
                    className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-2 text-xs md:text-sm font-medium shadow-sm backdrop-blur transition-colors duration-250 ease-out border-black/20 text-black hover:bg-black hover:text-white hover:border-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 dark:border-white/20 dark:bg-black/40 dark:text-white dark:hover:bg-white dark:hover:text-black dark:hover:border-white/70 dark:focus-visible:ring-white/40"
                  >
                    <FileDown className="h-4 w-4" aria-hidden="true" />
                    <span>Download PPTX</span>
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="inline-flex items-center justify-center rounded-full border border-black/20 dark:border-white/20 bg-white/70 dark:bg-black/40 h-10 w-10 transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 dark:focus-visible:ring-white/40"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Slide stage */}
            <div className="px-4 py-4">
              <div
                className="relative w-full overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04]"
                style={{ aspectRatio: ar }}
              >
                {slides.length ? (
                  <motion.div
                    key={slides[idx] ?? `slide-${idx}`}
                    initial={prefersReducedMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="absolute inset-0"
                  >
                    <NextImage
                      src={slides[idx]!}
                      alt={`${title} slide ${idx + 1}`}
                      fill
                      sizes="(min-width: 1024px) 960px, 92vw"
                      className="absolute inset-0 h-full w-full object-contain"
                      unoptimized={isSvgPath(slides[idx])}
                      priority={true}
                    />
                  </motion.div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-sm text-black/60 dark:text-white/60">
                      Add exported slide images to render an animated preview.
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIdx((v) => (slides.length ? (v - 1 + slides.length) % slides.length : 0))}
                    aria-label="Previous slide"
                    className="inline-flex items-center justify-center rounded-full border border-black/20 dark:border-white/20 bg-white/70 dark:bg-black/40 h-10 w-10 transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 dark:focus-visible:ring-white/40"
                    disabled={!slides.length}
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaused((p) => !p)}
                    aria-label={paused ? "Play" : "Pause"}
                    className="inline-flex items-center justify-center rounded-full border border-black/20 dark:border-white/20 bg-white/70 dark:bg-black/40 h-10 w-10 transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 dark:focus-visible:ring-white/40"
                    disabled={!slides.length || prefersReducedMotion}
                    title={prefersReducedMotion ? "Autoplay disabled (prefers reduced motion)" : undefined}
                  >
                    {paused ? (
                      <Play className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Pause className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdx((v) => (slides.length ? (v + 1) % slides.length : 0))}
                    aria-label="Next slide"
                    className="inline-flex items-center justify-center rounded-full border border-black/20 dark:border-white/20 bg-white/70 dark:bg-black/40 h-10 w-10 transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 dark:focus-visible:ring-white/40"
                    disabled={!slides.length}
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                <div className="text-xs text-black/60 dark:text-white/60 text-right">
                  {prefersReducedMotion ? "Autoplay off" : paused ? "Paused" : "Autoplay on"}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Portal>
  );
}

function resolveAbsoluteHref(href: string) {
  if (typeof window === "undefined") return null;
  try {
    return new URL(href, window.location.origin).toString();
  } catch {
    return null;
  }
}

function PptxOfficeModal({
  open,
  onClose,
  viewer,
  fallbackTitle,
}: {
  open: boolean;
  onClose: () => void;
  viewer: Extract<NonNullable<HeroParallaxProduct["viewer"]>, { kind: "pptx-office" }>;
  fallbackTitle: string;
}) {
  const [abs, setAbs] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setAbs(resolveAbsoluteHref(viewer.pptxHref));
  }, [open, viewer.pptxHref]);

  React.useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const title = viewer.title?.trim() || fallbackTitle || "PowerPoint";
  const downloadHref = viewer.downloadHref || viewer.pptxHref;
  const embedUrl =
    abs != null
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(abs)}`
      : null;

  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[1000]">
        <button
          type="button"
          aria-label="Close viewer"
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative w-full max-w-6xl rounded-2xl border border-black/20 dark:border-white/20 bg-white/85 dark:bg-black/75 shadow-2xl backdrop-blur-md overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-black/10 dark:border-white/10">
              <div className="min-w-0">
                <div className="text-sm md:text-base font-semibold text-black dark:text-white truncate">
                  {title}
                </div>
                <div className="text-xs text-black/60 dark:text-white/60">
                  Online PowerPoint viewer (Office for the web)
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={downloadHref}
                  className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-2 text-xs md:text-sm font-medium shadow-sm backdrop-blur transition-colors duration-250 ease-out border-black/20 text-black hover:bg-black hover:text-white hover:border-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 dark:border-white/20 dark:bg-black/40 dark:text-white dark:hover:bg-white dark:hover:text-black dark:hover:border-white/70 dark:focus-visible:ring-white/40"
                >
                  <FileDown className="h-4 w-4" aria-hidden="true" />
                  <span>Download</span>
                </a>
                {embedUrl ? (
                  <a
                    href={embedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-2 text-xs md:text-sm font-medium shadow-sm backdrop-blur transition-colors duration-250 ease-out border-black/20 text-black hover:bg-black hover:text-white hover:border-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 dark:border-white/20 dark:bg-black/40 dark:text-white dark:hover:bg-white dark:hover:text-black dark:hover:border-white/70 dark:focus-visible:ring-white/40"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    <span>Open in new tab</span>
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="inline-flex items-center justify-center rounded-full border border-black/20 dark:border-white/20 bg-white/70 dark:bg-black/40 h-10 w-10 transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 dark:focus-visible:ring-white/40"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="px-4 py-4">
              <div className="text-xs text-black/60 dark:text-white/60 mb-3">
                Note: Office’s online viewer can only load the PPTX if it’s publicly reachable over HTTPS
                (it won’t work from localhost/private networks).
              </div>
              <div className="relative w-full overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] aspect-[16/9]">
                {embedUrl ? (
                  <iframe
                    title={title}
                    src={embedUrl}
                    className="absolute inset-0 h-full w-full"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                    <div className="text-sm text-black/70 dark:text-white/70">
                      Could not compute an absolute URL for the PPTX. Try deploying the site or ensuring
                      the PPTX is accessible via an absolute HTTPS URL.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Portal>
  );
}


