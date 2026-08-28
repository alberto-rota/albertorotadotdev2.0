"use client";

import * as React from "react";
import NextImage from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { cn, shouldBypassImageOptimization } from "@/lib/utils";
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

const TITLE = "Get in touch";
const MILAN_COORDS = "45.4642° N  9.1900° E";

function canTilt(): boolean {
  return (
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function onCardPointerMove(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  if (el.dataset.tilt !== "1") return;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  el.style.setProperty("--mx", `${(x * 100).toFixed(2)}%`);
  el.style.setProperty("--my", `${(y * 100).toFixed(2)}%`);
  el.style.setProperty("--rx", `${((0.5 - y) * 7).toFixed(2)}deg`);
  el.style.setProperty("--ry", `${((x - 0.5) * 9).toFixed(2)}deg`);
  el.dataset.hot = "true";
}

function onCardPointerEnter(e: React.PointerEvent<HTMLElement>) {
  e.currentTarget.dataset.tilt = canTilt() ? "1" : "0";
}

function onCardPointerLeave(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  el.style.setProperty("--rx", "0deg");
  el.style.setProperty("--ry", "0deg");
  el.dataset.hot = "false";
}

function useMilanClock() {
  const [label, setLabel] = React.useState<string>("");

  React.useEffect(() => {
    const fmt = () => {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Rome",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZoneName: "short",
      }).formatToParts(new Date());
      const hour = parts.find((p) => p.type === "hour")?.value ?? "";
      const minute = parts.find((p) => p.type === "minute")?.value ?? "";
      const tz = parts.find((p) => p.type === "timeZoneName")?.value ?? "CET";
      return `${hour}:${minute} ${tz}`;
    };
    const tick = () => setLabel(fmt());
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return label;
}

export function Contact({ profiles = [] }: { profiles?: Product[] }) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const stageRef = React.useRef<HTMLElement | null>(null);
  const milanTime = useMilanClock();

  const profileLinks = profiles.filter((p) => {
    const link = (p.link ?? "").toLowerCase();
    return !link.includes("github.com/alberto-rota");
  });

  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    if (!canTilt()) return;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      el.style.setProperty("--mx", `${x.toFixed(2)}%`);
      el.style.setProperty("--my", `${y.toFixed(2)}%`);
    };
    el.addEventListener("pointermove", onMove, { passive: true });
    return () => el.removeEventListener("pointermove", onMove);
  }, []);

  const copy = async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1600);
    } catch {
      // ignore
    }
  };

  const personal = CONTACTS[0];
  const academic = CONTACTS[1];
  const github = CONTACTS[2];
  const linkedin = CONTACTS[3];
  const location = CONTACTS[4];

  return (
    <section
      ref={stageRef}
      id="contact"
      aria-label="Get in touch"
      className="contact-stage relative pt-16 sm:pt-24 scroll-mt-24"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="contact-glow absolute inset-0" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: 0.45 }}
              className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-white/50"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {/* <span className="text-emerald-400/90">$</span>
              contact --open
              <span
                aria-hidden
                className="contact-cursor inline-block h-3 w-1.5 translate-y-px bg-white"
              /> */}
            </motion.p>

            <h2 className="mt-2 pl-[0.06em] font-display tracking-[0.04em] uppercase text-4xl sm:text-5xl md:text-7xl leading-[0.9]">
              {TITLE.split("").map((ch, i) => (
                <motion.span
                  key={`${ch}-${i}`}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-15%" }}
                  transition={{ duration: 0.45, delay: 0.04 + i * 0.028 }}
                  className="inline-block"
                >
                  {ch === " " ? "\u00a0" : ch}
                </motion.span>
              ))}
            </h2>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: 0.5, delay: 0.22 }}
              className="mt-3 text-sm sm:text-base text-white/60 max-w-xl"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Open to research collaborations, talks and consulting around medical AI,
              surgical robotics and developer tooling.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="flex shrink-0 flex-col items-start sm:items-end gap-1.5"
          >
            <span
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-white/75"
              style={{ fontFamily: "var(--font-body)" }}
            >
              <span aria-hidden className="relative flex h-2 w-2">
                <span className="contact-dot absolute inset-0 rounded-full bg-emerald-400" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Available
            </span>
            {milanTime ? (
              <span
                className="text-[11px] text-white/45 tabular-nums"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Milan · {milanTime}
              </span>
            ) : (
              <span className="h-4" />
            )}
          </motion.div>
        </div>

        <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
          <ChannelCard
            item={personal}
            copied={copiedId === personal.id}
            onCopy={copy}
            featured
            className="md:col-span-7 md:row-span-2 min-h-[220px] sm:min-h-[260px]"
            delay={0}
          />
          <ChannelCard
            item={academic}
            copied={copiedId === academic.id}
            onCopy={copy}
            className="md:col-span-5"
            delay={0.06}
          />
          <ChannelCard
            item={github}
            copied={false}
            onCopy={copy}
            className="md:col-span-5"
            delay={0.1}
          />
          <ChannelCard
            item={linkedin}
            copied={false}
            onCopy={copy}
            className="md:col-span-6"
            delay={0.14}
          />
          <ChannelCard
            item={location}
            copied={false}
            onCopy={copy}
            className="md:col-span-6"
            delay={0.18}
            meta={milanTime ? `${milanTime}  ·  ${MILAN_COORDS}` : MILAN_COORDS}
          />
        </div>

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

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <MagneticLink
            href="mailto:alberto_rota@outlook.com"
            className="inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-3 text-sm font-medium uppercase tracking-[0.14em] hover:bg-white/90"
          >
            <Mail className="h-4 w-4" />
            Send me an email
          </MagneticLink>
          <MagneticLink
            href="/pdfs/CV_Alberto_Rota.pdf"
            download
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-medium uppercase tracking-[0.14em] text-white hover:bg-white/10"
          >
            <FileDown className="h-4 w-4" />
            Download CV
          </MagneticLink>
        </div>
      </div>

      <Footer />
    </section>
  );
}

