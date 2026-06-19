"use client";

import * as React from "react";
import { motion } from "motion/react";
import { ArrowDown, Check, Copy, FileDown, Github, Mail, MapPin } from "lucide-react";
import { RepelGrid } from "./particles/RepelGrid";

const CURL_TARGET = "https://albertorota.dev";
const DEFAULT_TAGLINE =
  "PhD candidate in Bioengineering at Politecnico di Milano. I build research, open-source tools, and visual systems for surgical robotics and medical AI.";

const glassBtn =
  "rounded-full border border-white/12 bg-black/60 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-colors";
const glassBtnPrimary =
  "rounded-full border border-white/20 bg-white/90 backdrop-blur-xl text-black shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:bg-white transition-colors";

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = 96;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

export function Hero({ tagline = DEFAULT_TAGLINE }: { tagline?: string }) {
  const [copied, setCopied] = React.useState(false);
  const curlCommand = `curl ${CURL_TARGET}`;

  const copyCurl = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(curlCommand);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  }, [curlCommand]);

  return (
    <section
      id="top"
      className="relative isolate overflow-hidden min-h-[42vh] sm:min-h-[68vh]"
      aria-label="Introduction"
    >
      {/* Cursor-interactive 3D particle grid backdrop */}
      <RepelGrid className="pointer-events-none absolute inset-0 -z-10" />

      {/* Subtle bottom fade so the field eases into the page below */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 -z-10"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0), #000)",
        }}
      />

      {/* Top scanline accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 min-h-[42vh] sm:min-h-[64vh] flex flex-col items-center justify-center text-center pt-20 pb-8">
        {/* Radial falloff so particles sit behind the copy */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-[1] h-[min(520px,85%)] w-[min(920px,120%)] -translate-x-1/2 -translate-y-[48%]"
          style={{
            background:
              "radial-gradient(ellipse 72% 68% at 50% 50%, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.72) 42%, rgba(0,0,0,0.28) 68%, transparent 82%)",
          }}
        />

        <div className="relative w-full flex flex-col items-center text-center">
          {/* Name with shimmer sweep */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative font-display tracking-[0.04em] leading-[0.92] text-[15vw] sm:text-[9vw] md:text-[7rem] lg:text-[8.5rem]"
          >
            {/* base text */}
            <span className="bg-clip-text text-transparent bg-[linear-gradient(180deg,#ffffff_0%,#cfcfcf_70%,#9a9a9a_100%)]">
              ALBERTO ROTA
            </span>
            {/* moving shimmer */}
            <span
              aria-hidden
              className="absolute inset-0 bg-clip-text text-transparent shimmer-sweep"
            >
              ALBERTO ROTA
            </span>
            {/* soft glow */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 blur-[18px] opacity-40 text-white"
            >
              ALBERTO ROTA
            </span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-3 max-w-2xl text-sm sm:text-base text-white/70 leading-relaxed"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {tagline}
          </motion.p>

          {/* Meta row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-white/55"
            style={{ fontFamily: "var(--font-body)" }}
          >
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Milan, Italy
            </span>
            <a
              href="https://github.com/alberto-rota"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Github className="h-3.5 w-3.5" /> alberto-rota
            </a>
            <a
              href="mailto:alberto_rota@outlook.com"
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Mail className="h-3.5 w-3.5" /> alberto_rota@outlook.com
            </a>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-2.5"
          >
            <button
              onClick={() => scrollToId("research")}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium uppercase tracking-[0.14em] ${glassBtnPrimary}`}
            >
              View my work
              <ArrowDown className="h-4 w-4" />
            </button>
            <a
              href="/CV_Alberto_Rota.pdf"
              download
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium uppercase tracking-[0.14em] text-white/85 hover:text-white hover:border-white/25 ${glassBtn}`}
            >
              <FileDown className="h-4 w-4" />
              Download my CV
            </a>
          </motion.div>

          {/* curl pill */}
          <motion.button
            type="button"
            onClick={copyCurl}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.32 }}
            className={`group mt-5 inline-flex max-w-full items-center gap-3 px-3.5 py-2 text-xs sm:text-sm text-white/85 hover:border-white/25 ${glassBtn}`}
            aria-label={copied ? "Copied" : "Copy curl command"}
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span className="text-emerald-400/90 select-none">$</span>
            <span className="text-amber-300/90">curl</span>
            <span className="text-white/85 truncate">{CURL_TARGET}</span>
            <span className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-300" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-white/80" />
              )}
            </span>
          </motion.button>
        </div>
      </div>

      {/* divider */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
    </section>
  );
}
