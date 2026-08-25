"use client";

import * as React from "react";

/**
 * The hero title, spelled out of terminal characters.
 *
 * The field is black. Every cell holds a glyph, but nothing is painted until
 * the pointer moves over it — a torch that wipes characters into view and lets
 * them fade behind it. Cells falling inside the silhouette of the name are
 * painted white, everything else dark grey. Nothing draws the letterforms
 * directly: the name emerges purely from which characters are bright, so you
 * read it out of the noise.
 *
 * Three details do the heavy lifting:
 *
 *   - only pointer *motion* paints. A still mouse adds nothing, and there is no
 *     idle animation revealing the name on the visitor's behalf;
 *   - the name's cells fade far slower than the grey ones, so a sweep leaves the
 *     word standing while its halo of noise drains away;
 *   - grey and white are the same white at different alphas, so the field
 *     collapses onto one colour ramp and a frame costs a handful of `fillStyle`
 *     switches instead of thousands.
 *
 * Glyphs churn slowly wherever they are already lit, and churn hard under a
 * moving pointer, in proportion to how fast it is travelling.
 *
 * The mask is rasterised from the DOM box of the `<h1>` handed in via
 * `targetRef`, so the art tracks the layout at any viewport instead of carrying
 * its own duplicate idea of where the title sits.
 *
 * Touch and reduced-motion have no mouse to move, so rather than an empty black
 * band they get one composed still frame with the name already legible.
 */

/**
 * Deliberately even in weight. Solid fills would out-shout a white full stop
 * and the name would stop reading, so the heaviest blocks are left out and the
 * pool sticks to mid-weight punctuation, box drawing, braille and letterforms.
 */
const GLYPHS = [
  ..."─│┌┐└┘├┤┬┴┼━┃┏┓┗┛╭╮╯╰╱╲╳═║╔╗╚╝╠╣╦╩╬",
  ..."░▒◆◇◈○●◐◑◒◓△▷▽◁▲▶▼◀",
  ..."⠿⡿⣿⣷⣯⣟⢿⡻⠫⠟⠏⠇⣤⣶⣀",
  ..."$>_~/\\|;:!?*+-=<>[]{}()#%&@^",
  ..."0123456789",
  ..."abcdefghijklmnopqrstuvwxyz",
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  ..."←↑→↓↔↕",
];

/**
 * Nerd Font icons, sprinkled in sparsely — the punchline of the typeface.
 * Written as escapes: these live in the Private Use Area, where a literal paste
 * is at the mercy of whatever moves the file around.
 */
const NERD = [
  "\uE0A0", // git branch
  "\uE0B0", // powerline separator
  "\uE0B2", // powerline separator, left
  "\uE702", // git
  "\uE718", // node
  "\uE73C", // python
  "\uE795", // shell
  "\uE7A8", // rust
  "\uE62B", // vs code
  "\uF002", // search
  "\uF005", // star
  "\uF00C", // check
  "\uF00D", // cross
  "\uF013", // cog
  "\uF021", // refresh
  "\uF07B", // folder
  "\uF085", // cogs
  "\uF09B", // github
  "\uF0E7", // bolt
  "\uF120", // terminal
  "\uF121", // code
  "\uF126", // fork
  "\uF15B", // file
  "\uF17C", // linux
  "\uF179", // apple
  "\uF1C0", // database
  "\uF489", // terminal, octicon
];
const NERD_CHANCE = 0.05;

const MONO_FAMILY = '"Cascadia Code NF", "JetBrains Mono", ui-monospace, monospace';
/** The name is cut from the site's display face: uppercase, condensed, solid. */
const NAME_FAMILY = '"Bebas Neue", ui-sans-serif, system-ui, sans-serif';
const NAME_TEXT = "ALBERTO";
/**
 * A letterform needs a certain number of columns before it reads as a letter
 * rather than as texture. Narrow viewports can't give seven of them that, so
 * they get the monogram the nav already uses instead of an illegible smear.
 */
const NAME_SHORT = "AR";
const MIN_COLS_PER_LETTER = 14;
/** A little tracking, matching the display type elsewhere on the site. */
const NAME_TRACKING = 0.04;
/** Bebas Neue's caps sit about this fraction of an em tall. */
const CAP_RATIO = 0.73;

