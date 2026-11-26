import * as React from "react";
import type { DetailBlock } from "./types";

/**
 * The only markup `products.json` text gets: `backtick` spans become inline
 * code and `[label](url)` becomes a link. Shared by the detail panel and the
 * standalone article page so both render content identically.
 */
export function InlineText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const re = /`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      parts.push(
        <code
          key={m.index}
          className="rounded-[5px] bg-white/[0.08] px-1.5 py-0.5 text-[0.875em] text-white/90 [font-family:var(--font-mono)]"
        >
          {m[1]}
        </code>
      );
    } else {
      const href = m[3];
      const external = /^https?:/.test(href);
      parts.push(
        <a
          key={m.index}
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="text-white underline decoration-white/35 underline-offset-2 transition-colors hover:decoration-white"
        >
          {m[2]}
        </a>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

/**
 * A small results table. Numbers are right-aligned in tabular figures so
 * columns line up; the row for the work being presented can be emphasised.
 * Scrolls sideways on narrow screens instead of squeezing the cells.
 */
export function DetailTable({
  block,
  accent,
}: {
  block: Extract<DetailBlock, { type: "table" }>;
  accent?: string;
}) {
  const isNumeric = (v: string) => /^[\s±+\-–−.,%\d()×x]+$/.test(v) && /\d/.test(v);
  // A column is numeric when every body cell in it is.
  const numericCol = block.columns.map(
    (_, c) => block.rows.length > 0 && block.rows.every((r) => !r[c] || isNumeric(r[c]))
  );

  return (
    <figure className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13px] sm:text-sm [font-family:var(--font-body)]">
          <thead>
            <tr className="border-b border-white/10">
              {block.columns.map((col, c) => (
                <th
                  key={c}
                  scope="col"
                  className={`whitespace-nowrap px-3 py-2.5 sm:px-4 text-[10px] font-normal uppercase tracking-[0.16em] text-white/45 ${
                    numericCol[c] ? "text-right" : ""
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, r) => {
              const highlight = r === block.highlightRow;
              return (
                <tr
                  key={r}
                  className="border-b border-white/[0.06] last:border-b-0"
                  style={highlight && accent ? { background: `${accent}14` } : undefined}
                >
                  {block.columns.map((_, c) => (
                    <td
                      key={c}
                      className={`px-3 py-2.5 sm:px-4 ${
                        numericCol[c] ? "whitespace-nowrap text-right tabular-nums" : ""
                      } ${c === 0 ? "whitespace-nowrap" : ""} ${highlight ? "text-white" : "text-white/75"} ${
                        c === 0 && highlight ? "font-medium" : ""
                      }`}
                    >
                      {c === 0 && highlight && accent ? (
                        <span
                          aria-hidden
                          className="mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle"
                          style={{ background: accent }}
                        />
                      ) : null}
                      {row[c] ?? ""}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {block.caption ? (
        <figcaption className="border-t border-white/8 px-4 py-3 text-xs leading-relaxed text-white/55 [font-family:var(--font-body)]">
          <InlineText text={block.caption} />
        </figcaption>
      ) : null}
    </figure>
  );
}
