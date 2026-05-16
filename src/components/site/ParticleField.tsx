"use client";

import * as React from "react";

/**
 * Lightweight 3D particle field rendered to a 2D canvas.
 * Inspired by Google Antigravity's hero — a slowly rotating dot cloud with
 * perspective-based depth fade, mouse parallax and a subtle "breathing" radius.
 *
 * No WebGL / no extra deps. Pauses while the tab is hidden. Honors
 * prefers-reduced-motion (renders a static frame).
 */

type Particle = {
  x: number;
  y: number;
  z: number;
  /** Per-particle size jitter (0.6 – 1.4). */
  s: number;
  /** Per-particle brightness jitter (0.6 – 1.0). */
  b: number;
};

const COUNT_DESKTOP = 1400;
const COUNT_MOBILE = 700;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function makeParticles(count: number): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    // Distribute in a sphere shell with some inner depth (looks fuller than a uniform sphere).
    const u = Math.random();
    const v = Math.random();
    const theta = u * Math.PI * 2;
    const phi = Math.acos(2 * v - 1);
    const r = 0.55 + Math.pow(Math.random(), 0.8) * 0.55; // bias toward the shell
    out.push({
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta),
      z: r * Math.cos(phi),
      s: rand(0.6, 1.4),
      b: rand(0.55, 1.0),
    });
  }
  return out;
}

export function ParticleField({ className }: { className?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mouseRef = React.useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCoarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    const count = isCoarse ? COUNT_MOBILE : COUNT_DESKTOP;
    const particles = makeParticles(count);

    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const r = container.getBoundingClientRect();
      width = Math.max(1, r.width);
      height = Math.max(1, r.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const onPointerMove = (e: PointerEvent) => {
      const r = container.getBoundingClientRect();
      const inside =
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom;
      if (!inside) return;
      mouseRef.current.x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
      mouseRef.current.y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    let rafId = 0;
    let lastT = performance.now();
    let autoY = 0;
    let autoX = 0;
    let rxCurrent = 0;
    let ryCurrent = 0;
    let breath = 0;

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;

      // Auto spin + slight breathing.
      autoY += dt * 0.085;
      autoX += dt * 0.025;
      breath += dt * 0.6;

      // Spring rotation toward pointer offset.
      const tgtX = mouseRef.current.y * 0.55 + Math.sin(autoX) * 0.07;
      const tgtY = mouseRef.current.x * 0.55;
      rxCurrent += (tgtX - rxCurrent) * 0.05;
      ryCurrent += (tgtY - ryCurrent) * 0.05;

      const cx = width / 2;
      const cy = height / 2;
      const baseScale = Math.min(width, height) * 0.42;
      const fov = Math.max(width, height) * 0.9;
      const radius = 1 + Math.sin(breath) * 0.04; // slow breath

      const sinX = Math.sin(rxCurrent);
      const cosX = Math.cos(rxCurrent);
      const sinY = Math.sin(autoY + ryCurrent);
      const cosY = Math.cos(autoY + ryCurrent);

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        // rotate around Y
        const px = p.x * radius;
        const py = p.y * radius;
        const pz = p.z * radius;
        const x1 = px * cosY + pz * sinY;
        const z1 = -px * sinY + pz * cosY;
        // rotate around X
        const y1 = py * cosX - z1 * sinX;
        const z2 = py * sinX + z1 * cosX;

        // Perspective projection (z2 in roughly [-1, 1]).
        const perspective = fov / (fov + z2 * baseScale * 1.15);
        const sx = cx + x1 * baseScale * perspective;
        const sy = cy + y1 * baseScale * perspective;

        // Depth-aware size & alpha (front bright/large, back dim/small).
        const depth = (z2 + 1) * 0.5; // 0 = back, 1 = front
        const size = (0.4 + depth * 1.5) * p.s * dpr * 0.65;
        const alpha = (0.08 + depth * 0.85) * p.b;

        if (alpha <= 0.02 || size <= 0.2) continue;

        ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";

      if (!reduced && !document.hidden) {
        rafId = requestAnimationFrame(draw);
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      } else if (!reduced && rafId === 0) {
        lastT = performance.now();
        rafId = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    if (reduced) {
      draw(performance.now());
    } else {
      rafId = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      aria-hidden
    >
      <canvas ref={canvasRef} className="h-full w-full block" />
    </div>
  );
}