/**
 * Font size in px; the grid is measured from it. It tracks the height of the
 * title band: the name is only as legible as the number of rows its
 * letterforms span, so a shorter band needs proportionally smaller cells.
 */
const CELL_SIZE = 7;
const LINE_RATIO = 1.22; // cell height as a multiple of the font size

const LEVELS = 10; // alpha buckets → one fillStyle switch each
const MIN_ALPHA = 0.03; // below this a cell isn't worth drawing
const GREY = 0.2; // alpha of a fully lit cell outside the name
const WHITE = 1; // …and inside it

/**
 * Coverage below `MASK_LO` counts as background, above `MASK_HI` as name. The
 * band between is the anti-aliased rim of the letterforms; squeezing it keeps
 * edge cells off an ambiguous half-brightness, which is what makes the
 * silhouette mushy at this resolution.
 */
const MASK_LO = 0.22;
const MASK_HI = 0.62;

/**
 * Fade rates, in brightness lost per second, and the whole trick of the piece.
 *
 * Grey dies in a fraction of a second, so it never reads as more than a glow
 * travelling with the pointer. The name holds for seconds, so every pass adds
 * to it and the word accumulates out of the noise instead of being buried by
 * it. Closing this gap is the fastest way to make the name illegible.
 */
const FADE_GREY = 2.2;
const FADE_NAME = 0.06;

const TORCH_RADIUS = 150; // px
/**
 * Fraction of the brush that is soft edge; the rest paints at full strength.
 * A plain radial falloff looks right but only ever lights the cells the brush
 * passes dead-centre over, so the top and bottom of the letterforms come out at
 * a third of the brightness and the name reads as a smudge.
 */
const TORCH_EDGE = 0.4;
/**
 * A gesture counts as continuous while its events keep arriving inside this
 * window. Within one, the brush is dragged along the segment between frames
 * rather than stamped at each position: a quick flick covers several hundred
 * pixels in a frame and would otherwise reveal a dotted line.
 */
const STROKE_GAP = 0.12; // seconds

/** Per-cell chance/frame of a new glyph, at rest and under a moving pointer. */
const CHURN_IDLE = 0.004;
const CHURN_MOVING = 0.32;
/** Pointer speed, px/s, at which the churn runs flat out. */
const CHURN_SPEED_REF = 900;
/** How quickly the remembered speed bleeds away once the pointer stops. */
const SPEED_DECAY = 6;

/**
 * Ambient flicker: single cells that blink in and fade out again, anywhere on
 * the field, with no pointer involved. Rare on purpose — this is a sign of life
 * in the terminal, not a second way of revealing anything.
 *
 * They keep their own clock and always draw grey, so a flicker landing inside
 * the letterforms can't slowly assemble the name on the visitor's behalf.
 */
const SPARK_RATE = 26; // new flickers per second across the whole field
const SPARK_LIFE = 1.7; // seconds from appearing to gone
const SPARK_PEAK = 0.34; // brightest they get

/** Share of background cells shown in the still frame (touch, reduced motion). */
const STILL_SCATTER = 0.14;

function pickGlyph(): string {
  return Math.random() < NERD_CHANCE
    ? NERD[(Math.random() * NERD.length) | 0]
    : GLYPHS[(Math.random() * GLYPHS.length) | 0];
}

/** One white ramp: grey cells land low on it, name cells high. */
const LEVEL_COLORS = Array.from({ length: LEVELS }, (_, i) => {
  const a = ((i + 1) / LEVELS) * 0.98;
  return `rgba(255, 255, 255, ${a.toFixed(3)})`;
});

/** Smoothstep, clamped to 0..1. */
function smooth(t: number): number {
  const u = t < 0 ? 0 : t > 1 ? 1 : t;
  return u * u * (3 - 2 * u);
}

type Box = { x: number; y: number; w: number; h: number };

type Grid = {
  cols: number;
  rows: number;
  cellW: number;
  cellH: number;
  chars: string[];
  /** How lit each cell is, 0..1. */
  lit: Float32Array;
  /** How much of each cell the name covers, 0..1 (anti-aliased). */
  mask: Float32Array;
};

/**
 * Rasterise the name into one alpha value per cell.
 *
 * The offscreen canvas is only `cols × rows`, and the text is drawn through a
 * transform mapping CSS pixels onto cells — so the browser's own rasteriser
 * does the downsampling, and the anti-aliasing it produces along the strokes is
 * exactly the partial coverage we want per cell.
 */
