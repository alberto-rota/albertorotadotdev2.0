"use client";

import * as React from "react";
import NextImage from "next/image";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "motion/react";
import { ArrowUpRight, X } from "lucide-react";
import { Icon } from "./Icon";
import type { Product, ProductMedia } from "./types";
import { getDetailComponent } from "./detail-components/registry";

function useMediaQuery(query: string) {
  const get = React.useCallback(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.matchMedia(query).matches);
  }, [query]);

  const [matches, setMatches] = React.useState(get);
  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, [query]);
  return matches;
}

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted || typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

export function DetailPanel({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const open = product !== null;

  // Lock body scroll while open.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Esc to close.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <Portal>
      <AnimatePresence>
        {open ? (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[80] bg-black/65 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
        ) : null}

        {open ? (
          isDesktop ? (
            <SidePanel key="side" product={product!} onClose={onClose} />
          ) : (
            <BottomSheet key="sheet" product={product!} onClose={onClose} />
          )
        ) : null}
      </AnimatePresence>
    </Portal>
  );
}

function SidePanel({ product, onClose }: { product: Product; onClose: () => void }) {
  return (
    <motion.aside
      role="dialog"
      aria-modal="true"
      aria-label={product.title}
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 280, damping: 32 }}
      className="fixed right-0 top-0 bottom-0 z-[81] w-full sm:w-[560px] lg:w-[640px] max-w-[100vw] bg-black border-l border-white/10 shadow-[-30px_0_80px_-30px_rgba(0,0,0,0.7)]"
    >
      <DetailContent product={product} onClose={onClose} />
    </motion.aside>
  );
}

function BottomSheet({ product, onClose }: { product: Product; onClose: () => void }) {
  const y = useMotionValue(0);
  const sheetOpacity = useTransform(y, [0, 200], [1, 0.6]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 140 || info.velocity.y > 600) {
      onClose();
    } else {
      y.set(0);
    }
  };

  return (
    <motion.aside
      role="dialog"
      aria-modal="true"
      aria-label={product.title}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      style={{ y, opacity: sheetOpacity }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={onDragEnd}
      className="fixed inset-x-0 bottom-0 z-[81] h-[92vh] rounded-t-3xl bg-black border-t border-white/10 shadow-[0_-30px_80px_-20px_rgba(0,0,0,0.8)]"
    >
      <div className="pt-2.5 pb-1 flex items-center justify-center">
        <div className="h-1.5 w-12 rounded-full bg-white/15" />
      </div>
      <DetailContent product={product} onClose={onClose} compact />
    </motion.aside>
  );
}

