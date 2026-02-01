import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";
import productsData from "@/data/products.json";

type Product = {
  title?: string;
  description?: string;
  link?: string;
  tag?: string;
  actions?: Array<{ label?: string; href: string; icon?: string }>;
};

/** Unicode symbol for each action type (CLI / terminal). */
function actionSymbol(icon?: string, label?: string): string {
  const key = (icon ?? label ?? "").toLowerCase();
  if (/newspaper|paper/.test(key)) return "📄";
  if (/github|githublogo/.test(key)) return "⌘";
  if (/download|pip|install|pypi|marketplace/.test(key)) return "⬇";
  if (/target|external|project\s*page|link/.test(key)) return "🔗";
  return "↗";
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace(/^#/, "");
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return [r, g, b];
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function ansi24Bit(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `\x1b[38;2;${r};${g};${b}m`;
}

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const ITALIC = "\x1b[3m";
const UNDERLINE = "\x1b[4m";

/**
 * Visible length: only characters that are actually displayed.
 * Skips ANSI SGR (\x1b[ ... m) and OSC (\x1b] ... \x1b\\) so codes are not counted.
 */
function visibleLength(s: string): number {
  let len = 0;
  let i = 0;
  while (i < s.length) {
    if (s[i] === "\x1b" && s[i + 1] === "[") {
      const end = s.indexOf("m", i);
      if (end !== -1) {
        i = end + 1;
        continue;
      }
    }
    if (s[i] === "\x1b" && s[i + 1] === "]") {
      const st = s.indexOf("\x1b\\", i);
      const bel = s.indexOf("\x07", i);
      const endAfterSt = st !== -1 ? st + 2 : -1;
      const endAfterBel = bel !== -1 ? bel + 1 : -1;
      const end =
        endAfterSt !== -1 && endAfterBel !== -1
          ? Math.min(endAfterSt, endAfterBel)
          : endAfterSt !== -1
            ? endAfterSt
            : endAfterBel;
      if (end !== -1) {
        i = end;
        continue;
      }
    }
    len++;
    i++;
  }
  return len;
}

/** Pad so the displayed width of the left cell equals `width` (ANSI not counted). */
function padToVisibleWidth(s: string, width: number): string {
  return s + " ".repeat(Math.max(0, width - visibleLength(s)));
}

/** Truncate to maxVisible visible chars, append "..." if truncated; preserves ANSI. */
function truncateWithEllipsis(s: string, maxVisible: number): string {
  if (visibleLength(s) <= maxVisible) return s;
  let out = "";
  let visible = 0;
  let i = 0;
  while (i < s.length) {
    if (s[i] === "\x1b" && s[i + 1] === "[") {
      const end = s.indexOf("m", i);
      if (end !== -1) {
        out += s.slice(i, end + 1);
        i = end + 1;
        continue;
      }
    }
    if (visible >= maxVisible - 3) {
      out += RESET + "...";
      break;
    }
    out += s[i];
    visible++;
    i++;
  }
  return out;
}

/** OSC 8 hyperlink: Ctrl+click / Cmd+click opens URL in supported terminals. */
function hyperlink(url: string, text: string): string {
  const OSC = "\x1b]";
  const ST = "\x1b\\";
  return `${OSC}8;;${url}${ST}${text}${OSC}8;;${ST}`;
}

/** Replace <a href="URL">text</a> with OSC 8 hyperlink (clickable in terminal). */
function parseLinkTags(text: string): string {
  return text.replace(
    /<a\s+href=["']([^"']+)["']\s*>([\s\S]*?)<\/a>/gi,
    (_, url, content) => hyperlink(url.trim(), content)
  );
}

/** Replace <b>text</b>, <i>text</i>, <u>text</u> with ANSI (run before parseColorTags). */
function parseStyleTags(text: string): string {
  return text
    .replace(/<b>([\s\S]*?)<\/b>/gi, `${BOLD}$1${RESET}`)
    .replace(/<i>([\s\S]*?)<\/i>/gi, `${ITALIC}$1${RESET}`)
    .replace(/<u>([\s\S]*?)<\/u>/gi, `${UNDERLINE}$1${RESET}`);
}

/** Replace <#RRGGBB>text</> and <#RGB>text</> with ANSI 24-bit color. */
function parseColorTags(text: string): string {
  return text.replace(
    /<#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})>([\s\S]*?)<\/>/g,
    (_, hex, content) => `${ansi24Bit(hex)}${content}${RESET}`
  );
}

const LEFT_COLUMN_WIDTH = 52;
const RIGHT_COLUMN_MAX_WIDTH = 100;

const ALL_SECTION_ORDER = ["research", "open-source", "resources", "designs"];

/** Parse {{SECTIONS=a,b,c}} from template; returns null if absent (use all sections). */
function parseSectionsDirective(template: string): string[] | null {
  const m = template.match(/\{\{SECTIONS\s*=\s*([^}]+)\}\}/);
  if (!m) return null;
  return m[1]
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => ALL_SECTION_ORDER.includes(t));
}