function renderMask(
  cols: number,
  rows: number,
  cellW: number,
  cellH: number,
  box: Box
): Float32Array {
  const out = new Float32Array(cols * rows);
  if (box.w <= 0 || box.h <= 0) return out;
  const off = document.createElement("canvas");
  off.width = cols;
  off.height = rows;
  const octx = off.getContext("2d", { willReadFrequently: true });
  if (!octx) return out;

  octx.setTransform(1 / cellW, 0, 0, 1 / cellH, 0, 0);
  octx.textAlign = "center";
  octx.fillStyle = "#fff";

  const text =
    box.w / cellW / NAME_TEXT.length >= MIN_COLS_PER_LETTER ? NAME_TEXT : NAME_SHORT;

  // Fit to the reserved box on whichever axis binds first.
  let size = box.h / CAP_RATIO;
  const setSize = () => {
    octx.font = `${size}px ${NAME_FAMILY}`;
    if ("letterSpacing" in octx) octx.letterSpacing = `${size * NAME_TRACKING}px`;
  };
  setSize();
  const width = octx.measureText(text).width;
  if (width > box.w) {
    size *= box.w / width;
    setSize();
  }

  // Place the baseline by hand rather than trusting `textBaseline: middle`,
  // which centres the em box: the ascent and descent this string never uses
  // would push the caps up out of the band and under the floating nav.
  octx.textBaseline = "alphabetic";
  const capH = size * CAP_RATIO;
  octx.fillText(text, box.x + box.w / 2, box.y + box.h / 2 + capH / 2);

  const data = octx.getImageData(0, 0, cols, rows).data;
  for (let i = 0; i < out.length; i++) {
    out[i] = smooth((data[i * 4 + 3] / 255 - MASK_LO) / (MASK_HI - MASK_LO));
  }
  return out;
}

