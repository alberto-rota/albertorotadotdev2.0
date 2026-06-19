"use client";

import * as React from "react";
import { ParticleCanvas, cursorPx, type Dims, type EffectDraw, type EffectInit } from "./ParticleCanvas";

/**
 * 2D sensor grid. A fixed lattice of particles that never move; each pill turns
 * (in 2D) to face the cursor, stretches from a dot into a pill near it, and
 * takes a position-driven hue that grows vivid as the cursor approaches.
 *
 * Works with mouse, pen and touch (see `useCursor`): reacts to taps and drags.
 */

const SPACING_FINE = 36; // px between dots (mouse/pen)
const SPACING_COARSE = 50; // larger + fewer for touch devices

const SIGMA = 150; // px: proximity falloff radius (drives stretch + color)

const PILL_BASE = 2.2; // resting pill length (≈ a dot)
const PILL_STRETCH = 5; // extra length when fully active
const THICK = 2.6; // base pill thickness

const ROT_SMOOTH = 0.0025; // easing base for turning toward the pointer (lower = snappier)

// Color: a cohesive cool→warm spread that varies across the field and cycles
// slowly over time; saturation/brightness ramp up near the cursor.
const HUE_BASE = 175; // starting hue (cyan)
const HUE_RANGE = 175; // spread across the field (cyan → blue → violet → magenta)
const HUE_DRIFT = 10; // deg/s slow global cycle

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function RepelGrid({ className }: { className?: string }) {
  const stateRef = React.useRef<{
    xs: Float32Array;
    ys: Float32Array;
    hue: Float32Array;
    angle: Float32Array;
    n: number;
  }>({
    xs: new Float32Array(0),
    ys: new Float32Array(0),
    hue: new Float32Array(0),
    angle: new Float32Array(0),
    n: 0,
  });

  const init = React.useCallback<EffectInit>((dims: Dims) => {
    const coarse =
      typeof window !== "undefined" &&
      window.matchMedia("(hover: none), (pointer: coarse)").matches;
    const spacing = coarse ? SPACING_COARSE : SPACING_FINE;

    const cols = Math.ceil(dims.w / spacing) + 1;
    const rows = Math.ceil(dims.h / spacing) + 1;
    const n = cols * rows;
    const xs = new Float32Array(n);
    const ys = new Float32Array(n);
    const hue = new Float32Array(n);
    const angle = new Float32Array(n); // live orientation, eases toward the pointer
    let k = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * spacing;
        const y = r * spacing;
        xs[k] = x;
        ys[k] = y;
        // Smooth spatial hue variation (blobs of color across the grid).
        const v = (Math.sin(x * 0.012) + Math.cos(y * 0.014)) * 0.5 + 0.5; // 0..1
        hue[k] = HUE_BASE + v * HUE_RANGE;
        angle[k] = Math.random() * Math.PI * 2;
        k++;
      }
    }
    stateRef.current = { xs, ys, hue, angle, n };
  }, []);

  const draw = React.useCallback<EffectDraw>((ctx, dims, dt, t, cur, reduced) => {
    const { w, h } = dims;
    const { xs, ys, hue, angle, n } = stateRef.current;
    const { x: mx, y: my, active } = cursorPx(cur, dims, t, reduced);
    const strength = active ? 1 : 0.55; // softer ambient bulge before interaction
    const twoSigma2 = 2 * SIGMA * SIGMA;
    const hueShift = reduced ? 0 : t * HUE_DRIFT;
    const rotK = reduced ? 1 : 1 - Math.pow(ROT_SMOOTH, dt); // frame-rate independent ease

    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = "round";

    for (let i = 0; i < n; i++) {
      const bx = xs[i];
      const by = ys[i];

      const dx = bx - mx;
      const dy = by - my;
      const d2 = dx * dx + dy * dy;
      const fall = Math.exp(-d2 / twoSigma2); // 0..1 proximity to cursor
      const d = Math.sqrt(d2) + 1e-4;
      const ux = dx / d; // radial direction (outward from cursor)
      const uy = dy / d;
      const act = fall * strength;

      // Pills stay anchored on the grid — only their rotation responds.
      const px = bx;
      const py = by;

      // Each pill turns to face the pointer (eased; pills are symmetric so we
      // align to the cursor axis via the shorter half-turn to avoid flips).
      let target = Math.atan2(-uy, -ux); // direction from pill toward the cursor
      const cur0 = angle[i];
      let delta = Math.atan2(Math.sin(target - cur0), Math.cos(target - cur0));
      if (delta > Math.PI / 2) target -= Math.PI;
      else if (delta < -Math.PI / 2) target += Math.PI;
      delta = Math.atan2(Math.sin(target - cur0), Math.cos(target - cur0));
      const ang = cur0 + delta * rotK;
      angle[i] = ang;

      const len = PILL_BASE + PILL_STRETCH * act;
      const hx = (Math.cos(ang) * len) / 2;
      const hy = (Math.sin(ang) * len) / 2;

      // Color: hue varies by position + slow drift; sat/lightness rise near cursor.
      const hueDeg = (hue[i] + hueShift) % 360;
      const sat = Math.round(22 + act * 73); // 22% rest → 95% active
      const light = Math.round(70 + act * 12); // 70% → 82%
      const alpha = (0.16 + fall * 0.74) * clamp(strength + 0.2, 0, 1);

      ctx.strokeStyle = `hsla(${hueDeg.toFixed(0)}, ${sat}%, ${light}%, ${alpha.toFixed(3)})`;
      ctx.lineWidth = THICK * (0.55 + fall * 0.9);
      ctx.beginPath();
      ctx.moveTo(px - hx, py - hy);
      ctx.lineTo(px + hx, py + hy);
      ctx.stroke();
    }
  }, []);

  return <ParticleCanvas className={className} init={init} draw={draw} />;
}
