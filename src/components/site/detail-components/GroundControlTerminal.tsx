"use client";

import * as React from "react";
import { motion } from "motion/react";
import type { DetailComponentProps } from "./registry";
import type { TerminalLine } from "../types";

/**
 * A faux terminal trace for the tool detail pages.
 *
 * Lines come from the product's own `details.terminal` in `products.json`, so
 * every tool shows its real install / usage commands. The fallback below is
 * only used when a product declares the component without any lines.
 */
const FALLBACK: TerminalLine[] = [
  { prompt: "$", text: "uv tool install ground-control-tui", tone: "cmd" },
  { prompt: ">", text: "Installed 1 executable: groundcontrol", tone: "out" },
  { prompt: "$", text: "gc", tone: "cmd" },
];

const toneClass: Record<NonNullable<TerminalLine["tone"]>, string> = {
  cmd: "text-amber-300",
  out: "text-emerald-300",
  note: "text-white/55",
};

export function GroundControlTerminal({ product }: DetailComponentProps) {
  const terminal = product.details?.terminal;
  const lines = terminal?.lines?.length ? terminal.lines : FALLBACK;
  const title = terminal?.title ?? `zsh: ${product.title}`;

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
            {title}
          </span>
        </div>
        <div
          className="px-4 py-4 space-y-1 text-sm overflow-x-auto"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {lines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.18, duration: 0.3 }}
              className="flex items-start gap-2"
            >
              <span className="text-emerald-400/90 select-none">{line.prompt ?? ""}</span>
              <span className={toneClass[line.tone ?? "cmd"] + " whitespace-pre"}>{line.text}</span>
            </motion.div>
          ))}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ delay: lines.length * 0.18, duration: 1.2, repeat: Infinity }}
            className="inline-block h-4 w-2 bg-white/80 align-middle"
          />
        </div>
      </div>
    </div>
  );
}