function DetailContent({
  product,
  onClose,
  compact = false,
}: {
  product: Product;
  onClose: () => void;
  compact?: boolean;
}) {
  const accent = product.accent || "#ffffff";
  const Custom = product.detailComponent ? getDetailComponent(product.detailComponent) : null;
  const details = product.details;

  return (
    <div className="relative h-full overflow-y-auto overscroll-contain">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/85 backdrop-blur border-b border-white/8">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: accent }}
              aria-hidden
            />
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/55 truncate" style={{ fontFamily: "var(--font-body)" }}>
              {product.tag ?? "Detail"}
              {product.meta?.venue ? ` · ${product.meta.venue}` : ""}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail panel"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Hero image */}
      <div
        className={
          compact
            ? "relative w-full aspect-[16/10] overflow-hidden"
            : "relative w-full aspect-[16/10] overflow-hidden"
        }
      >
        <NextImage
          src={product.thumbnail}
          alt={product.title}
          fill
          sizes="(min-width: 768px) 640px, 100vw"
          className="object-cover"
          unoptimized={product.thumbnail.toLowerCase().endsWith(".svg")}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        />
      </div>

      {/* Body */}
      <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-7">
        {/* Title */}
        <header>
          <h2 className="font-display tracking-[0.03em] uppercase text-white text-4xl sm:text-5xl leading-[0.95]">
            {product.title}
          </h2>
          {product.subtitle ? (
            <p
              className="mt-3 text-white/75 text-base sm:text-lg leading-snug"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {product.subtitle}
            </p>
          ) : null}

          {/* Tech chips */}
          {product.tech && product.tech.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {product.tech.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-white/80"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </header>

        {/* Actions */}
        {product.actions && product.actions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {product.actions
              .filter((a) => a.href)
              .map((a, i) => (
                <a
                  key={`${a.href}-${i}`}
                  href={a.href}
                  target={a.href?.startsWith("http") ? "_blank" : undefined}
                  rel={a.href?.startsWith("http") ? "noreferrer" : undefined}
                  aria-label={a.ariaLabel ?? a.label ?? "Open link"}
                  className="inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2 text-sm font-medium uppercase tracking-[0.12em] hover:bg-white/90 transition-colors"
                >
                  <Icon name={a.icon} size={16} className="h-4 w-4 object-contain" />
                  {a.label ?? "Open"}
                  <ArrowUpRight className="h-4 w-4 opacity-70" />
                </a>
              ))}
          </div>
        ) : null}

        {/* Metadata grid */}
        {product.meta && Object.keys(product.meta).length > 0 ? (
          <dl className="grid grid-cols-2 gap-3 sm:gap-4">
            {Object.entries(product.meta).map(([k, v]) => (
              <div
                key={k}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3"
              >
                <dt
                  className="text-[10px] uppercase tracking-[0.18em] text-white/45"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {k}
                </dt>
                <dd className="mt-1 text-white text-sm" style={{ fontFamily: "var(--font-body)" }}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {/* Body text */}
        {details?.body ? (
          <div
            className="text-white/80 text-[15px] sm:text-base leading-relaxed space-y-4"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {details.body.split(/\n\s*\n/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        ) : product.description ? (
          <p
            className="text-white/80 text-[15px] sm:text-base leading-relaxed"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {product.description}
          </p>
        ) : null}

        {/* Highlights */}
        {details?.highlights && details.highlights.length > 0 ? (
          <ul className="space-y-2.5">
            {details.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: accent }}
                />
                <span className="text-white/80 leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                  {h}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {/* Media gallery */}
        {details?.media && details.media.length > 0 ? (
          <div className="space-y-3">
            <div className="text-[11px] uppercase tracking-[0.2em] text-white/45" style={{ fontFamily: "var(--font-body)" }}>
              Media
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {details.media.map((m, i) => (
                <MediaTile key={`${m.src}-${i}`} item={m} accent={accent} />
              ))}
            </div>
          </div>
        ) : null}

        {/* Custom component slot */}
        {Custom ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <Custom product={product} />
          </div>
        ) : null}

        {/* Footer accent */}
        <div className="pt-2 pb-4">
          <div
            className="h-px w-full opacity-50"
            style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
          />
        </div>
      </div>
    </div>
  );
}

function MediaTile({ item, accent }: { item: ProductMedia; accent: string }) {
  const isSvg = item.src.toLowerCase().endsWith(".svg");

  if (item.type === "image") {
    return (
      <figure className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="relative aspect-[16/10]">
          <NextImage
            src={item.src}
            alt={item.alt ?? item.caption ?? ""}
            fill
            sizes="(min-width: 768px) 320px, 90vw"
            className="object-cover"
            unoptimized={isSvg}
          />
        </div>
        {item.caption ? (
          <figcaption
            className="px-3 py-2 text-xs text-white/55 border-t border-white/8"
            style={{ fontFamily: "var(--font-body)" }}
          >
            <span
              className="mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle"
              style={{ background: accent }}
            />
            {item.caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  if (item.type === "video") {
    return (
      <figure className="overflow-hidden rounded-2xl border border-white/10 bg-black">
        <video
          src={item.src}
          controls
          playsInline
          poster={item.poster}
          className="w-full aspect-[16/10] object-cover"
        />
        {item.caption ? (
          <figcaption
            className="px-3 py-2 text-xs text-white/55 border-t border-white/8"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {item.caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  return (
    <figure className="overflow-hidden rounded-2xl border border-white/10 bg-black">
      <iframe
        src={item.src}
        title={item.caption ?? "Embedded media"}
        className="w-full aspect-[16/10]"
        loading="lazy"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      />
      {item.caption ? (
        <figcaption
          className="px-3 py-2 text-xs text-white/55 border-t border-white/8"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {item.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
