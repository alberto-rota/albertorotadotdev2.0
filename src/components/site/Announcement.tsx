"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Calendar, MapPin } from "lucide-react";
import { Icon } from "./Icon";
import type { Announcement as AnnouncementData } from "./types";

/**
 * Sanitize a tiny HTML subset (<b>, <i>, <u>, <br>, <a href>).
 * Everything else is escaped.
 */
function renderRichText(input: string): React.ReactNode {
  // We do a very small whitelist parse. Anything we don't recognize is rendered as text.
  const tokens: Array<{ type: "text" | "tag"; value: string }> = [];
  const tagRe = /<\/?(b|i|u|br|a)(\s+href=["']([^"']+)["'])?\s*\/?>/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(input))) {
    if (m.index > last) tokens.push({ type: "text", value: input.slice(last, m.index) });
    tokens.push({ type: "tag", value: m[0] });
    last = m.index + m[0].length;
  }
  if (last < input.length) tokens.push({ type: "text", value: input.slice(last) });

  const stack: Array<{ tag: string; href?: string; children: React.ReactNode[] }> = [
    { tag: "root", children: [] },
  ];

  for (const tok of tokens) {
    if (tok.type === "text") {
      stack[stack.length - 1].children.push(tok.value);
      continue;
    }
    const lower = tok.value.toLowerCase();
    if (lower.startsWith("</")) {
      const popped = stack.pop();
      if (!popped || stack.length === 0) continue;
      const parent = stack[stack.length - 1];
      switch (popped.tag) {
        case "b":
          parent.children.push(
            <strong key={parent.children.length} className="text-black">
              {popped.children}
            </strong>
          );
          break;
        case "i":
          parent.children.push(
            <em key={parent.children.length}>{popped.children}</em>
          );
          break;
        case "u":
          parent.children.push(
            <u key={parent.children.length}>{popped.children}</u>
          );
          break;
        case "a":
          parent.children.push(
            <a
              key={parent.children.length}
              href={popped.href}
              target={popped.href?.startsWith("http") ? "_blank" : undefined}
              rel={popped.href?.startsWith("http") ? "noreferrer" : undefined}
              className="text-black underline decoration-black/40 hover:decoration-black"
            >
              {popped.children}
            </a>
          );
          break;
      }
      continue;
    }
    if (lower.startsWith("<br")) {
      stack[stack.length - 1].children.push(
        <br key={stack[stack.length - 1].children.length} />
      );
      continue;
    }
    const tagMatch = /^<([a-z]+)(\s+href=["']([^"']+)["'])?/i.exec(tok.value);
    if (!tagMatch) continue;
    stack.push({ tag: tagMatch[1].toLowerCase(), href: tagMatch[3], children: [] });
  }

  return <>{stack[0].children}</>;
}

export function Announcement({ data }: { data: AnnouncementData | undefined }) {
  if (!data || data.enabled === false) return null;
  if (!data.title && !data.body) return null;

  const actions = data.actions?.filter((a) => a.href) ?? [];

  return (
    <section aria-label="Announcement" className="relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 -mt-4 sm:-mt-2 pb-4 sm:pb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="relative overflow-hidden rounded-3xl border border-black/12 bg-black/[0.04] backdrop-blur"
        >
          {/* Accent glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-px opacity-60"
            style={{
              background:
                "radial-gradient(800px 200px at 0% 0%, rgba(0,0,0,0.08), transparent 60%)",
            }}
          />
          <div className="relative grid gap-5 p-5 sm:p-6 md:grid-cols-[1.6fr_1fr] md:items-center">
            <div>
              {data.label ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-black/20 bg-black/[0.05] px-3 py-1 text-[11px] sm:text-xs uppercase tracking-[0.22em] text-black/80">
                  <span className="relative inline-flex h-2 w-2">
                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-soft-pulse" />
                    <span className="absolute inset-[2px] rounded-full bg-emerald-300" />
                  </span>
                  {data.label}
                </div>
              ) : null}

              {data.title ? (
                <h2 className="mt-3 font-display tracking-[0.03em] uppercase text-3xl sm:text-4xl md:text-5xl leading-[0.95] text-black">
                  {data.title}
                </h2>
              ) : null}

              {data.body ? (
                <p
                  className="mt-3 text-sm sm:text-base text-black/75 leading-relaxed max-w-2xl"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {renderRichText(data.body)}
                </p>
              ) : null}

              {(data.dates || data.location) && (
                <div
                  className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-black/65"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {data.dates ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> {data.dates}
                    </span>
                  ) : null}
                  {data.location ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> {data.location}
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            {actions.length > 0 ? (
              <div className="flex flex-wrap gap-2 md:justify-end">
                {actions.map((a, i) => (
                  <a
                    key={`${a.href}-${i}`}
                    href={a.href}
                    target={a.href?.startsWith("http") ? "_blank" : undefined}
                    rel={a.href?.startsWith("http") ? "noreferrer" : undefined}
                    className={
                      i === 0
                        ? "inline-flex items-center gap-2 rounded-full bg-black text-white px-4 py-2.5 text-sm font-medium uppercase tracking-[0.14em] hover:bg-black/90 transition-colors"
                        : "inline-flex items-center gap-2 rounded-full border border-black/20 px-4 py-2.5 text-sm font-medium uppercase tracking-[0.14em] text-black hover:bg-black/10 transition-colors"
                    }
                  >
                    <Icon name={a.icon} size={16} className="h-4 w-4" />
                    {a.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