function ChannelCard({
  item,
  copied,
  onCopy,
  featured = false,
  className,
  delay,
  meta,
}: {
  item: ContactItem;
  copied: boolean;
  onCopy: (id: string, value: string) => void;
  featured?: boolean;
  className?: string;
  delay: number;
  meta?: string;
}) {
  const isLink = Boolean(item.href) && !item.copyable;
  const Wrapper: React.ElementType = isLink ? "a" : "div";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.45, delay }}
      className={className}
    >
      <Wrapper
        {...(isLink
          ? {
              href: item.href,
              target: item.href?.startsWith("http") ? "_blank" : undefined,
              rel: item.href?.startsWith("http") ? "noreferrer" : undefined,
            }
          : {})}
        data-cursor="hover"
        onPointerEnter={onCardPointerEnter}
        onPointerMove={onCardPointerMove}
        onPointerLeave={onCardPointerLeave}
        className={cn(
          "contact-card group relative flex h-full overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04]",
          isLink && "block hover:border-white/30 hover:bg-white/[0.07]",
          item.copyable && "hover:border-white/30 hover:bg-white/[0.07]"
        )}
      >
        <span aria-hidden className="contact-card-spot" />
        <span aria-hidden className="contact-sheen" />
        {featured ? <span aria-hidden className="contact-scan absolute inset-0" /> : null}
        <span
          aria-hidden
          className="absolute top-0 left-0 right-0 h-px opacity-70"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
          }}
        />

        {item.copyable ? (
          <button
            type="button"
            onClick={() => onCopy(item.id, item.value)}
            aria-label={copied ? "Copied" : `Copy ${item.value}`}
            className={cn(
              "relative z-10 flex h-full min-h-[5.5rem] w-full flex-col items-start text-left",
              featured ? "p-6 sm:p-8" : "p-5",
              "pr-24"
            )}
          >
            <CardBody item={item} featured={featured} meta={meta} />
          </button>
        ) : (
          <div
            className={cn(
              "relative z-10 flex h-full min-h-[5.5rem] w-full flex-col items-start text-left",
              featured ? "p-6 sm:p-8" : "p-5",
              "pr-24"
            )}
          >
            <CardBody item={item} featured={featured} meta={meta} />
          </div>
        )}

        <div className="pointer-events-none absolute top-4 right-4 z-20 flex items-center gap-1.5">
          {item.copyable ? (
            <span
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
                copied
                  ? "border-emerald-300/40 bg-emerald-300/15 text-emerald-300"
                  : "border-white/12 bg-white/[0.04] text-white/80 group-hover:bg-white/10"
              )}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </span>
          ) : null}
          {item.href ? (
            item.copyable ? (
              <a
                href={item.href}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Compose email to ${item.value}`}
                className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white/80 hover:bg-white hover:text-black transition-colors"
              >
                <ArrowUpRight className="h-4 w-4" />
              </a>
            ) : (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white/80 group-hover:bg-white group-hover:text-black transition-colors">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            )
          ) : null}
        </div>

        <AnimatePresence>
          {copied ? (
            <motion.div
              key="copied"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-30 flex items-center justify-center bg-white text-black"
              aria-live="polite"
            >
              <span className="inline-flex items-center gap-2 font-display text-xl sm:text-2xl uppercase tracking-[0.16em]">
                <Check className="h-5 w-5" />
                Copied
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Wrapper>
    </motion.div>
  );
}

function CardBody({
  item,
  featured,
  meta,
}: {
  item: ContactItem;
  featured: boolean;
  meta?: string;
}) {
  return (
    <>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-xl bg-white/8 border border-white/12 text-white",
            featured ? "h-12 w-12" : "h-10 w-10"
          )}
        >
          {item.icon}
        </span>
        <span
          className="text-[10px] uppercase tracking-[0.22em] text-white/45"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {item.label}
        </span>
      </div>
      <div
        className={cn(
          "mt-auto pt-6 wrap-break-word text-white",
          featured
            ? "text-xl sm:text-3xl md:text-[2.15rem] leading-[1.15] tracking-tight"
            : "text-sm sm:text-base"
        )}
        style={{ fontFamily: featured ? "var(--font-mono)" : "var(--font-body)" }}
      >
        {item.value}
      </div>
      {meta ? (
        <div
          className="mt-2 text-[11px] text-white/40 tabular-nums"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {meta}
        </div>
      ) : featured ? (
        <div
          className="mt-3 text-[11px] uppercase tracking-[0.2em] text-white/40"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Click to copy
        </div>
      ) : null}
    </>
  );
}

function MagneticLink({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"a">) {
  return (
    <a
      {...props}
      data-cursor="hover"
      className={cn("contact-mag", className)}
      onPointerMove={(e) => {
        if (!canTilt()) return;
        const r = e.currentTarget.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        e.currentTarget.style.transform = `translate3d(${(dx * 10).toFixed(2)}px, ${(dy * 7).toFixed(2)}px, 0)`;
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.transform = "translate3d(0,0,0)";
      }}
    >
      {children}
    </a>
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
        data-cursor="hover"
        className="group inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.04] pl-2 pr-4 py-1.5 hover:border-white/30 hover:bg-white/[0.08] hover:-translate-y-0.5 transition-all"
        aria-label={product.title}
      >
        <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 overflow-hidden">
          <NextImage
            src={product.thumbnail}
            alt=""
            width={20}
            height={20}
            className="object-contain"
            unoptimized={shouldBypassImageOptimization(product.thumbnail)}
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
          $ curl -L albertorota.dev
        </div>
      </div>
    </footer>
  );
}
