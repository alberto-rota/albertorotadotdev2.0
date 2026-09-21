"use client";

import * as React from "react";
import Link from "next/link";
import NextImage from "next/image";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Nav } from "./Nav";
import { Icon } from "./Icon";
import { CiteButton } from "./CiteButton";
import { getCitationPath } from "./citation-utils";
import { getPaperLinks, getResearchSections, hasPaperMorph } from "./paper-utils";
import { PaperMorphButton } from "./PaperMorphButton";
import { getDetailComponent } from "./detail-components/registry";
import { shouldBypassImageOptimization } from "@/lib/utils";
import { productPath, relatedProducts } from "@/lib/site";
import type { DetailBlock, Product } from "./types";

function InlineText({ text }: { text: string }) {
  const parts = text.split(/`([^`]+)`/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <code
            key={i}
            className="rounded-[5px] bg-white/[0.08] px-1.5 py-0.5 text-[0.875em] text-white/90 [font-family:var(--font-mono)]"
          >
            {part}
          </code>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

function BlockView({ block }: { block: DetailBlock }) {
  if (block.type === "paragraph") {
    return (
      <p className="text-white/80 text-[15px] sm:text-base leading-relaxed [font-family:var(--font-body)]">
        <InlineText text={block.text} />
      </p>
    );
  }
  if (block.type === "list") {
    return (
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {block.items.map((item, i) => (
          <li key={i} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-white/80 [font-family:var(--font-body)]">
            <InlineText text={item} />
          </li>
        ))}
      </ul>
    );
  }

  const intrinsic = block.width && block.height ? { w: block.width, h: block.height } : null;
  return (
    <figure className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      {intrinsic ? (
        <NextImage
          src={block.src}
          alt={block.alt ?? block.caption ?? `${block.src} figure`}
          width={intrinsic.w}
          height={intrinsic.h}
          sizes="(min-width: 768px) 720px, 92vw"
          className="block h-auto w-full"
          unoptimized={shouldBypassImageOptimization(block.src)}
        />
      ) : (
        <div className="relative aspect-[16/10] w-full">
          <NextImage
            src={block.src}
            alt={block.alt ?? block.caption ?? "Project figure"}
            fill
            sizes="(min-width: 768px) 720px, 92vw"
            className="object-contain"
            unoptimized={shouldBypassImageOptimization(block.src)}
          />
        </div>
      )}
      {block.caption ? (
        <figcaption className="px-4 py-3 text-xs text-white/55 [font-family:var(--font-body)]">
          <InlineText text={block.caption} />
        </figcaption>
      ) : null}
    </figure>
  );
}

export function ProductArticle({ product }: { product: Product }) {
  const details = product.details;
  const sections = getResearchSections(details, product.description);
  const Custom = getDetailComponent(product.detailComponent);
  const paperLinks = getPaperLinks(product, details);
  const useMorph = hasPaperMorph(product, details);
  const citationPath = getCitationPath(product, details);
  const related = relatedProducts(product);
  const backHref = `/#${product.tag ?? "top"}`;

  return (
    <>
      <Nav />
      <article className="relative mx-auto max-w-3xl px-4 sm:px-6 pt-28 sm:pt-32 pb-16">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/55 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {product.tag?.replace(/-/g, " ") ?? "home"}
        </Link>

        <div className="relative mt-6 aspect-[16/10] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          <NextImage
            src={product.thumbnail}
            alt={`${product.title} cover`}
            fill
            priority
            sizes="(min-width: 768px) 768px, 100vw"
            className={product.tag === "research" || product.tag === "designs" ? "object-contain object-top p-4" : "object-cover"}
            unoptimized={shouldBypassImageOptimization(product.thumbnail)}
          />
        </div>

        <h1 className="mt-8 font-display tracking-[0.03em] uppercase text-white text-4xl sm:text-6xl leading-[0.95]">
          {product.title}
        </h1>
        {product.subtitle ? (
          <p className="mt-3 text-white/75 text-base sm:text-lg leading-snug [font-family:var(--font-body)]">
            {product.subtitle}
          </p>
        ) : null}

        {product.tech && product.tech.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {product.tech.map((t) => (
              <li
                key={t}
                className="rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-white/80 [font-family:var(--font-body)]"
              >
                {t}
              </li>
            ))}
          </ul>
        ) : null}

        {product.meta && Object.keys(product.meta).length > 0 ? (
          <dl className="mt-6 grid grid-cols-2 gap-3">
            {Object.entries(product.meta).map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3">
                <dt className="text-[10px] uppercase tracking-[0.18em] text-white/45 [font-family:var(--font-body)]">{k}</dt>
                <dd className="mt-1 text-white text-sm [font-family:var(--font-body)]">{v}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          {(product.actions ?? []).map((a, i) => {
            if (a.copy && !a.href) return null;
            const isPaper = a.label?.toLowerCase() === "paper";
            if (isPaper && useMorph && paperLinks.doi && paperLinks.pdf) {
              return (
                <PaperMorphButton
                  key={`paper-${i}`}
                  doi={paperLinks.doi}
                  pdf={paperLinks.pdf}
                  label={a.label}
                  icon={a.icon}
                />
              );
            }
            if (!a.href) return null;
            const external = a.href.startsWith("http");
            return (
              <a
                key={`${a.href}-${i}`}
                href={a.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-sm font-display tracking-[0.12em] uppercase text-black"
              >
                <Icon name={a.icon} size={16} />
                {a.label ?? "Open"}
                <ArrowUpRight className="h-4 w-4 opacity-70" />
              </a>
            );
          })}
          {citationPath ? <CiteButton citationPath={citationPath} /> : null}
        </div>

        {details?.body && !sections.length ? (
          <div className="mt-8 space-y-4 text-white/80 [font-family:var(--font-body)]">
            {details.body.split(/\n\s*\n/).map((para, i) => (
              <p key={i}>
                <InlineText text={para} />
              </p>
            ))}
          </div>
        ) : null}

        {sections.map((section) => (
          <section key={section.title} className="mt-10 space-y-4">
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-white/45 [font-family:var(--font-body)]">
              {section.title}
            </h2>
            {section.blocks.map((block, i) => (
              <BlockView key={i} block={block} />
            ))}
          </section>
        ))}

        {product.collaborators && product.collaborators.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-white/45 [font-family:var(--font-body)]">
              Collaborators
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {product.collaborators.map((c) => {
                const href = c.href?.trim() || undefined;
                return (
                  <li key={c.name}>
                    {href ? (
                      <a
                        href={href}
                        target={href.startsWith("http") ? "_blank" : undefined}
                        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="inline-flex rounded-full border border-white/12 px-3 py-1.5 text-sm text-white/85 hover:text-white"
                      >
                        {c.name}
                      </a>
                    ) : (
                      <span className="inline-flex rounded-full border border-white/12 px-3 py-1.5 text-sm text-white/85">
                        {c.name}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {product.institutions && product.institutions.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-white/45 [font-family:var(--font-body)]">
              Institutions
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {product.institutions.map((inst) => {
                const href = inst.href?.trim() || undefined;
                return (
                  <li key={inst.name}>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex rounded-2xl border border-white/12 px-3.5 py-2 text-sm text-white/85 hover:text-white"
                      >
                        {inst.name}
                      </a>
                    ) : (
                      <span className="inline-flex rounded-2xl border border-white/12 px-3.5 py-2 text-sm text-white/85">
                        {inst.name}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {Custom ? (
          <div className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
            <Custom product={product} />
          </div>
        ) : null}

        {related.length > 0 ? (
          <nav aria-label="Related work" className="mt-14 border-t border-white/10 pt-8">
            <h2 className="font-display text-2xl uppercase tracking-[0.08em]">More in this section</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {related.map((item) => {
                const href = productPath(item);
                if (!href) return null;
                return (
                  <li key={item.slug}>
                    <Link
                      href={href}
                      className="block rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-white/25"
                    >
                      <span className="font-display text-lg uppercase tracking-[0.08em] text-white">
                        {item.title}
                      </span>
                      {item.subtitle ? (
                        <span className="mt-1 block text-sm text-white/55 [font-family:var(--font-body)]">
                          {item.subtitle}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}

        <p className="mt-10 text-sm text-white/50 [font-family:var(--font-body)]">
          <Link href="/" className="underline decoration-white/25 hover:text-white">
            Alberto Rota
          </Link>
          {" · "}
          <Link href="/#research" className="underline decoration-white/25 hover:text-white">
            Research
          </Link>
          {" · "}
          <Link href="/#contact" className="underline decoration-white/25 hover:text-white">
            Contact
          </Link>
        </p>
      </article>
    </>
  );
}
