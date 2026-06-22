"use client";

import * as React from "react";
import { motion } from "motion/react";
import { FileDown, Gamepad2, Mail, Menu as MenuIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SectionId } from "./types";

type NavItem = { id: SectionId | "contact"; label: string };

const ITEMS: NavItem[] = [
  { id: "research", label: "Research" },
  { id: "open-source", label: "Open Source" },
  { id: "designs", label: "Designs" },
  { id: "contact", label: "Contact" },
];

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = 96; // height of the floating nav + breathing room
  const top =
    el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

export function Nav() {
  const [activeId, setActiveId] = React.useState<string>("");
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const ids = ITEMS.map((i) => i.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Lock body scroll when mobile menu is open.
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : prev;
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <header
        className="fixed top-0 inset-x-0 z-50 pointer-events-none"
      >
        <div className="mx-auto max-w-6xl px-3 sm:px-4 pt-3 sm:pt-5">
          <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-full border border-white/12 bg-black/60 backdrop-blur-xl px-2 py-2 shadow-[0_8px_30px_rgb(0,0,0,0.4)] md:grid md:grid-cols-[1fr_auto_1fr]">
            <button
              onClick={() => scrollToId("top")}
              className="shrink-0 font-display text-lg sm:text-xl tracking-[0.18em] pl-3 pr-2 py-1 text-white/90 md:hover:text-white transition-colors md:justify-self-start"
              aria-label="Back to top"
            >
              AR
            </button>

            <nav className="hidden md:flex items-center justify-center gap-1 justify-self-center">
              {ITEMS.map((item) => {
                const active = activeId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToId(item.id)}
                    className={cn(
                      "relative font-display tracking-[0.12em] text-sm px-3 py-2 rounded-full transition-colors",
                      active ? "text-black" : "text-white/70 hover:text-white"
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId="nav-pill-active"
                        className="absolute inset-0 rounded-full bg-white"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    ) : null}
                    <span className="relative z-10 uppercase">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="flex shrink-0 items-center justify-end gap-1.5 md:col-start-3 md:justify-self-end">
              <a
                href="/game"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium tracking-wider uppercase text-white/85 hover:text-white border border-white/15 hover:border-white/40 transition-colors"
                aria-label="Play Gravity Well"
              >
                <Gamepad2 className="h-4 w-4" />
                <span className="hidden lg:inline">Play</span>
              </a>
              <a
                href="/CV_Alberto_Rota.pdf"
                download
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium tracking-wider uppercase text-white/85 hover:text-white border border-white/15 hover:border-white/40 transition-colors"
              >
                <FileDown className="h-4 w-4" />
                <span className="hidden lg:inline">CV</span>
              </a>
              <button
                onClick={() => scrollToId("contact")}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium tracking-wider uppercase bg-white text-black hover:bg-white/90 transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Get in touch</span>
              </button>

              <button
                onClick={() => setOpen(true)}
                aria-label="Open menu"
                className="md:hidden ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white"
              >
                <MenuIcon className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile sheet menu */}
      <motion.div
        initial={false}
        animate={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm md:hidden"
        onClick={() => setOpen(false)}
      />
      <motion.aside
        initial={false}
        animate={{ y: open ? 0 : "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 32 }}
        className="fixed inset-x-0 bottom-0 z-[61] rounded-t-3xl border-t border-white/10 bg-black md:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className="px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/15" />
          <div className="flex items-center justify-between mb-4">
            <span className="font-display tracking-[0.16em] text-lg text-white">MENU</span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <ul className="flex flex-col gap-1.5">
            {ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setOpen(false);
                    setTimeout(() => scrollToId(item.id), 120);
                  }}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 font-display tracking-[0.14em] text-base uppercase text-white"
                >
                  <span>{item.label}</span>
                  <span aria-hidden className="text-white/40 text-xl">→</span>
                </button>
              </li>
            ))}
            <li>
              <a
                href="/game"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/4 px-4 py-3 font-display tracking-[0.14em] text-base uppercase text-white"
              >
                <span className="inline-flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4" /> Play
                </span>
                <span aria-hidden className="text-white/40 text-xl">→</span>
              </a>
            </li>
          </ul>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <a
              href="/CV_Alberto_Rota.pdf"
              download
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 px-4 py-3 text-sm uppercase tracking-wider text-white"
            >
              <FileDown className="h-4 w-4" /> Download CV
            </a>
            <button
              onClick={() => {
                setOpen(false);
                setTimeout(() => scrollToId("contact"), 120);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm uppercase tracking-wider text-black"
            >
              <Mail className="h-4 w-4" /> Contact
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
