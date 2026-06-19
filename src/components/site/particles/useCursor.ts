"use client";

import * as React from "react";

/**
 * Centralized pointer reader for the particle effects. Exposes, via a ref (no
 * re-renders), the pointer normalized to the host container center in [-1, 1]
 * per axis, plus raw client coords, an "active" flag and idle time. Each effect
 * owns its own rAF loop (see `useRafLoop`) and reads this ref every frame.
 */

export type CursorState = {
  nx: number; // pointer X normalized to container center, [-1, 1]
  ny: number; // pointer Y normalized to container center, [-1, 1]
  cx: number; // raw client X (px)
  cy: number; // raw client Y (px)
  active: boolean;
  idleFor: number; // seconds since last real move
};

export type UseCursor = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  cursorRef: React.MutableRefObject<CursorState>;
  reducedMotion: boolean;
  coarsePointer: boolean;
};

export function useCursor(): UseCursor {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const cursorRef = React.useRef<CursorState>({
    nx: 0,
    ny: 0,
    cx: 0,
    cy: 0,
    active: false,
    idleFor: 0,
  });

  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [coarsePointer, setCoarsePointer] = React.useState(false);

  React.useEffect(() => {
    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarseMq = window.matchMedia("(hover: none), (pointer: coarse)");
    setReducedMotion(reduceMq.matches);
    setCoarsePointer(coarseMq.matches);

    const onReduce = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    const onCoarse = (e: MediaQueryListEvent) => setCoarsePointer(e.matches);
    reduceMq.addEventListener("change", onReduce);
    coarseMq.addEventListener("change", onCoarse);

    let lastMove = performance.now();

    const update = (clientX: number, clientY: number) => {
      const el = containerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const cur = cursorRef.current;
      cur.cx = clientX;
      cur.cy = clientY;
      cur.nx = (clientX - cx) / (r.width / 2 || 1);
      cur.ny = (clientY - cy) / (r.height / 2 || 1);
      cur.active = true;
      cur.idleFor = 0;
      lastMove = performance.now();
    };

    // Covers mouse, pen and touch-drag (pointer events unify them).
    const onPointerMove = (e: PointerEvent) => update(e.clientX, e.clientY);
    const onPointerDown = (e: PointerEvent) => update(e.clientX, e.clientY);
    // Fallback for touch on browsers that throttle pointermove while scrolling.
    const onTouchMove = (e: TouchEvent) => {
      const tch = e.touches[0];
      if (tch) update(tch.clientX, tch.clientY);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("touchstart", onTouchMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    let idleRaf = 0;
    const tickIdle = (now: number) => {
      cursorRef.current.idleFor = (now - lastMove) / 1000;
      idleRaf = requestAnimationFrame(tickIdle);
    };
    idleRaf = requestAnimationFrame(tickIdle);

    return () => {
      reduceMq.removeEventListener("change", onReduce);
      coarseMq.removeEventListener("change", onCoarse);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("touchstart", onTouchMove);
      window.removeEventListener("touchmove", onTouchMove);
      cancelAnimationFrame(idleRaf);
    };
  }, []);

  return { containerRef, cursorRef, reducedMotion, coarsePointer };
}

/**
 * Standard rAF loop: respects reduced-motion (one static frame) and pauses
 * while the tab is hidden. Callback gets clamped delta-time and absolute time
 * (both in seconds).
 */
export function useRafLoop(
  draw: (dt: number, t: number) => void,
  reducedMotion: boolean,
) {
  const drawRef = React.useRef(draw);
  drawRef.current = draw;

  React.useEffect(() => {
    let rafId = 0;
    let last = performance.now();
    const start = last;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      drawRef.current(dt, (now - start) / 1000);
      if (!reducedMotion && !document.hidden) rafId = requestAnimationFrame(frame);
    };

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      } else if (!reducedMotion && rafId === 0) {
        last = performance.now();
        rafId = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    if (reducedMotion) drawRef.current(0, 0);
    else rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reducedMotion]);
}
