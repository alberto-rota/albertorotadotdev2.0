import { NextResponse } from "next/server";
import productsData from "@/data/products.json";

/* ------------------------------------------------------------------ *
 * Terminal rendering of albertorota.dev — mirrors the browser layout
 * (hero → announcement → sections → contact → footer) using ANSI 24-bit
 * color, box-drawing, gradient rules and OSC 8 hyperlinks. No images,
 * no "designs" section.
 * ------------------------------------------------------------------ */

type Action = { label?: string; href?: string; icon?: string; copy?: string };
type Product = {
  slug?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  link?: string;
  tag?: string;
  accent?: string;
  tech?: string[];
  meta?: Record<string, string>;
  actions?: Action[];
  pinned?: boolean;
  details?: { citation?: string };
};
type SectionCfg = { title?: string; subtitle?: string };
type SiteData = {
  hero?: { tagline?: string };
  contacts?: Array<{ id?: string; label?: string; href?: string; pinned?: boolean }>;
  announcement?: {
    enabled?: boolean;
    accent?: string;
    label?: string;
    title?: string;
    body?: string;
    dates?: string;
    location?: string;
    actions?: Action[];
  };
  announcements?: Array<{
    enabled?: boolean;
    accent?: string;
    label?: string;
    title?: string;
    body?: string;
    dates?: string;
    location?: string;
    actions?: Action[];
  }>;
  sections?: Record<string, SectionCfg>;
  products?: Product[];
};

/* ---------------------------- ANSI core --------------------------- */

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const ITALIC = "\x1b[3m";
const UNDERLINE = "\x1b[4m";

const PALETTE = {
  teal: "#0a9396",
  orange: "#ca6702",
  red: "#9b2226",
  sand: "#e9d8a6",
  white: "#ffffff",
  green: "#34d399",
  amber: "#fbbf24",
  sky: "#7dd3fc",
  grey: "#9a9a9a",
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace(/^#/, "");
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function fg(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `\x1b[38;2;${r};${g};${b}m`;
}

/** Wrap a plain (ANSI-free) string in a foreground color. */
function color(hex: string, s: string): string {
  return fg(hex) + s + RESET;
}

/* ----------------------- display-width helpers -------------------- */

/** True for code points most terminals render two cells wide (CJK, emoji). */
function isWide(cp: number): boolean {
  return (
    (cp >= 0x1100 && cp <= 0x115f) ||
    cp === 0x2329 ||
    cp === 0x232a ||
    (cp >= 0x2600 && cp <= 0x27bf) ||
    (cp >= 0x2b00 && cp <= 0x2bff) ||
    (cp >= 0x2e80 && cp <= 0x303e) ||
    (cp >= 0x3041 && cp <= 0x33ff) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0xa000 && cp <= 0xa4cf) ||
    (cp >= 0xac00 && cp <= 0xd7a3) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xfe30 && cp <= 0xfe4f) ||
    (cp >= 0xff00 && cp <= 0xff60) ||
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x1f000 && cp <= 0x1faff) ||
    (cp >= 0x20000 && cp <= 0x3fffd)
  );
}

/**
 * Displayed column width of a string: skips ANSI SGR (\x1b[ … m) and OSC
 * (\x1b] … ST/BEL) escapes, counts wide code points as 2, ignores the
 * variation selector / ZWJ used to compose emoji.
 */
function displayWidth(s: string): number {
  let w = 0;
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
      const ends = [st === -1 ? Infinity : st + 2, bel === -1 ? Infinity : bel + 1];
      const end = Math.min(...ends);
      if (end !== Infinity) {
        i = end;
        continue;
      }
    }
    const cp = s.codePointAt(i)!;
    const ch = String.fromCodePoint(cp);
    i += ch.length;
    if (cp === 0xfe0f || cp === 0x200d || (cp >= 0x0300 && cp <= 0x036f)) continue;
    w += isWide(cp) ? 2 : 1;
  }
  return w;
}

/* ------------------------- layout primitives ---------------------- */

const DEFAULT_W = 100; // fallback content width when no terminal width is supplied
const MIN_W = 48; // narrowest layout we still render cleanly
const MAX_W = 220; // guard against absurd values
const COL_GAP = 4; // space between product columns
const TWO_COL_MIN = 88; // render products two-up at/above this width
const PAD = "  "; // left margin

/**
 * Content width, in columns. Overridable per request (see GET) since the
 * client's terminal size is only known if it is passed in the query string.
 * Reassigned synchronously at the start of each request; the handler body has
 * no `await`, so concurrent requests cannot interleave and clobber it.
 */
