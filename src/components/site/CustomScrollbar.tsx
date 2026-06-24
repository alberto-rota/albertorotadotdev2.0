"use client";

import * as React from "react";
import { createPortal } from "react-dom";

type Props = {
  /**
   * Scroll container to track. When omitted, the component tracks the whole
   * page (window scroll). Pass a ref to attach it to an inner scroll area.
   */
  targetRef?: React.RefObject<HTMLElement | null>;
  /** Idle time (ms) before the bar fades out. Use 0 to keep it always visible. */
  hideDelay?: number;
  /** Stacking order of the overlay. */
  zIndex?: number;
};

const MIN_THUMB = 40; // px — keeps the thumb grabbable on long pages
// Insets so the bar clears the floating nav (top) and breathes at the edges.
const WINDOW_INSET_TOP = 76;
const WINDOW_INSET_BOTTOM = 14;
// Element mode: clear a sticky header at the top, small breathing room below.
const ELEMENT_INSET_TOP = 58;
const ELEMENT_INSET_BOTTOM = 12;

type Metrics = {
  trackTop: number;
  trackHeight: number;
  thumbTop: number;
  thumbHeight: number;
  right: number; // px from the viewport's right edge
  show: boolean; // content actually overflows
};

export function CustomScrollbar({ targetRef, hideDelay = 1100, zIndex = 60 }: Props) {
  const [mounted, setMounted] = React.useState(false);
  const [finePointer, setFinePointer] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const [m, setM] = React.useState<Metrics>({
    trackTop: 0,
    trackHeight: 0,
    thumbTop: 0,
    thumbHeight: 0,
    right: 5,
    show: false,
  });

  const dragRef = React.useRef<{
    pointerY: number;
    scrollTop: number;
    range: number; // trackHeight - thumbHeight
    max: number; // scrollH - clientH
  } | null>(null);
  const hideTimer = React.useRef<number | null>(null);
  const rafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(pointer: fine)");
    const onChange = () => setFinePointer(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const read = React.useCallback(() => {
    const el = targetRef?.current ?? null;
    if (el) {
      const rect = el.getBoundingClientRect();
      return {
        el,
        scrollTop: el.scrollTop,
        clientH: el.clientHeight,
        scrollH: el.scrollHeight,
        regionTop: rect.top + ELEMENT_INSET_TOP,
        regionHeight: rect.height - ELEMENT_INSET_TOP - ELEMENT_INSET_BOTTOM,
        // Sit just inside the container's right edge.
        right: Math.max(4, window.innerWidth - rect.right + 6),
        locked: false,
      };
    }
    const doc = document.documentElement;
    return {
      el: null as HTMLElement | null,
      scrollTop: window.scrollY || doc.scrollTop,
      clientH: window.innerHeight,
      scrollH: doc.scrollHeight,
      regionTop: WINDOW_INSET_TOP,
      regionHeight: window.innerHeight - WINDOW_INSET_TOP - WINDOW_INSET_BOTTOM,
      right: 5,
      // Hide the page bar while a modal has locked body scroll.
      locked: document.body.style.overflow === "hidden",
    };
  }, [targetRef]);

  const recompute = React.useCallback(() => {
    const s = read();
    const max = s.scrollH - s.clientH;
    if (max <= 1 || s.locked || s.regionHeight <= 0) {
      setM((p) => (p.show ? { ...p, show: false } : p));
      return;
    }
    const thumbHeight = Math.max(MIN_THUMB, (s.clientH / s.scrollH) * s.regionHeight);
    const range = s.regionHeight - thumbHeight;
    const thumbTop = range > 0 ? (s.scrollTop / max) * range : 0;
    setM({
      trackTop: s.regionTop,
      trackHeight: s.regionHeight,
      thumbTop,
      thumbHeight,
      right: s.right,
      show: true,
    });
  }, [read]);

  const reveal = React.useCallback(() => {
    setVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    if (hideDelay > 0) {
      hideTimer.current = window.setTimeout(() => {
        if (!dragRef.current) setVisible(false);
      }, hideDelay);
    }
  }, [hideDelay]);

  React.useEffect(() => {
    if (!mounted || !finePointer) return;
    const el = targetRef?.current ?? null;
    const source: Window | HTMLElement = el ?? window;

    const onScroll = () => {
      reveal();
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        recompute();
      });
    };
    const onResize = () => recompute();

    recompute();
    reveal(); // flash once on mount so the bar is discoverable
    source.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    // When attached to an element (e.g. a panel that slides in), follow its
    // position for a moment while the entrance animation settles.
    let settleRaf = 0;
    if (el) {
      const start = performance.now();
      const settle = (now: number) => {
        recompute();
        if (now - start < 700) settleRaf = requestAnimationFrame(settle);
      };
      settleRaf = requestAnimationFrame(settle);
    }

    const ro = new ResizeObserver(() => recompute());
    ro.observe(el ?? document.body);

    // Re-check when body scroll is locked/unlocked (e.g. a modal opens),
    // since that doesn't fire scroll/resize events.
    const mo = new MutationObserver(() => recompute());
    if (!el) {
      mo.observe(document.body, { attributes: true, attributeFilter: ["style"] });
    }

    return () => {
      source.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      mo.disconnect();
      if (settleRaf) cancelAnimationFrame(settleRaf);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [mounted, finePointer, recompute, reveal, targetRef]);

  const scrollTo = React.useCallback(
    (top: number, smooth = false) => {
      const el = targetRef?.current ?? null;
      const behavior: ScrollBehavior = smooth ? "smooth" : "auto";
      if (el) el.scrollTo({ top, behavior });
      else window.scrollTo({ top, behavior });
    },
    [targetRef]
  );

  const onThumbPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const s = read();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      pointerY: e.clientY,
      scrollTop: s.scrollTop,
      range: m.trackHeight - m.thumbHeight,
      max: s.scrollH - s.clientH,
    };
    reveal();
  };

  const onThumbPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const deltaPx = e.clientY - d.pointerY;
    const deltaScroll = d.range > 0 ? (deltaPx / d.range) * d.max : 0;
    scrollTo(Math.max(0, Math.min(d.max, d.scrollTop + deltaScroll)));
    reveal();
  };

  const onThumbPointerUp = (e: React.PointerEvent) => {
    dragRef.current = null;
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    reveal();
  };

  // Click on the empty track: page towards the click.
  const onTrackPointerDown = (e: React.PointerEvent) => {
    const s = read();
    const max = s.scrollH - s.clientH;
    const localY = e.clientY - m.trackTop;
    const thumbCenter = m.thumbTop + m.thumbHeight / 2;
    const dir = localY < thumbCenter ? -1 : 1;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollTo(Math.max(0, Math.min(max, s.scrollTop + dir * s.clientH * 0.9)), !reduce);
    reveal();
  };

  if (!mounted || !finePointer) return null;

  const scrollProgress = (() => {
    const range = m.trackHeight - m.thumbHeight;
    return range > 0 ? m.thumbTop / range : 0;
  })();

  // Stay mounted even when not shown, so opacity/translate animate out
  // smoothly instead of being cut off by an unmount.
  const shown = m.show && visible;

  return createPortal(
    <div
      aria-hidden
      onPointerDown={shown ? onTrackPointerDown : undefined}
      onPointerEnter={shown ? reveal : undefined}
      style={{ top: m.trackTop, height: m.trackHeight, right: m.right, zIndex }}
      className={`group fixed flex w-4 justify-center transition-[opacity,transform] duration-450 ease-out ${
        shown
          ? "opacity-100 translate-x-0 pointer-events-auto"
          : "opacity-0 translate-x-2 pointer-events-none"
      }`}
    >
      {/* track: faint rail that brightens around the thumb on hover */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-white/[0.06] group-hover:bg-white/[0.12] transition-colors duration-300"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent, #000 8%, #000 92%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, #000 8%, #000 92%, transparent)",
        }}
      />

      {/* progress sheen above the thumb */}
      <span
        aria-hidden
        className="absolute left-1/2 top-0 w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-b from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ height: Math.max(0, m.thumbTop) }}
      />

      {/* thumb */}
      <button
        type="button"
        aria-label="Scroll"
        onPointerDown={onThumbPointerDown}
        onPointerMove={onThumbPointerMove}
        onPointerUp={onThumbPointerUp}
        style={{ transform: `translateY(${m.thumbTop}px)`, height: m.thumbHeight }}
        className="group/thumb absolute top-0 w-1.5 cursor-grab transition-[width] duration-200 ease-out group-hover:w-2.5 active:w-2.5 active:cursor-grabbing"
      >
        {/* glow */}
        <span
          aria-hidden
          className="absolute -inset-x-1 inset-y-0 rounded-full bg-white/35 opacity-0 blur-[6px] transition-opacity duration-200 group-hover:opacity-60 group-active/thumb:opacity-90"
        />
        {/* gradient body */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-gradient-to-b from-white/85 via-white/45 to-white/20 shadow-[0_0_10px_rgba(255,255,255,0.18),inset_0_1px_0_rgba(255,255,255,0.6)] transition-shadow duration-200 group-hover:shadow-[0_0_18px_rgba(255,255,255,0.4),inset_0_1px_0_rgba(255,255,255,0.8)]"
          style={{ backgroundPositionY: `${scrollProgress * 100}%` }}
        />
        {/* bright top cap */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-1 mx-auto h-2 w-[2px] rounded-full bg-white/90 blur-[0.5px]"
        />
      </button>
    </div>,
    document.body
  );
}