/** Format products as lines with ANSI: bold titles, dim descriptions, labeled hyperlinks with symbols. */
function formatProductsLines(
  products: Product[],
  sectionOrder: string[] = ALL_SECTION_ORDER
): string[] {
  const byTag = new Map<string, Product[]>();
  for (const p of products) {
    const tag = p.tag ?? "other";
    if (!byTag.has(tag)) byTag.set(tag, []);
    byTag.get(tag)!.push(p);
  }

  const lines: string[] = [];
  const sectionTitles: Record<string, string> = {
    research: "Research",
    "open-source": "Open source",
    resources: "Links",
    designs: "Designs",
  };

  for (const tag of sectionOrder) {
    const list = byTag.get(tag);
    if (!list?.length) continue;

    if (lines.length > 0) lines.push("");
    lines.push(`  ${BOLD}${sectionTitles[tag] ?? tag}${RESET}`);
    lines.push("  " + "─".repeat(36));

    for (const p of list) {
      const title = (p.title || p.description || "Link").trim();
      if (!title) continue;
      const hasTitle = Boolean((p.title ?? "").trim());
      const desc = hasTitle && p.description ? p.description : null;
      const actions = Array.isArray(p.actions)
        ? p.actions.filter((a) => a?.href && a.href !== "#")
        : [];
      const mainLink =
        p.link && p.link !== "#" && p.link !== ""
          ? p.link
          : actions[0]?.href;

      lines.push(`  • ${BOLD}${UNDERLINE}${title}${RESET}`);
      if (desc && desc !== title) lines.push(`    ${desc}`);

      if (actions.length > 0) {
        const linkParts = actions.map((a) => {
          const displayLabel = (a.label ?? "Link").trim() || "Link";
          const sym = actionSymbol(a.icon, a.label);
          return hyperlink(a.href, `${sym} ${displayLabel}`);
        });
        lines.push("    " + linkParts.join("   "));
      } else if (mainLink) {
        lines.push(`    ${hyperlink(mainLink, "🔗 Project")}`);
      }
      lines.push("  " + "─".repeat(36));
    }
  }

  return lines;
}

function getProducts(): Product[] {
  const raw = productsData as { products?: Product[] };
  return Array.isArray(raw?.products) ? raw.products : [];
}

export async function GET() {
  const cwd = process.cwd();
  const templatePath = join(cwd, "public", "curl.txt");
  let template: string;
  try {
    template = readFileSync(templatePath, "utf-8");
  } catch {
    return NextResponse.json(
      { error: "Template not found" },
      { status: 500 }
    );
  }

  const sectionOrder =
    parseSectionsDirective(template) ?? ALL_SECTION_ORDER;
  const templateWithoutSections = template.replace(
    /\{\{SECTIONS\s*=\s*[^}]+\}\}\s*/g,
    ""
  );
  const [before, after = ""] = templateWithoutSections.split("{{PRODUCTS}}");
  const leftBlock = (before + after).replace(/\s+$/, "");
  const leftLines = parseColorTags(
    parseStyleTags(parseLinkTags(leftBlock))
  ).split("\n");
  const rightLines = formatProductsLines(getProducts(), sectionOrder).map(
    (line) => truncateWithEllipsis(line, RIGHT_COLUMN_MAX_WIDTH)
  );

  const rowCount = Math.max(leftLines.length, rightLines.length);
  const rows: string[] = [];
  for (let i = 0; i < rowCount; i++) {
    const leftRaw = leftLines[i] ?? "";
    const left = leftRaw.replace(/\s+$/, "");
    const right = rightLines[i] ?? "";
    rows.push(
      padToVisibleWidth(left, LEFT_COLUMN_WIDTH) + "  " + right
    );
  }

  const maxWidth = Math.max(
    ...rows.map((r) => visibleLength(r)),
    2
  );
  const topBorder = "┌" + "─".repeat(maxWidth) + "┐";
  const bottomBorder = "└" + "─".repeat(maxWidth) + "┘";
  const boxedRows = rows.map(
    (row) => "│" + padToVisibleWidth(row, maxWidth) + "│"
  );
  const body = [topBorder, ...boxedRows, bottomBorder].join("\n");

  return new NextResponse(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