let W = DEFAULT_W;

function padLine(s: string): string {
  return PAD + s;
}

/** Pad a string with trailing spaces to a target display width. */
function padTo(s: string, width: number): string {
  const d = displayWidth(s);
  return d >= width ? s : s + " ".repeat(width - d);
}

/** Truncate plain (ANSI-free) text to a display width, adding an ellipsis. */
function truncatePlain(s: string, maxW: number): string {
  if (displayWidth(s) <= maxW) return s;
  let out = "";
  let w = 0;
  for (const ch of s) {
    const cw = isWide(ch.codePointAt(0)!) ? 2 : 1;
    if (w + cw > maxW - 1) break;
    out += ch;
    w += cw;
  }
  return out + "…";
}

/** Pack pre-rendered chips (may contain ANSI/OSC) into lines no wider than `width`. */
function wrapChips(chips: string[], width: number, sep: string): string[] {
  const sepW = displayWidth(sep);
  const lines: string[] = [];
  let line = "";
  let w = 0;
  for (const c of chips) {
    const cw = displayWidth(c);
    if (w > 0 && w + sepW + cw > width) {
      lines.push(line);
      line = c;
      w = cw;
    } else {
      if (w > 0) {
        line += sep;
        w += sepW;
      }
      line += c;
      w += cw;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Left + right text padded to exactly `width` columns (no left margin). */
function spreadW(left: string, right: string, width: number): string {
  const gap = Math.max(1, width - displayWidth(left) - displayWidth(right));
  return left + " ".repeat(gap) + right;
}

/** Left-pad so the string is visually centered within `width`. */
function center(s: string, width = W): string {
  const left = Math.max(0, Math.floor((width - displayWidth(s)) / 2));
  return PAD + " ".repeat(left) + s;
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

/** Interpolated color at position `t` (0..1) across the given rgb stops. */
function gradientAt(rgb: Array<[number, number, number]>, t: number): string {
  const seg = rgb.length - 1;
  const x = t * seg;
  const idx = Math.min(seg - 1, Math.floor(x));
  const f = x - idx;
  const [r1, g1, b1] = rgb[idx];
  const [r2, g2, b2] = rgb[idx + 1];
  return `\x1b[38;2;${lerp(r1, r2, f)};${lerp(g1, g2, f)};${lerp(b1, b2, f)}m`;
}

/** A run of `char`, `width` cells wide, colored with a smooth gradient. */
function gradientSpan(stops: string[], width: number, char = "─"): string {
  const rgb = stops.map(hexToRgb);
  let out = "";
  for (let i = 0; i < width; i++) out += gradientAt(rgb, width <= 1 ? 0 : i / (width - 1)) + char;
  return out + RESET;
}

/** Full-width horizontal rule (PAD-prefixed). */
function gradientRule(stops: string[], width = W, char = "─"): string {
  return PAD + gradientSpan(stops, width, char);
}

/* ----------------------------- wrapping --------------------------- */

/** Greedy word-wrap of plain (ANSI-free) text. */
function wrapPlain(text: string, width: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    if (!para) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of para.split(/\s+/)) {
      if (!line) line = word;
      else if (displayWidth(line) + 1 + displayWidth(word) <= width)
        line += " " + word;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

/** Update the set of SGR codes currently "open" after scanning a chunk. */
function trackSgr(active: string, chunk: string): string {
  const re = /\x1b\[[0-9;]*m/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(chunk))) {
    if (m[0] === RESET || m[0] === "\x1b[m") active = "";
    else active += m[0];
  }
  return active;
}

/** Word-wrap text that already contains ANSI codes, reopening styles per line. */
function wrapAnsi(text: string, width: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    if (!para) {
      lines.push("");
      continue;
    }
    let line = "";
    let lineW = 0;
    let active = "";
    for (const word of para.split(" ")) {
      const ww = displayWidth(word);
      if (lineW > 0 && lineW + 1 + ww > width) {
        lines.push(line + (active ? RESET : ""));
        line = active;
        lineW = 0;
      }
      if (lineW > 0) {
        line += " ";
        lineW += 1;
      }
      line += word;
      lineW += ww;
      active = trackSgr(active, word);
    }
    lines.push(line + (active ? RESET : ""));
  }
  return lines;
}

/* ------------------------- links & symbols ------------------------ */

const SITE = "https://albertorota.dev";
/** Sections that have their own page (mirrors INDEXABLE_SECTIONS in lib/site). */
const PAGE_SECTIONS = ["research", "terminal-tools", "builds", "designs"];

/** Terminals can only open absolute URLs — resolve site-relative paths. */
function absUrl(url: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return url;
  return SITE + (url.startsWith("/") ? url : "/" + url);
}

/** OSC 8 hyperlink — Ctrl/Cmd-click opens the URL in supporting terminals. */
function hyperlink(url: string, text: string): string {
  return `\x1b]8;;${absUrl(url)}\x1b\\${text}\x1b]8;;\x1b\\`;
}

/** Detail page of a product, as the site's "Details" button / card click. */
function productPath(p: Product): string | null {
  if (!p.slug || !p.tag || !PAGE_SECTIONS.includes(p.tag)) return null;
  return `/${p.tag}/${p.slug}`;
}

/** BibTeX file behind the site's "Cite" button. */
function citationPath(p: Product): string | null {
  const c = p.details?.citation;
  if (!c) return null;
  return c.startsWith("/") ? c : `/bibtex/${c.replace(/\.(txt|bib)$/i, "")}.bib`;
}

/** Pick an emoji for an action by its icon name or label. */
function iconSymbol(icon?: string, label?: string): string {
  const k = (icon ?? "") + " " + (label ?? "");
  const s = k.toLowerCase();
  if (/detail/.test(s)) return "🔎";
  if (/cite|bib/.test(s)) return "📑";
  if (/linkedin/.test(s)) return "💼";
  if (/github/.test(s)) return "🐙";
  if (/file|paper|news|pdf|\bcv\b/.test(s)) return "📄";
  if (/download|pip|install|pypi|market/.test(s)) return "⬇\uFE0F";
  if (/mail|email|touch|contact|✉/.test(s)) return "✉\uFE0F";
  if (/globe|project|external|announce|page|site|web|link/.test(s)) return "🌐";
  return "🔗";
}

/** Render an action as a clickable, colored "symbol label" link. */
function linkChip(a: Action, accent: string): string {
  const label = (a.label ?? "Link").trim() || "Link";
  const sym = iconSymbol(a.icon, a.label);
  const body = `${sym} ${fg(accent)}${UNDERLINE}${label}${RESET}`;
  return a.href ? hyperlink(a.href, body) : body;
}

/* --------------------------- data access -------------------------- */

const SECTION_ORDER = ["research", "terminal-tools", "builds"];
const SECTION_ACCENT: Record<string, string> = {
  research: PALETTE.teal,
  "terminal-tools": PALETTE.orange,
  "builds": PALETTE.sky,
};

function getData(): SiteData {
  return productsData as SiteData;
}

function bySection(products: Product[], tag: string): Product[] {
  return products.filter((p) => p.tag === tag);
}

/* --------------------------- block builders ----------------------- */

function buildHero(data: SiteData): string[] {
  const out: string[] = [];
  out.push("");

  // A prompt instead of a wordmark — same shape as the `$ curl` line below.
  out.push(
    center(`${fg(PALETTE.green)}${BOLD}$${RESET} ${fg(PALETTE.amber)}whoami${RESET}`)
  );
  out.push(center(`${BOLD}${fg(PALETTE.white)}alberto${RESET}`));

  const tagline =
    data.hero?.tagline ??
    "PhD candidate in Bioengineering at Politecnico di Milano.";
  out.push("");
  for (const ln of wrapPlain(tagline, Math.min(64, W - 8)))
    out.push(center(color(PALETTE.grey, ln)));

  // Meta row: location · github · email
  out.push("");
  const g = fg(PALETTE.grey);
  const meta = [
    color(PALETTE.grey, "📍 Milan, Italy"),
    hyperlink("https://github.com/alberto-rota", `${g}🐙 ${UNDERLINE}alberto-rota${RESET}`),
    hyperlink("mailto:alberto_rota@outlook.com", `${g}✉ ${UNDERLINE}alberto_rota@outlook.com${RESET}`),
  ];
  out.push(center(meta.join(color(PALETTE.grey, "    "))));

  // CTA pills — same buttons as the on-site hero, each one a link.
  out.push("");
  const pills = [
    hyperlink("/#research", `${fg(PALETTE.white)}${BOLD}[ ↓ View my work ]${RESET}`),
    hyperlink("/pdfs/CV_Alberto_Rota.pdf", `${fg(PALETTE.grey)}[ ⬇ Download my CV ]${RESET}`),
    hyperlink(SITE, `${fg(PALETTE.grey)}[ 🌐 Open in browser ]${RESET}`),
  ];
  for (const ln of wrapChips(pills, W - 4, "   ")) out.push(center(ln));

  // Pinned contacts / profiles (the round icon buttons on the site).
  const circles = [
    ...(data.contacts ?? [])
      .filter((c) => c.pinned && c.href)
      .map((c) => ({ label: c.label ?? c.id ?? "Link", href: c.href! })),
    ...(data.products ?? [])
      .filter((p) => p.pinned && p.link && p.link !== "#")
      .map((p) => ({ label: (p.title ?? "Link").trim(), href: p.link! })),
  ];
  if (circles.length) {
    const chips = circles.map((c) =>
      hyperlink(c.href, `${fg(PALETTE.sand)}${UNDERLINE}${c.label}${RESET}`)
    );
    for (const ln of wrapChips(chips, W - 4, color(PALETTE.grey, "  ·  ")))
      out.push(center(ln));
  }

  // curl pill (matches the on-site hero / footer)
  out.push("");
  out.push(
    center(
      hyperlink(
        SITE,
        `${fg(PALETTE.green)}${BOLD}${"$"}${RESET} ${fg(PALETTE.amber)}curl${RESET} ${fg(
          PALETTE.sky
        )}-L${RESET} ${fg(PALETTE.white)}albertorota.dev${RESET}`
      )
    )
  );

  out.push("");
  out.push(gradientRule([PALETTE.teal, PALETTE.orange, PALETTE.red]));
  return out;
}

function getAnnouncements(data: SiteData): NonNullable<SiteData["announcement"]>[] {
  if (Array.isArray(data.announcements) && data.announcements.length) {
    return data.announcements;
  }
  return data.announcement ? [data.announcement] : [];
}

/** Strip HTML-ish markup and collapse whitespace. */
function plainText(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Compact digest of all announcements in one box: two lines per item
 * (title + label, then its links) instead of the full on-site cards, which
 * would otherwise take up most of the terminal.
 */
function buildAnnouncements(data: SiteData): string[] {
  const items = getAnnouncements(data).filter(
    (a) => a.enabled !== false && (a.title || a.body)
  );
  if (!items.length) return [];

  const frame = PALETTE.grey;
  const side = fg(frame) + "│" + RESET;
  const inner = W - 4; // "│ " + content + " │"
  const out: string[] = [""];

  const head = `${fg(frame)}┌─ ${fg(PALETTE.white)}${BOLD}● Latest${RESET}${fg(frame)} `;
  out.push(padLine(head + "─".repeat(Math.max(0, W - displayWidth(head) - 1)) + "┐" + RESET));
  const row = (s = "") => out.push(padLine(`${side} ${padTo(s, inner)} ${side}`));

  items.forEach((a) => {
    const accent = a.accent || PALETTE.green;
    const actions = (a.actions ?? []).filter((x) => x.href);

    // Line 1: ● Title (linked to the first action) ……… label
    const label = plainText(a.label ?? "");
    const labelW = label ? Math.min(displayWidth(label), Math.floor(inner * 0.4)) : 0;
    const titleMax = inner - 2 - (labelW ? labelW + 2 : 0);
    const title = truncatePlain(plainText(a.title || a.body || ""), Math.max(8, titleMax));
    let titleStr = `${BOLD}${fg(PALETTE.white)}${title}${RESET}`;
    if (actions[0]?.href) titleStr = hyperlink(actions[0].href, titleStr);
    const left = `${fg(accent)}●${RESET} ${titleStr}`;
    row(label ? spreadW(left, color(PALETTE.grey, truncatePlain(label, labelW)), inner) : left);

    // Line 2: every button as a link
    if (actions.length) {
      const chips = actions.map((x) => linkChip(x, accent));
      for (const ln of wrapChips(chips, inner - 2, "   ")) row("  " + ln);
    }
  });

  out.push(padLine(fg(frame) + "└" + "─".repeat(W - 2) + "┘" + RESET));
  return out;
}

function buildSectionHeader(
  title: string,
  subtitle: string | undefined,
  accent: string,
  href?: string
): string[] {
  const out: string[] = [];
  out.push("");
  let t = `${BOLD}${fg(PALETTE.white)}${title.toUpperCase().split("").join(" ")}${RESET}`;
  if (href) t = hyperlink(href, t) + color(PALETTE.grey, "  ↗");
  out.push(padLine(`${fg(accent)}▍ ${RESET}${t}`));
  if (subtitle)
    for (const ln of wrapPlain(subtitle, W - 2)) out.push(padLine(color(PALETTE.grey, "  " + ln)));
  out.push(gradientRule([accent, PALETTE.sand, accent]));
  return out;
}

/** Render one product as a self-contained "card" (unpadded lines, each ≤ cw wide). */
function buildProductCard(p: Product, accent: string, cw: number): string[] {
  const out: string[] = [];
  const venue = (p.meta?.venue ?? p.meta?.year ?? "").trim();
  const venueW = venue ? displayWidth(venue) : 0;
  const maxTitleW = cw - 3 - (venue ? venueW + 1 : 0); // "▌ " + title (+ space + venue)
  const title = truncatePlain((p.title ?? "Untitled").trim(), Math.max(8, maxTitleW));

  const detail = productPath(p);
  const titleText = `${BOLD}${fg(PALETTE.white)}${title}${RESET}`;
  const titleStr = `${fg(accent)}▌${RESET} ${detail ? hyperlink(detail, titleText) : titleText}`;
  out.push(venue ? spreadW(titleStr, `${fg(accent)}${venue}${RESET}`, cw) : titleStr);

  const desc = (p.subtitle || p.description || "").trim();
  if (desc) for (const ln of wrapPlain(desc, cw - 2)) out.push(color(PALETTE.grey, "  " + ln));

  const tech = (p.tech ?? []).map((t) => t.trim()).filter(Boolean);
  if (tech.length) {
    const chips = tech.map((t) => color(accent, `‹${t}›`));
    for (const ln of wrapChips(chips, cw - 2, " ")) out.push("  " + ln);
  }

  let actions = (p.actions ?? []).filter((a) => a.href && a.href !== "#");
  if (!actions.length && p.link && p.link !== "#")
    actions = [{ label: "Project", href: p.link, icon: "globe" }];
  const cite = citationPath(p);
  if (cite) actions = [...actions, { label: "Cite", href: cite, icon: "cite" }];
  if (detail) actions = [...actions, { label: "Details", href: detail, icon: "details" }];
  if (actions.length) {
    const chips = actions.map((a) => linkChip(a, PALETTE.sky));
    for (const ln of wrapChips(chips, cw - 2, "   ")) out.push("  " + ln);
  }

  // "Copy" buttons can't copy from a terminal — show the command instead.
  for (const a of p.actions ?? []) {
    if (!a.copy || a.href) continue;
    const cmd = truncatePlain(a.copy.trim(), Math.max(8, cw - 4));
    out.push(`  ${fg(PALETTE.green)}${BOLD}$${RESET} ${fg(PALETTE.amber)}${cmd}${RESET}`);
  }
  return out;
}

/** Lay a section's products out in one or two columns depending on width. */
function buildSectionBody(items: Product[], accentDefault: string): string[] {
  const cols = W >= TWO_COL_MIN ? 2 : 1;
  const cw = cols === 2 ? Math.floor((W - COL_GAP) / 2) : W;
  const gapStr = " ".repeat(COL_GAP);
  const out: string[] = [];

  for (let i = 0; i < items.length; i += cols) {
    const group = items.slice(i, i + cols);
    const cards = group.map((p) => buildProductCard(p, p.accent || accentDefault, cw));
    const height = Math.max(...cards.map((c) => c.length));
    for (let r = 0; r < height; r++) {
      const cells = cards.map((c, idx) =>
        idx === cards.length - 1 ? c[r] ?? "" : padTo(c[r] ?? "", cw)
      );
      out.push((PAD + cells.join(gapStr)).replace(/\s+$/, ""));
    }
    out.push("");
  }
  return out;
}

function buildContact(data: SiteData): string[] {
  const products = data.products ?? [];
  const out: string[] = [];
  out.push(
    ...buildSectionHeader(
      "Get in touch",
      "Open to research collaborations, talks and consulting around medical AI, surgical robotics and developer tooling.",
      PALETTE.red,
      "/#contact"
    )
  );

  const rows: Array<[string, string, string, string?]> = [
    ["✉\uFE0F", "Personal email", "alberto_rota@outlook.com", "mailto:alberto_rota@outlook.com"],
    ["✉\uFE0F", "Academic email", "alberto1.rota@polimi.it", "mailto:alberto1.rota@polimi.it"],
    ["🐙", "GitHub", "github.com/alberto-rota", "https://github.com/alberto-rota"],
    ["in", "LinkedIn", "linkedin.com/in/albe-rota", "https://www.linkedin.com/in/albe-rota/"],
    ["📍", "Based in", "Milan, Italy"],
  ];
  const labelW = 16;
  for (const [sym, label, value, href] of rows) {
    const labelCell = label + " ".repeat(Math.max(1, labelW - displayWidth(label)));
    const val = href ? hyperlink(href, `${UNDERLINE}${value}${RESET}`) : value;
    out.push(
      padLine(`  ${padTo(sym, 2)}  ${color(PALETTE.grey, labelCell)}${fg(PALETTE.white)}${val}${RESET}`)
    );
  }

  // "Also on" — resource profiles (excluding GitHub, already shown).
  const profiles = bySection(products, "resources").filter(
    (p) => !(p.link ?? "").toLowerCase().includes("github.com/alberto-rota")
  );
  if (profiles.length) {
    out.push("");
    out.push(padLine(color(PALETTE.grey, "  Also on " + "─".repeat(W - 12))));
    const chips = profiles.map((p) => {
      const t = (p.title ?? "").trim();
      return p.link
        ? hyperlink(p.link, `${fg(PALETTE.sand)}${UNDERLINE}${t}${RESET}`)
        : color(PALETTE.sand, t);
    });
    for (const ln of wrapChips(chips, W - 4, color(PALETTE.grey, "   ·   ")))
      out.push(padLine("  " + ln));
  }

  // The two CTA buttons under the contact card.
  out.push("");
  const ctas = [
    hyperlink("mailto:alberto_rota@outlook.com", `${fg(PALETTE.white)}${BOLD}[ ✉ Send me an email ]${RESET}`),
    hyperlink("/pdfs/CV_Alberto_Rota.pdf", `${fg(PALETTE.grey)}[ ⬇ Download CV ]${RESET}`),
  ];
  for (const ln of wrapChips(ctas, W - 4, "   ")) out.push(padLine("  " + ln));
  return out;
}

function buildFooter(): string[] {
  const out: string[] = [];
  out.push("");
  out.push(gradientRule([PALETTE.red, PALETTE.orange, PALETTE.teal]));
  const year = new Date().getFullYear();
  out.push(
    padLine(
      color(
        PALETTE.grey,
        `© ${year} Alberto Rota · Built with Claude Code because I'm surely not a web dev`
      )
    )
  );
  const nav = [
    ["Research", "/#research"],
    ["Tools", "/#terminal-tools"],
    ["Builds", "/#builds"],
    ["Contact", "/#contact"],
    ["Sitemap", "/sitemap.xml"],
  ].map(([l, h]) => hyperlink(h, `${fg(PALETTE.grey)}${UNDERLINE}${l}${RESET}`));
  out.push(padLine(nav.join(color(PALETTE.grey, "  ·  "))));
  out.push(
    padLine(
      hyperlink(
        SITE,
        `${fg(PALETTE.green)}${BOLD}${"$"}${RESET} ${fg(PALETTE.amber)}curl${RESET} ${fg(
          PALETTE.grey
        )}-L albertorota.dev${RESET}`
      )
    )
  );
  out.push("");
  return out;
}

/* ------------------------------- route ---------------------------- */

export async function GET(request: Request) {
  // Terminal width can only be known if the caller passes it, e.g.
  //   curl -L "albertorota.dev?cols=$(tput cols)"
  const params = new URL(request.url).searchParams;
  const requested = Number.parseInt(params.get("w") ?? params.get("cols") ?? "", 10);
  W = Number.isFinite(requested)
    ? Math.min(MAX_W, Math.max(MIN_W, requested))
    : DEFAULT_W;

  const data = getData();
  const products = data.products ?? [];
  const lines: string[] = [];

  lines.push(...buildHero(data));
  lines.push(...buildAnnouncements(data));

  for (const tag of SECTION_ORDER) {
    const items = bySection(products, tag);
    if (!items.length) continue;
    const cfg = data.sections?.[tag] ?? {};
    const accent = SECTION_ACCENT[tag] ?? PALETTE.white;
    const page = PAGE_SECTIONS.includes(tag) ? `/${tag}` : `/#${tag}`;
    lines.push(...buildSectionHeader(cfg.title ?? tag, cfg.subtitle, accent, page));
    lines.push(...buildSectionBody(items, accent));
  }

  lines.push(...buildContact(data));
  lines.push(...buildFooter());

  const body = lines.join("\n") + "\n";
  return new NextResponse(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
