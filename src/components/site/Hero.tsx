"use client";

import * as React from "react";
import NextImage from "next/image";
import { motion } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Copy,
  FileDown,
  Gamepad2,
  Github,
  Mail,
  MapPin,
} from "lucide-react";
import { RepelGrid } from "./particles/RepelGrid";
import { Icon } from "./Icon";
import type { ContactLink, Product } from "./types";

const CURL_TARGET = "https://albertorota.dev";
const DEFAULT_TAGLINE =
  "PhD candidate in Bioengineering at Politecnico di Milano. I build research, open-source tools, and visual systems for surgical robotics and medical AI.";

const glassBtn =
  "rounded-full border border-white/12 bg-black/60 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-colors";
const glassBtnPrimary =
  "rounded-full border border-white/20 bg-white/90 backdrop-blur-xl text-black shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:bg-white transition-colors";

function CircleLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      aria-label={label}
      title={label}
      className={`inline-flex h-10.5 w-10.5 items-center justify-center text-white/85 hover:text-white hover:border-white/25 ${glassBtn}`}
    >
      {children}
    </a>
  );
}

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = 96;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

export function Hero({
  tagline = DEFAULT_TAGLINE,
  pinned = [],
  contacts = [],
}: {
  tagline?: string;
  pinned?: Product[];
  contacts?: ContactLink[];
}) {
  const [copied, setCopied] = React.useState(false);
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const [showGameCta, setShowGameCta] = React.useState(false);
  const curlCommand = `curl ${CURL_TARGET}`;

  // Desktop easter-egg: once the visitor has actively played with the cursor
  // particle field for a few seconds, reveal a clickable nudge to the game.
  // (The particle field is desktop-only — see RepelGrid `hidden md:block`.)
  React.useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const desktop = window.matchMedia("(min-width: 768px) and (pointer: fine)");
    if (!desktop.matches) return;

    const THRESHOLD_MS = 5000; // active interaction time before the nudge shows
    const MOVE_WINDOW_MS = 300; // counts as "interacting" if moved this recently
    let engaged = 0;
    let lastMove = 0;
    let lastTick = 0;
    let raf = 0;

    const onMove = () => {
      lastMove = performance.now();
    };
    section.addEventListener("pointermove", onMove, { passive: true });

    const tick = (now: number) => {
      if (lastTick && now - lastMove < MOVE_WINDOW_MS) engaged += now - lastTick;
      lastTick = now;
      if (engaged >= THRESHOLD_MS) {
        setShowGameCta(true);
        return; // stop the loop; the nudge stays put
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      section.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

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
      ref={sectionRef}
      id="top"
      className="relative isolate overflow-hidden min-h-[42vh] sm:min-h-[68vh]"
      aria-label="Introduction"
    >
      {/* Cursor-interactive particle grid backdrop — desktop only. On mobile the
          background animation lives behind the whole page (see ScrollField). */}
      <RepelGrid className="pointer-events-none absolute inset-0 -z-10 hidden md:block" />

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
              href="/pdfs/CV_Alberto_Rota.pdf"
              download
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium uppercase tracking-[0.14em] text-white/85 hover:text-white hover:border-white/25 ${glassBtn}`}
            >
              <FileDown className="h-4 w-4" />
              Download my CV
            </a>

            {contacts.length > 0 || pinned.length > 0 ? (
              <div className="flex w-full sm:w-auto flex-wrap items-center justify-center gap-2.5">
                <span
                  aria-hidden
                  className="hidden sm:block h-7 w-px bg-white/15 mx-1"
                />
                {contacts.map((c) => (
                  <CircleLink
                    key={c.id ?? c.href}
                    href={c.href as string}
                    label={c.label ?? c.id ?? c.href ?? ""}
                  >
                    <Icon name={c.icon} size={16} className="h-4 w-4" />
                  </CircleLink>
                ))}
                {pinned.map((p) => (
                  <CircleLink
                    key={p.slug ?? p.title}
                    href={p.link as string}
                    label={p.title}
                  >
                    <span className="relative inline-flex h-5 w-5 items-center justify-center overflow-hidden rounded-full">
                      <NextImage
                        src={p.thumbnail}
                        alt=""
                        width={20}
                        height={20}
                        className="object-contain"
                        unoptimized={p.thumbnail.toLowerCase().endsWith(".svg")}
                      />
                    </span>
                  </CircleLink>
                ))}
              </div>
            ) : null}
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

      {/* Desktop nudge: appears after the visitor has played with the particle
          field for a while. Clickable — takes them to the game. */}
      {showGameCta ? (
        <motion.a
          href="/game"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`group absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 md:inline-flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-sm text-white/85 hover:text-white hover:border-white/25 ${glassBtn}`}
          aria-label="Play the gravity game"
        >
          <Gamepad2 className="h-4 w-4" />
          <span className="uppercase tracking-[0.14em]">
            Like the particles? Come play with gravity
          </span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </motion.a>
      ) : null}

      {/* divider */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
    </section>
  );
}
