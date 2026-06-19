"use client";

import * as React from "react";
import { useCursor, useRafLoop, type CursorState } from "./useCursor";

export type Dims = { w: number; h: number; dpr: number };

export type EffectDraw = (
  ctx: CanvasRenderingContext2D,
  dims: Dims,
  dt: number,
  t: number,
  cursor: CursorState,
  reduced: boolean,
) => void;

export type EffectInit = (dims: Dims) => void;

/**
 * Shared canvas host for every particle effect. Handles DPR-aware sizing, the
 * ResizeObserver, the rAF loop and pointer state. Effects supply `init` (called
 * on mount + whenever the canvas resizes, to (re)build their particle state)
 * and `draw` (called every frame). Effects clear/fade the canvas themselves so
 * trail-based looks are possible.
 */
export function ParticleCanvas({
  className,
  init,
  draw,
}: {
  className?: string;
  init: EffectInit;
  draw: EffectDraw;
}) {
  const { containerRef, cursorRef, reducedMotion } = useCursor();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const ctxRef = React.useRef<CanvasRenderingContext2D | null>(null);
  const sizeRef = React.useRef<Dims>({ w: 1, h: 1, dpr: 1 });

  const initRef = React.useRef(init);
  initRef.current = init;
  const drawRef = React.useRef(draw);
  drawRef.current = draw;

  React.useEffect(() => {
    const el = containerRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    ctxRef.current = ctx;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const r = el.getBoundingClientRect();
      const w = Math.max(1, r.width);
      const h = Math.max(1, r.height);
      sizeRef.current = { w, h, dpr };
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initRef.current(sizeRef.current);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  useRafLoop((dt, t) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    drawRef.current(ctx, sizeRef.current, dt, t, cursorRef.current, reducedMotion);
  }, reducedMotion);

  return (
    <div ref={containerRef} className={className} aria-hidden>
      <canvas ref={canvasRef} className="h-full w-full block" />
    </div>
  );
}

/** Resolve the effective cursor in canvas CSS px, with an idle orbit fallback. */
export function cursorPx(cur: CursorState, dims: Dims, t: number, reduced: boolean) {
  const active = cur.active && !reduced;
  const x = active
    ? dims.w * (0.5 + cur.nx * 0.5)
    : dims.w * (0.5 + 0.34 * Math.cos(t * 0.5));
  const y = active
    ? dims.h * (0.5 + cur.ny * 0.5)
    : dims.h * (0.5 + 0.3 * Math.sin(t * 0.42));
  return { x, y, active };
}
