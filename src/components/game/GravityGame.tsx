"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, RotateCcw, Trophy } from "lucide-react";
import {
  BALL_RADIUS,
  GOAL_RADIUS,
  HALF,
  LEVELS,
  WELL_SIGMA,
  baseHeight,
  makeView,
  project,
  resetBall,
  screenToGround,
  stepBall,
  totalHeight,
  wellHeight,
  type Ball,
  type Level,
  type View,
  type Well,
} from "./engine";

type Status = "playing" | "won" | "complete";

type Grid = {
  n: number;
  cols: number;
  rows: number;
  wx: Float32Array; // node world x
  wy: Float32Array; // node world y
  baseZ: Float32Array; // cached base height per node (no cursor well)
  // Per-frame scratch buffers (filled in draw()).
  sx: Float32Array;
  sy: Float32Array;
  pp: Float32Array; // perspective factor
  zz: Float32Array; // node total height
};

const GRID_FINE = 48;
const GRID_COARSE = 34;
const WIN_SPEED = 1.8; // must be slow-ish to "land" in the goal

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function GravityGame() {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const timerRef = React.useRef<HTMLSpanElement | null>(null);

  const [status, setStatus] = React.useState<Status>("playing");
  const [levelIndex, setLevelIndex] = React.useState(0);
  const [resets, setResets] = React.useState(0);
  const [hasInteracted, setHasInteracted] = React.useState(false);
  const [levelMs, setLevelMs] = React.useState(0);
  const [totalMs, setTotalMs] = React.useState(0);

  // --- Mutable game state (refs; never trigger re-render) ---
  const viewRef = React.useRef<View>(makeView(1, 1));
  const gridRef = React.useRef<Grid | null>(null);
  const ballRef = React.useRef<Ball>({ x: 0, y: 0, vx: 0, vy: 0, z: 0 });
  const wellRef = React.useRef<Well>({ x: 0, y: 0, strength: 0 });
  const pointerRef = React.useRef({ sx: 0, sy: 0, active: false });
  const levelRef = React.useRef<Level>(LEVELS[0]);
  const statusRef = React.useRef<Status>("playing");
  const levelIndexRef = React.useRef(0);
  const startTimeRef = React.useRef(0);
  const totalBeforeRef = React.useRef(0); // accumulated time of completed levels

  // Keep refs in sync with state used by the loop.
  statusRef.current = status;

  const buildBaseZ = React.useCallback((grid: Grid, level: Level) => {
    for (let i = 0; i < grid.n; i++) {
      grid.baseZ[i] = baseHeight(grid.wx[i], grid.wy[i], level);
    }
  }, []);

  const buildGrid = React.useCallback(
    (level: Level): Grid => {
      const coarse =
        typeof window !== "undefined" &&
        window.matchMedia("(hover: none), (pointer: coarse)").matches;
      const cols = coarse ? GRID_COARSE : GRID_FINE;
      const rows = cols;
      const n = cols * rows;
      const wx = new Float32Array(n);
      const wy = new Float32Array(n);
      const step = (2 * HALF) / (cols - 1);
      let k = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          wx[k] = -HALF + c * step;
          wy[k] = -HALF + r * step;
          k++;
        }
      }
      const grid: Grid = {
        n,
        cols,
        rows,
        wx,
        wy,
        baseZ: new Float32Array(n),
        sx: new Float32Array(n),
        sy: new Float32Array(n),
        pp: new Float32Array(n),
        zz: new Float32Array(n),
      };
      buildBaseZ(grid, level);
      return grid;
    },
    [buildBaseZ],
  );

  const startLevel = React.useCallback(
    (index: number) => {
      const level = LEVELS[index];
      levelRef.current = level;
      levelIndexRef.current = index;
      const grid = gridRef.current;
      if (grid) buildBaseZ(grid, level);
      resetBall(ballRef.current, level);
      wellRef.current.x = level.start.x;
      wellRef.current.y = level.start.y;
      wellRef.current.strength = 0;
      startTimeRef.current = performance.now();
      statusRef.current = "playing";
      setLevelIndex(index);
      setStatus("playing");
      setLevelMs(0);
    },
    [buildBaseZ],
  );

  const handleNext = React.useCallback(() => {
    const next = levelIndexRef.current + 1;
    if (next >= LEVELS.length) {
      // restart the whole run
      totalBeforeRef.current = 0;
      setTotalMs(0);
      startLevel(0);
    } else {
      startLevel(next);
    }
  }, [startLevel]);

  const handleReplayLevel = React.useCallback(() => {
    startLevel(levelIndexRef.current);
  }, [startLevel]);

  // --- Setup: canvas, sizing, pointer, RAF loop ---
  React.useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const r = container.getBoundingClientRect();
      const w = Math.max(1, r.width);
      const h = Math.max(1, r.height);
      viewRef.current = makeView(w, h);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!gridRef.current) {
        gridRef.current = buildGrid(levelRef.current);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // Initialize ball + well at the start of level 0.
    resetBall(ballRef.current, levelRef.current);
    wellRef.current.x = levelRef.current.start.x;
    wellRef.current.y = levelRef.current.start.y;
    startTimeRef.current = performance.now();

    const onPointerMove = (e: PointerEvent) => {
      const r = container.getBoundingClientRect();
      pointerRef.current.sx = e.clientX - r.left;
      pointerRef.current.sy = e.clientY - r.top;
      pointerRef.current.active = true;
      if (!hasInteracted) setHasInteracted(true);
    };
    const onPointerDown = (e: PointerEvent) => onPointerMove(e);
    const onPointerLeave = () => {
      pointerRef.current.active = false;
    };
    container.addEventListener("pointermove", onPointerMove, { passive: true });
    container.addEventListener("pointerdown", onPointerDown, { passive: true });
    container.addEventListener("pointerleave", onPointerLeave, {
      passive: true,
    });

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.045, (now - last) / 1000);
      last = now;
      const t = now / 1000;

      const view = viewRef.current;
      const grid = gridRef.current;
      const ball = ballRef.current;
      const well = wellRef.current;
      const level = levelRef.current;
      const ptr = pointerRef.current;

      // Ease the cursor well toward the pointer's ground position.
      const wantActive = ptr.active;
      if (wantActive) {
        const g = screenToGround(ptr.sx, ptr.sy, view);
        const tx = clamp(g.x, -HALF - 0.4, HALF + 0.4);
        const ty = clamp(g.y, -HALF - 0.4, HALF + 0.4);
        const kPos = 1 - Math.pow(0.0009, dt);
        well.x += (tx - well.x) * kPos;
        well.y += (ty - well.y) * kPos;
      }
      const kStr = 1 - Math.pow(0.0008, dt);
      well.strength += ((wantActive ? 1 : 0) - well.strength) * kStr;

      // Physics (sub-stepped for stability) while playing.
      if (statusRef.current === "playing" && grid) {
        const SUB = 3;
        const sdt = dt / SUB;
        for (let s = 0; s < SUB; s++) {
          const res = stepBall(ball, level, well, sdt);
          if (res === "fell") {
            resetBall(ball, level);
            setResets((n) => n + 1);
            break;
          }
          if (res === "goal") {
            const speed = Math.hypot(ball.vx, ball.vy);
            if (speed < WIN_SPEED) {
              const elapsed = performance.now() - startTimeRef.current;
              totalBeforeRef.current += elapsed;
              statusRef.current =
                levelIndexRef.current + 1 >= LEVELS.length
                  ? "complete"
                  : "won";
              setLevelMs(elapsed);
              setTotalMs(totalBeforeRef.current);
              setStatus(statusRef.current);
            }
            break;
          }
        }

        // Live timer (write directly to DOM to avoid per-frame re-renders).
        if (timerRef.current) {
          const el = (performance.now() - startTimeRef.current) / 1000;
          timerRef.current.textContent = `${el.toFixed(1)}s`;
        }
      }

      if (grid) draw(ctx, view, grid, ball, well, level, t);

      if (!document.hidden) raf = requestAnimationFrame(frame);
    };

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (raf === 0) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointerleave", onPointerLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildGrid]);

  const levelMsLabel = (levelMs / 1000).toFixed(1);
  const totalMsLabel = (totalMs / 1000).toFixed(1);

  return (
    <div
      ref={containerRef}
      className="relative h-dvh w-full overflow-hidden bg-black touch-none select-none"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full block" />

      {/* ---- HUD ---- */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {/* Top bar */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/60 backdrop-blur-xl px-3.5 py-2 text-xs uppercase tracking-[0.14em] text-white/85 hover:text-white hover:border-white/35 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="font-display tracking-[0.18em] text-lg text-white">
                GRAVITY WELL
              </span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                {levelRef.current.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Stat label="Level">
              {levelIndex + 1}
              <span className="text-white/40">/{LEVELS.length}</span>
            </Stat>
            <Stat label="Time">
              <span ref={timerRef}>0.0s</span>
            </Stat>
            <Stat label="Resets">{resets}</Stat>
          </div>
        </div>

        {/* First-time hint */}
        <div
          className={[
            "absolute inset-x-0 bottom-0 flex justify-center px-4 pb-7 sm:pb-10 transition-opacity duration-700",
            hasInteracted ? "opacity-0" : "opacity-100",
          ].join(" ")}
        >
          <p className="max-w-md text-center text-sm sm:text-base text-white/65 leading-relaxed rounded-2xl border border-white/10 bg-black/55 backdrop-blur-xl px-5 py-3">
            {levelRef.current.hint}
          </p>
        </div>
      </div>

      {/* ---- Win / Complete overlay ---- */}
      {(status === "won" || status === "complete") && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/12 bg-black/70 backdrop-blur-2xl p-7 text-center shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/5">
              <Trophy className="h-5 w-5 text-white" />
            </div>

            {status === "won" ? (
              <>
                <h2 className="font-display tracking-[0.12em] text-3xl text-white">
                  LEVEL CLEAR
                </h2>
                <p className="mt-1 text-sm text-white/55">
                  {levelRef.current.name} — {levelMsLabel}s
                </p>
              </>
            ) : (
              <>
                <h2 className="font-display tracking-[0.12em] text-3xl text-white">
                  RUN COMPLETE
                </h2>
                <p className="mt-1 text-sm text-white/55">
                  All {LEVELS.length} levels — total {totalMsLabel}s
                </p>
              </>
            )}

            <div className="mt-6 flex items-center justify-center gap-2.5">
              <button
                onClick={handleReplayLevel}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-white/85 hover:text-white hover:border-white/35 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Replay
              </button>
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/90 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-black hover:bg-white transition-colors"
              >
                {status === "complete" ? "Play again" : "Next level"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-full border border-white/12 bg-black/60 backdrop-blur-xl px-3.5 py-1.5 text-center">
      <div className="text-[9px] uppercase tracking-[0.22em] text-white/40">
        {label}
      </div>
      <div className="font-mono text-sm text-white tabular-nums">{children}</div>
    </div>
  );
}

// ---- Rendering -----------------------------------------------------------

function draw(
  ctx: CanvasRenderingContext2D,
  view: View,
  grid: Grid,
  ball: Ball,
  well: Well,
  level: Level,
  t: number,
) {
  const { w, h } = view;
  const sp = Math.sin(view.pitch); // vertical foreshortening for ground circles
  ctx.clearRect(0, 0, w, h);

  // Project every node for this frame (height = cached base + live well).
  const { n, cols, rows, wx, wy, baseZ, sx, sy, pp, zz } = grid;
  const twoSig2 = 2 * WELL_SIGMA * WELL_SIGMA;
  for (let i = 0; i < n; i++) {
    const z = baseZ[i] + wellHeight(wx[i], wy[i], well);
    zz[i] = z;
    const p = project(wx[i], wy[i], z, view);
    sx[i] = p.sx;
    sy[i] = p.sy;
    pp[i] = p.persp;
  }

  // --- Mesh lines (subtle, drawn first) ---
  ctx.lineCap = "round";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const persp = pp[i];
      const hn = clamp(0.5 + zz[i] * 0.95, 0, 1); // height -> brightness
      // proximity to the cursor well (activity glow)
      const dxw = wx[i] - well.x;
      const dyw = wy[i] - well.y;
      const act =
        well.strength * Math.exp(-(dxw * dxw + dyw * dyw) / twoSig2);
      const lineAlpha = clamp(
        (0.05 + 0.2 * persp) * (0.4 + 0.85 * hn) + act * 0.35,
        0,
        0.85,
      );
      ctx.strokeStyle = `rgba(255,255,255,${lineAlpha.toFixed(3)})`;
      ctx.lineWidth = 0.6 + persp * 0.7;
      if (c < cols - 1) {
        const j = i + 1;
        ctx.beginPath();
        ctx.moveTo(sx[i], sy[i]);
        ctx.lineTo(sx[j], sy[j]);
        ctx.stroke();
      }
      if (r < rows - 1) {
        const j = i + cols;
        ctx.beginPath();
        ctx.moveTo(sx[i], sy[i]);
        ctx.lineTo(sx[j], sy[j]);
        ctx.stroke();
      }
    }
  }

  // --- Nodes as glowing dots (far -> near, additive) ---
  ctx.globalCompositeOperation = "lighter";
  for (let r = rows - 1; r >= 0; r--) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const persp = pp[i];
      const hn = clamp(0.5 + zz[i] * 0.95, 0, 1);
      const dxw = wx[i] - well.x;
      const dyw = wy[i] - well.y;
      const act =
        well.strength * Math.exp(-(dxw * dxw + dyw * dyw) / twoSig2);
      const alpha = clamp(
        (0.08 + 0.45 * persp) * (0.45 + 0.85 * hn) + act * 0.55,
        0,
        1,
      );
      if (alpha < 0.02) continue;
      const rad = (0.5 + 1.6 * persp) * (0.85 + 0.5 * hn) + act * 1.6;
      ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(sx[i], sy[i], rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalCompositeOperation = "source-over";

  // --- Cursor influence ring (where the world is being molded) ---
  if (well.strength > 0.04) {
    const gp = project(well.x, well.y, totalHeight(well.x, well.y, level, well), view);
    const rx = WELL_SIGMA * view.scale * gp.persp;
    ctx.save();
    ctx.setLineDash([5, 7]);
    ctx.strokeStyle = `rgba(255,255,255,${(0.12 * well.strength).toFixed(3)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(gp.sx, gp.sy, rx, rx * sp, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // --- Start pad (A) and goal ring (B) ---
  drawPad(ctx, view, level, level.start, "A", false, t, sp);
  drawPad(ctx, view, level, level.goal, "B", true, t, sp);

  // --- The marble ---
  drawBall(ctx, view, ball, sp);

  // --- Edge vignette to focus the scene ---
  const vg = ctx.createRadialGradient(
    w / 2,
    h * 0.5,
    Math.min(w, h) * 0.35,
    w / 2,
    h * 0.5,
    Math.max(w, h) * 0.75,
  );
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
}

function drawPad(
  ctx: CanvasRenderingContext2D,
  view: View,
  level: Level,
  pos: { x: number; y: number },
  label: string,
  pulse: boolean,
  t: number,
  sp: number,
) {
  const z = baseHeight(pos.x, pos.y, level);
  const p = project(pos.x, pos.y, z, view);
  const baseR = GOAL_RADIUS * view.scale * p.persp;
  const pulseK = pulse ? 0.5 + 0.5 * Math.sin(t * 2.2) : 0;
  const alpha = pulse ? 0.45 + 0.4 * pulseK : 0.28;

  ctx.save();
  // outer ring
  ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
  ctx.lineWidth = pulse ? 2 : 1.4;
  ctx.beginPath();
  ctx.ellipse(p.sx, p.sy, baseR, baseR * sp, 0, 0, Math.PI * 2);
  ctx.stroke();

  if (pulse) {
    // expanding pulse ring
    const pr = baseR * (1 + pulseK * 0.5);
    ctx.strokeStyle = `rgba(255,255,255,${(0.3 * (1 - pulseK)).toFixed(3)})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(p.sx, p.sy, pr, pr * sp, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // label
  ctx.fillStyle = `rgba(255,255,255,${pulse ? 0.85 : 0.5})`;
  ctx.font = `600 ${Math.max(11, baseR * 0.9).toFixed(0)}px var(--font-mono), monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, p.sx, p.sy - baseR * sp - 10);
  ctx.restore();
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  view: View,
  ball: Ball,
  sp: number,
) {
  // contact halo on the ground (anchors the marble visually)
  const groundZ = ball.z;
  const gp = project(ball.x, ball.y, groundZ, view);
  const r = Math.max(2.5, BALL_RADIUS * view.scale * gp.persp);

  ctx.save();
  const haloR = r * 2.6;
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(gp.sx, gp.sy + r * 0.5, haloR, haloR * sp, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // marble sits slightly above the surface
  const bp = project(ball.x, ball.y, groundZ + BALL_RADIUS, view);

  // soft additive glow
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const glow = ctx.createRadialGradient(
    bp.sx,
    bp.sy,
    0,
    bp.sx,
    bp.sy,
    r * 3.2,
  );
  glow.addColorStop(0, "rgba(255,255,255,0.55)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(bp.sx, bp.sy, r * 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // crisp white core with a faint top-light gradient
  const core = ctx.createRadialGradient(
    bp.sx - r * 0.35,
    bp.sy - r * 0.4,
    r * 0.1,
    bp.sx,
    bp.sy,
    r,
  );
  core.addColorStop(0, "rgba(255,255,255,1)");
  core.addColorStop(1, "rgba(210,210,210,1)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(bp.sx, bp.sy, r, 0, Math.PI * 2);
  ctx.fill();
}
