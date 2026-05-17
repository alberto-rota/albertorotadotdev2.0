"use client";

import * as React from "react";

/**
 * Connected-particle network rendered to a 2D canvas.
 *
 * Particles drift gently across the hero, bounce against the bounds and
 * connect to near neighbours with thin lines whose opacity falls with
 * distance. The pointer (mouse or finger) gently attracts nearby particles,
 * making the field feel reactive on both desktop and touchscreens.
 *
 * Light-mode friendly (dark dots, brand-tinted links). Pauses while hidden,
 * honours prefers-reduced-motion (single static frame), and scales the
 * particle count down on coarse pointers / small viewports.
 */

type P = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

const COUNT_DESKTOP = 70;
const COUNT_MOBILE = 38;
const LINK_DIST_DESKTOP = 140;
const LINK_DIST_MOBILE = 110;
const POINTER_RADIUS = 160;

// Brand palette (kept in sync with globals.css).
const PRIMARY = { r: 125, g: 191, b: 197 };
const SECONDARY = { r: 234, g: 173, b: 118 };

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function ParticleField({ className }: { className?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const pointerRef = React.useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCoarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    const count = isCoarse ? COUNT_MOBILE : COUNT_DESKTOP;
    const linkDist = isCoarse ? LINK_DIST_MOBILE : LINK_DIST_DESKTOP;
    const linkDistSq = linkDist * linkDist;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const particles: P[] = [];

    const seed = () => {
      particles.length = 0;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: rand(-0.22, 0.22),
          vy: rand(-0.22, 0.22),
          r: rand(1.4, 2.6),
        });
      }
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const r = container.getBoundingClientRect();
      width = Math.max(1, r.width);
      height = Math.max(1, r.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (particles.length === 0) seed();
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const setPointer = (clientX: number, clientY: number, active: boolean) => {
      const r = container.getBoundingClientRect();
      const inside =
        clientX >= r.left &&
        clientX <= r.right &&
        clientY >= r.top &&
        clientY <= r.bottom;
      pointerRef.current.active = inside && active;
      if (inside) {
        pointerRef.current.x = clientX - r.left;
        pointerRef.current.y = clientY - r.top;
      }
    };

    const onPointerMove = (e: PointerEvent) =>
      setPointer(e.clientX, e.clientY, true);
    const onPointerLeave = () => {
      pointerRef.current.active = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      setPointer(t.clientX, t.clientY, true);
    };
    const onTouchEnd = () => {
      pointerRef.current.active = false;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    let rafId = 0;
    let lastT = performance.now();

    const step = (dt: number) => {
      const pointer = pointerRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        // Pointer attraction.
        if (pointer.active) {
          const dx = pointer.x - p.x;
          const dy = pointer.y - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < POINTER_RADIUS * POINTER_RADIUS && d2 > 1) {
            const d = Math.sqrt(d2);
            const force = (1 - d / POINTER_RADIUS) * 0.45;
            p.vx += (dx / d) * force * dt;
            p.vy += (dy / d) * force * dt;
          }
        }

        // Drift + integrate.
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;

        // Damping toward target speed.
        const speed = Math.hypot(p.vx, p.vy);
        const max = 0.55;
        if (speed > max) {
          p.vx *= max / speed;
          p.vy *= max / speed;
        }
        p.vx *= 0.992;
        p.vy *= 0.992;

        // Bounce off bounds, with a small jitter to avoid sticking.
        if (p.x < 0) {
          p.x = 0;
          p.vx = Math.abs(p.vx) + rand(0.05, 0.12);
        } else if (p.x > width) {
          p.x = width;
          p.vx = -Math.abs(p.vx) - rand(0.05, 0.12);
        }
        if (p.y < 0) {
          p.y = 0;
          p.vy = Math.abs(p.vy) + rand(0.05, 0.12);
        } else if (p.y > height) {
          p.y = height;
          p.vy = -Math.abs(p.vy) - rand(0.05, 0.12);
        }
      }
    };

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;

      step(dt);

      ctx.clearRect(0, 0, width, height);

      // Draw links first so the dots sit on top.
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > linkDistSq) continue;
          const d = Math.sqrt(d2);
          const t = 1 - d / linkDist;
          // Blend primary→secondary across distance for a subtle gradient.
          const r = Math.round(PRIMARY.r * t + SECONDARY.r * (1 - t));
          const g = Math.round(PRIMARY.g * t + SECONDARY.g * (1 - t));
          const bl = Math.round(PRIMARY.b * t + SECONDARY.b * (1 - t));
          const alpha = (t * t * 0.55).toFixed(3);
          ctx.strokeStyle = `rgba(${r},${g},${bl},${alpha})`;
          ctx.lineWidth = Math.max(0.6, t * 1.2);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // Draw dots (dark on light bg).
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.fillStyle = "rgba(0,0,0,0.62)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        // Soft halo in primary brand tint.
        ctx.fillStyle = "rgba(125,191,197,0.18)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Pointer halo — visible feedback on both mouse + touch.
      if (pointerRef.current.active) {
        const grd = ctx.createRadialGradient(
          pointerRef.current.x,
          pointerRef.current.y,
          0,
          pointerRef.current.x,
          pointerRef.current.y,
          POINTER_RADIUS
        );
        grd.addColorStop(0, "rgba(125,191,197,0.18)");
        grd.addColorStop(1, "rgba(125,191,197,0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(
          pointerRef.current.x,
          pointerRef.current.y,
          POINTER_RADIUS,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

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
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <div ref={containerRef} className={className} aria-hidden>
      <canvas ref={canvasRef} className="h-full w-full block" />
    </div>
  );
}
