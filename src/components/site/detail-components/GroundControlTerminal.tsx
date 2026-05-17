"use client";

import * as React from "react";
import { motion } from "motion/react";
import type { DetailComponentProps } from "./registry";

/**
 * Example custom detail component: a faux terminal "install" trace for GroundControl.
 * Replace with your real demo (e.g. an animated screenshot or video).
 */
const STEPS = [
  { prompt: "$", text: "pip install ground-control-tui", color: "amber" as const },
  { prompt: ">", text: "Successfully installed ground-control-tui 0.6.2", color: "green" as const },
  { prompt: "$", text: "gc", color: "amber" as const },
  { prompt: "", text: "// Or if you have 'uv' installed", color: "muted" as const },
  { prompt: "$", text: "uvx --from ground-control-tui ground-control", color: "amber" as const },
];

const colorMap = {
  amber: "text-amber-300",
  muted: "text-white/55",
  green: "text-emerald-300",
  white: "text-white/85",
};

export function GroundControlTerminal(_props: DetailComponentProps) {
  return (
    <div className="p-4 sm:p-5">
      <div
        className="text-[11px] uppercase tracking-[0.2em] text-white/45 mb-3"
        style={{ fontFamily: "var(--font-body)" }}
      >
        Try it
      </div>
      <div className="rounded-2xl border border-white/12 bg-black/70 overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/8 bg-white/[0.03]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
          <span className="ml-2 text-xs text-white/45" style={{ fontFamily: "var(--font-mono)" }}>
            zsh — ground-control
          </span>
        </div>
        <div
          className="px-4 py-4 space-y-1 text-sm"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {STEPS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.18, duration: 0.3 }}
              className="flex items-start gap-2"
            >
              <span className="text-emerald-400/90 select-none">{s.prompt}</span>
              <span className={colorMap[s.color]}>{s.text}</span>
            </motion.div>
          ))}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ delay: STEPS.length * 0.18, duration: 1.2, repeat: Infinity }}
            className="inline-block h-4 w-2 bg-white/80 align-middle"
          />
        </div>
      </div>
    </div>
  );
}
