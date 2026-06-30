"use client";

import * as React from "react";
import NextImage from "next/image";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  Check,
  Copy,
  FileDown,
  Github,
  Linkedin,
  Mail,
  MapPin,
} from "lucide-react";
import type { Product } from "./types";

type ContactItem = {
  id: string;
  label: string;
  value: string;
  href?: string;
  icon: React.ReactNode;
  copyable?: boolean;
};

const CONTACTS: ContactItem[] = [
  {
    id: "email-personal",
    label: "Personal email",
    value: "alberto_rota@outlook.com",
    href: "mailto:alberto_rota@outlook.com",
    icon: <Mail className="h-5 w-5" />,
    copyable: true,
  },
  {
    id: "email-academic",
    label: "Academic email",
    value: "alberto1.rota@polimi.it",
    href: "mailto:alberto1.rota@polimi.it",
    icon: <Mail className="h-5 w-5" />,
    copyable: true,
  },
  {
    id: "github",
    label: "GitHub",
    value: "github.com/alberto-rota",
    href: "https://github.com/alberto-rota",
    icon: <Github className="h-5 w-5" />,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    value: "linkedin.com/in/albe-rota",
    href: "https://www.linkedin.com/in/albe-rota/",
    icon: <Linkedin className="h-5 w-5" />,
  },
  {
    id: "location",
    label: "Based in",
    value: "Milan, Italy",
    icon: <MapPin className="h-5 w-5" />,
  },
];

export function Contact({ profiles = [] }: { profiles?: Product[] }) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Skip duplicates of channels already shown as featured cards (GitHub).
  const profileLinks = profiles.filter((p) => {
    const link = (p.link ?? "").toLowerCase();
    return !link.includes("github.com/alberto-rota");
  });

  const copy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <section
      id="contact"
      aria-label="Get in touch"
      className="relative pt-16 sm:pt-24 scroll-mt-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.5 }}
          className="font-display tracking-[0.04em] uppercase text-4xl sm:text-5xl md:text-6xl leading-[0.95]"
        >
          Get in touch
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mt-2 text-sm sm:text-base text-white/60 max-w-2xl"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Open to research collaborations, talks and consulting around medical AI,
          surgical robotics and developer tooling.
        </motion.p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {CONTACTS.map((c, i) => {
            const Container: React.ElementType = c.href ? "a" : "div";
            const isCopied = copiedId === c.id;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.25) }}
              >
                <Container
                  {...(c.href
                    ? {
                        href: c.href,
                        target: c.href.startsWith("http") ? "_blank" : undefined,
                        rel: c.href.startsWith("http") ? "noreferrer" : undefined,
                      }
                    : {})}
                  className="group block rounded-2xl border border-white/12 bg-white/[0.04] p-5 hover:border-white/30 hover:bg-white/[0.07] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/8 border border-white/12 text-white">
                        {c.icon}
                      </span>
                      <div>
                        <div
                          className="text-[10px] uppercase tracking-[0.22em] text-white/45"
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          {c.label}
                        </div>
                        <div
                          className="mt-0.5 text-white text-sm sm:text-base wrap-break-word"
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          {c.value}
                        </div>
                      </div>
                    </div>

                    {c.copyable ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          copy(c.id, c.value);
                        }}
                        aria-label={isCopied ? "Copied" : `Copy ${c.value}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] hover:bg-white/10 transition-colors"
                      >
                        {isCopied ? (
                          <Check className="h-4 w-4 text-emerald-300" />
                        ) : (
                          <Copy className="h-4 w-4 text-white/80" />
                        )}
                      </button>
                    ) : c.href ? (
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white/80 group-hover:bg-white group-hover:text-black transition-colors">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    ) : null}
                  </div>
                </Container>
              </motion.div>
            );
          })}
        </div>

        {/* Profile strip — pulled from products.json (tag: "resources") */}
        {profileLinks.length > 0 ? (
          <div className="mt-10">
            <div
              className="flex items-center gap-3 text-[10px] uppercase tracking-[0.24em] text-white/45"
              style={{ fontFamily: "var(--font-body)" }}
            >
              <span>Also on</span>
              <span aria-hidden className="h-px flex-1 bg-white/8" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {profileLinks.map((p, i) => (
                <ProfileChip key={p.slug ?? `${p.title}-${i}`} product={p} index={i} />
              ))}
            </div>
          </div>
        ) : null}

        {/* CTA row */}
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <a
            href="mailto:alberto_rota@outlook.com"
            className="inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-3 text-sm font-medium uppercase tracking-[0.14em] hover:bg-white/90 transition-colors"
          >
            <Mail className="h-4 w-4" />
            Send me an email
          </a>
          <a
            href="/pdfs/CV_Alberto_Rota.pdf"
            download
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-medium uppercase tracking-[0.14em] text-white hover:bg-white/10 transition-colors"
          >
            <FileDown className="h-4 w-4" />
            Download CV
          </a>
        </div>
      </div>

      <Footer />
    </section>
  );
}

function ProfileChip({ product, index }: { product: Product; index: number }) {
  const href = product.link && product.link !== "#" ? product.link : undefined;
  const Container: React.ElementType = href ? "a" : "div";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.25) }}
    >
      <Container
        {...(href
          ? {
              href,
              target: href.startsWith("http") ? "_blank" : undefined,
              rel: href.startsWith("http") ? "noreferrer" : undefined,
            }
          : {})}
        className="group inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.04] pl-2 pr-4 py-1.5 hover:border-white/30 hover:bg-white/[0.08] transition-colors"
        aria-label={product.title}
      >
        <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 overflow-hidden">
          <NextImage
            src={product.thumbnail}
            alt=""
            width={20}
            height={20}
            className="object-contain"
            unoptimized={product.thumbnail.toLowerCase().endsWith(".svg")}
          />
        </span>
        <span
          className="text-xs sm:text-sm uppercase tracking-[0.14em] text-white/85 group-hover:text-white"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {product.title}
        </span>
        {href ? (
          <ArrowUpRight className="h-3.5 w-3.5 text-white/45 group-hover:text-white transition-colors" />
        ) : null}
      </Container>
    </motion.div>
  );
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-white/8 pt-6 pb-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div
          className="text-xs text-white/40"
          style={{ fontFamily: "var(--font-body)" }}
        >
          © {new Date().getFullYear()} Alberto Rota. Built with Claude Code because I'm definitely not a web dev
        </div>
        <div
          className="text-[10px] uppercase tracking-[0.24em] text-white/35"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          $ curl https://albertorota.dev
        </div>
      </div>
    </footer>
  );
}
