"use client";

import * as React from "react";
import { createPortal } from "react-dom";

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, textarea, select, label, summary, [data-cursor="hover"]';

/**
 * Replaces the native cursor with a blend-mode dot + trailing ring.
 * Active only on precise pointers; touch devices keep their native behaviour.
 */
export function CustomCursor() {
  const [enabled, setEnabled] = React.useState(false);
  const dotRef = React.useRef<HTMLDivElement | null>(null);
  const ringRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);
  }, []);

  React.useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.documentElement.classList.add("cursor-none");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ease = reduce ? 1 : 0.42;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let raf = 0;
    let shown = false;

    const setShown = (v: boolean) => {
      if (v === shown) return;
      shown = v;
      dot.style.opacity = v ? "1" : "0";
      ring.style.opacity = v ? "1" : "0";
    };

    const onMove = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      if (reduce) ring.style.transform = dot.style.transform;
      setShown(true);
      const t = e.target as Element | null;
      const hovering = !!t?.closest?.(INTERACTIVE_SELECTOR);
      ring.dataset.hover = hovering ? "true" : "false";
    };
    const onDown = () => {
      ring.dataset.press = "true";
    };
    const onUp = () => {
      ring.dataset.press = "false";
    };
    const onLeave = () => setShown(false);
    const onEnter = () => setShown(true);

    const loop = () => {
      ringX += (mouseX - ringX) * ease;
      ringY += (mouseY - ringY) * ease;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    if (!reduce) raf = requestAnimationFrame(loop);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    window.addEventListener("blur", onLeave);

    return () => {
      document.documentElement.classList.remove("cursor-none");
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      window.removeEventListener("blur", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return createPortal(
    <>
      <div ref={ringRef} className="cursor-ring" data-hover="false" data-press="false">
        <span />
      </div>
      <div ref={dotRef} className="cursor-dot" />
    </>,
    document.body
  );
}