export function GlyphField({
  className,
  targetRef,
}: {
  className?: string;
  /** Element whose box the name is fitted to — the hero's `<h1>`. */
  targetRef?: React.RefObject<HTMLElement | null>;
}) {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [fontsReady, setFontsReady] = React.useState(false);

  // Both faces have to be in before anything is measured: the mono sets the
  // grid, the display face cuts the mask.
  React.useEffect(() => {
    let alive = true;
    const done = () => {
      if (alive) setFontsReady(true);
    };
    if (!document.fonts) {
      done();
      return;
    }
    Promise.all([
      document.fonts.load(`${CELL_SIZE}px "Cascadia Code NF"`),
      document.fonts.load('100px "Bebas Neue"'),
    ]).then(done, done);
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const noMouse = !window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    // Nothing here is driven by anything but the mouse, so without one there is
    // nothing to animate: compose a single frame instead.
    const staticOnly = reduced || noMouse;

    let grid: Grid | null = null;
    let width = 0;
    let height = 0;

    /** The name's box in field-local px, taken from the `<h1>` when there is one. */
    const nameBox = (): Box => {
      const el = targetRef?.current;
      if (!el) {
        return { x: width * 0.06, y: height * 0.2, w: width * 0.88, h: height * 0.34 };
      }
      const hostRect = host.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return {
        x: r.left - hostRect.left,
        y: r.top - hostRect.top,
        w: r.width,
        h: r.height,
      };
    };

    const resize = () => {
      const r = host.getBoundingClientRect();
      width = Math.max(1, r.width);
      height = Math.max(1, r.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${CELL_SIZE}px ${MONO_FAMILY}`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";

      const cellW = Math.max(5, ctx.measureText("M").width);
      const cellH = CELL_SIZE * LINE_RATIO;
      const cols = Math.max(1, Math.ceil(width / cellW) + 1);
      const rows = Math.max(1, Math.ceil(height / cellH) + 1);
      const chars = new Array<string>(cols * rows);
      for (let i = 0; i < chars.length; i++) chars[i] = pickGlyph();
      grid = {
        cols,
        rows,
        cellW,
        cellH,
        chars,
        lit: new Float32Array(cols * rows),
        mask: renderMask(cols, rows, cellW, cellH, nameBox()),
      };
    };

    resize();

    /** The next position to paint, handed over by the pointer listener. */
    let queued: { x: number; y: number } | null = null;
    /** Where the current stroke left off, and when. */
    let strokeX = 0;
    let strokeY = 0;
    let strokeAt = -Infinity;
    /** Remembered pointer speed in px/s, driving how hard the glyphs churn. */
    let speed = 0;

    /** Cells currently flickering, and the fractional debt owed to the spawner. */
    const sparks: { i: number; life: number }[] = [];
    let sparkDebt = 0;

    const onPointerMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      // Outside the field, nothing appears at all.
      if (x < 0 || y < 0 || x > r.width || y > r.height) return;
      queued = { x, y };
    };

    if (!staticOnly) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerdown", onPointerMove, { passive: true });
    }

    const buckets: number[][] = Array.from({ length: LEVELS }, () => []);

    /** Wipe a soft circle of light into the grid. */
    const torch = (g: Grid, cx: number, cy: number, radius: number) => {
      const c0 = Math.max(0, Math.floor((cx - radius) / g.cellW));
      const c1 = Math.min(g.cols - 1, Math.ceil((cx + radius) / g.cellW));
      const r0 = Math.max(0, Math.floor((cy - radius) / g.cellH));
      const r1 = Math.min(g.rows - 1, Math.ceil((cy + radius) / g.cellH));
      for (let r = r0; r <= r1; r++) {
        const dy = (r + 0.5) * g.cellH - cy;
        for (let c = c0; c <= c1; c++) {
          const dx = (c + 0.5) * g.cellW - cx;
          const d = Math.hypot(dx, dy) / radius;
          if (d >= 1) continue;
          const v = smooth((1 - d) / TORCH_EDGE);
          const i = r * g.cols + c;
          if (v > g.lit[i]) g.lit[i] = v;
        }
      }
    };

    /** Re-roll glyphs around the pointer, hardest at its centre. */
    const churn = (g: Grid, cx: number, cy: number, radius: number, rate: number) => {
      const c0 = Math.max(0, Math.floor((cx - radius) / g.cellW));
      const c1 = Math.min(g.cols - 1, Math.ceil((cx + radius) / g.cellW));
      const r0 = Math.max(0, Math.floor((cy - radius) / g.cellH));
      const r1 = Math.min(g.rows - 1, Math.ceil((cy + radius) / g.cellH));
      for (let r = r0; r <= r1; r++) {
        const dy = (r + 0.5) * g.cellH - cy;
        for (let c = c0; c <= c1; c++) {
          const dx = (c + 0.5) * g.cellW - cx;
          const d = Math.hypot(dx, dy) / radius;
          if (d >= 1) continue;
          if (Math.random() < rate * (1 - d)) g.chars[r * g.cols + c] = pickGlyph();
        }
      }
    };

    const render = (dt: number, t: number) => {
      const g = grid;
      if (!g) return;
      const { cols, cellW, cellH, lit, mask, chars } = g;

      // Fade, and the slow background churn. The two fade rates are blended per
      // cell by mask coverage, so the name drains slowly while everything around
      // it goes quickly.
      const keepGrey = Math.exp(-FADE_GREY * dt);
      const keepName = Math.exp(-FADE_NAME * dt);
      for (let i = 0; i < lit.length; i++) {
        const v = lit[i];
        if (v === 0) continue;
        const next = v * (keepGrey + (keepName - keepGrey) * mask[i]);
        lit[i] = next < 0.002 ? 0 : next;
        if (next > 0.05 && Math.random() < CHURN_IDLE) chars[i] = pickGlyph();
      }

      if (queued) {
        const { x, y } = queued;
        queued = null;
        const continuing = t - strokeAt < STROKE_GAP;
        const dist = continuing ? Math.hypot(x - strokeX, y - strokeY) : 0;
        speed = continuing ? dist / Math.max(1e-3, t - strokeAt) : 0;
        if (dist > cellW) {
          // Drag the brush along the segment so a fast flick paints a stroke
          // rather than a dotted line. The step follows the brush radius, not
          // the cell size — the brush is soft and far wider than a cell, so
          // stepping per cell would just re-walk the same cells many times.
          const steps = Math.min(24, Math.ceil(dist / (TORCH_RADIUS * 0.35)));
          for (let k = 1; k <= steps; k++) {
            const f = k / steps;
            torch(g, strokeX + (x - strokeX) * f, strokeY + (y - strokeY) * f, TORCH_RADIUS);
          }
        } else {
          torch(g, x, y, TORCH_RADIUS);
        }
        strokeX = x;
        strokeY = y;
        strokeAt = t;
        churn(g, x, y, TORCH_RADIUS, CHURN_MOVING * Math.min(1, speed / CHURN_SPEED_REF));
      } else {
        speed *= Math.exp(-SPEED_DECAY * dt);
      }

      sparkDebt += SPARK_RATE * dt;
      while (sparkDebt >= 1) {
        sparkDebt -= 1;
        const i = (Math.random() * chars.length) | 0;
        chars[i] = pickGlyph();
        sparks.push({ i, life: 1 });
      }
      for (let k = sparks.length - 1; k >= 0; k--) {
        sparks[k].life -= dt / SPARK_LIFE;
        if (sparks[k].life <= 0) sparks.splice(k, 1);
      }

      ctx.clearRect(0, 0, width, height);
      for (const b of buckets) b.length = 0;
      for (let i = 0; i < lit.length; i++) {
        const v = lit[i] * (GREY + (WHITE - GREY) * mask[i]);
        if (v < MIN_ALPHA) continue;
        buckets[Math.min(LEVELS - 1, (v * LEVELS) | 0)].push(i);
      }
      const half = cellH / 2;
      for (let lv = 0; lv < LEVELS; lv++) {
        const bucket = buckets[lv];
        if (!bucket.length) continue;
        ctx.fillStyle = LEVEL_COLORS[lv];
        for (const i of bucket) {
          const c = i % cols;
          const r = (i - c) / cols;
          ctx.fillText(chars[i], c * cellW, r * cellH + half);
        }
      }

      // Flickers draw last, in their own pass, rising and falling over their
      // life. One landing on an already-drawn cell just composites a shade
      // brighter, which at a handful of cells out of tens of thousands is not
      // worth a lookup to avoid.
      for (const spark of sparks) {
        const v = SPARK_PEAK * Math.sin((1 - spark.life) * Math.PI);
        if (v < MIN_ALPHA) continue;
        ctx.fillStyle = LEVEL_COLORS[Math.min(LEVELS - 1, (v * LEVELS) | 0)];
        const c = spark.i % cols;
        const r = (spark.i - c) / cols;
        ctx.fillText(chars[spark.i], c * cellW, r * cellH + half);
      }
    };

    /**
     * One frame, name already up, for the cases with no mouse to move. The
     * background is a scatter rather than an even wash: a solid field of
     * characters reads as a wall and swallows the name when nothing moves.
     */
    const still = () => {
      const g = grid;
      if (!g) return;
      // Keep the scatter around the title. Spread over the whole field it ends
      // up sitting behind the tagline and buttons, which on a narrow viewport
      // are only a few rows down.
      const box = nameBox();
      // Room above the band, none below it: the tagline sits only a few pixels
      // under the title, with nothing to spare on a narrow viewport.
      const rTop = Math.floor((box.y - box.h * 0.15) / g.cellH);
      const rBot = Math.ceil((box.y + box.h) / g.cellH);
      for (let r = 0; r < g.rows; r++) {
        const near = r >= rTop && r <= rBot;
        for (let c = 0; c < g.cols; c++) {
          const i = r * g.cols + c;
          const m = g.mask[i];
          if (m > 0.02) g.lit[i] = m;
          else g.lit[i] = near && Math.random() < STILL_SCATTER ? 0.55 : 0;
        }
      }
      render(0, 0);
    };

    let raf = 0;
    let last = performance.now();
    const start = last;
    let onScreen = true;

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      render(dt, (now - start) / 1000);
      if (onScreen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const play = () => {
      if (raf || staticOnly || !onScreen || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const pause = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) play();
        else pause();
      },
      { rootMargin: "120px" }
    );
    io.observe(host);

    const onVisibility = () => (document.hidden ? pause() : play());
    document.addEventListener("visibilitychange", onVisibility);

    // Watch the title box too: the mask is fitted to it, so a reflow that moves
    // it has to re-cut the mask even when the field itself hasn't changed size.
    const ro = new ResizeObserver(() => {
      resize();
      if (staticOnly) still();
    });
    ro.observe(host);
    if (targetRef?.current) ro.observe(targetRef.current);

    if (staticOnly) still();
    else play();

    return () => {
      pause();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerMove);
    };
  }, [fontsReady, targetRef]);

  return (
    <div ref={hostRef} className={className} aria-hidden>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
