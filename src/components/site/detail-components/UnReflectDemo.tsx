"use client";

import * as React from "react";
import NextImage from "next/image";
import { motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import type { DetailComponentProps } from "./registry";

/**
 * Example custom detail component: a before/after slider for the UnReflect Anything page.
 * Replace the two `src`s with your actual before/after assets.
 *
 * If the images don't exist yet, the slider still demonstrates the interaction.
 */
const BEFORE_SRC = "/unreflect.png";
const AFTER_SRC = "/unreflect.png";

export function UnReflectDemo(_props: DetailComponentProps) {
  const x = useMotionValue(0.5);
  const ref = React.useRef<HTMLDivElement | null>(null);

  const handle = (clientX: number) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    x.set(Math.max(0, Math.min(1, ratio)));
  };

  const onDrag = (_e: unknown, info: PanInfo) => {
    handle(info.point.x);
  };

  const clipPath = useTransform(x, (v) => `inset(0 ${(1 - v) * 100}% 0 0)`);
  const handleLeft = useTransform(x, (v) => `${v * 100}%`);

  return (
    <div className="p-4 sm:p-5">
      <div
        className="text-[11px] uppercase tracking-[0.2em] text-white/45 mb-3"
        style={{ fontFamily: "var(--font-body)" }}
      >
        Before / After
      </div>
      <div
        ref={ref}
        onPointerDown={(e) => handle(e.clientX)}
        className="relative w-full aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 select-none touch-none"
      >
        <NextImage
          src={AFTER_SRC}
          alt="After"
          fill
          className="object-cover"
          sizes="(min-width: 768px) 540px, 90vw"
          unoptimized={AFTER_SRC.toLowerCase().endsWith(".svg")}
        />
        <motion.div
          style={{ clipPath }}
          className="absolute inset-0"
        >
          <NextImage
            src={BEFORE_SRC}
            alt="Before"
            fill
            className="object-cover"
            sizes="(min-width: 768px) 540px, 90vw"
            unoptimized={BEFORE_SRC.toLowerCase().endsWith(".svg")}
          />
        </motion.div>

        {/* Handle */}
        <motion.div
          style={{ left: handleLeft }}
          drag="x"
          dragConstraints={ref}
          dragElastic={0}
          onDrag={onDrag}
          className="absolute top-0 bottom-0 -translate-x-1/2 cursor-ew-resize"
        >
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-white/90" />
          <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
            <span className="text-xs font-semibold">⇆</span>
          </div>
        </motion.div>

        {/* Labels */}
        <div className="pointer-events-none absolute top-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-white/80" style={{ fontFamily: "var(--font-body)" }}>
          Input
        </div>
        <div className="pointer-events-none absolute top-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-white/80" style={{ fontFamily: "var(--font-body)" }}>
          Cleaned
        </div>
      </div>

      <p
        className="mt-3 text-xs text-white/55"
        style={{ fontFamily: "var(--font-body)" }}
      >
        Drag the slider to compare. Swap the assets in <code className="text-white/75">UnReflectDemo.tsx</code> with your real before/after.
      </p>
    </div>
  );
}
