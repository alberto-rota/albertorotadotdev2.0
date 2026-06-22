/**
 * Pure (stateless) math for the "Gravity Well" game.
 *
 * The world is a normalized heightfield z = h(x, y) where x, y range over
 * roughly [-HALF, HALF]. A white marble is a point mass that rolls downhill
 * under gravity (a = -g * ∇h - friction * v). The player never touches the
 * marble directly — instead the cursor depresses the terrain (a moving
 * Gaussian "well", mirroring the site's RepelGrid effect), and the marble
 * chases the low ground the player carves out, from start (A) to goal (B).
 *
 * Everything here is framework-free so it can be unit-reasoned about and reused
 * by the render loop in GravityGame.tsx.
 */

export const HALF = 1.5; // world spans [-HALF, HALF] on x and y

// ---- Camera / projection -------------------------------------------------

export type View = {
  w: number; // viewport width (css px)
  h: number; // viewport height (css px)
  cx: number; // projection origin x (css px)
  cy: number; // projection origin y (css px)
  scale: number; // world-unit -> px at unit perspective
  pitch: number; // camera tilt (rad); larger = more top-down
  fov: number; // perspective strength
  camDist: number; // camera distance offset (keeps depth positive)
  yOffset: number; // vertical nudge of the whole scene (css px)
};

export type Projected = {
  sx: number; // screen x (css px)
  sy: number; // screen y (css px)
  persp: number; // perspective scale factor (0..1-ish), front = larger
  depth: number; // camera-space depth, larger = farther
};

export function makeView(w: number, h: number): View {
  const scale = Math.min(w, h) * 0.46;
  return {
    w,
    h,
    cx: w / 2,
    cy: h / 2,
    scale,
    pitch: 1.02,
    fov: 3.2,
    camDist: 2.4,
    yOffset: h * 0.08,
  };
}

/** World (x, y, z) -> screen, with perspective foreshortening. */
export function project(x: number, y: number, z: number, v: View): Projected {
  const sp = Math.sin(v.pitch);
  const cp = Math.cos(v.pitch);
  const up = y * sp + z * cp; // screen-up component (z lifts toward camera)
  const depth = y * cp - z * sp; // away-from-camera depth
  const camZ = depth + v.camDist;
  const persp = v.fov / (v.fov + camZ);
  return {
    sx: v.cx + x * v.scale * persp,
    sy: v.cy - up * v.scale * persp + v.yOffset,
    persp,
    depth: camZ,
  };
}

/**
 * Inverse projection onto the ground plane (z = 0). Used to place the cursor
 * well exactly under the pointer. Closed-form because z is fixed at 0.
 */
export function screenToGround(
  sx: number,
  sy: number,
  v: View,
): { x: number; y: number } {
  const sp = Math.sin(v.pitch);
  const cp = Math.cos(v.pitch);
  // S = up * persp = y*sp*fov / (fov + y*cp + camDist)
  const S = (v.cy + v.yOffset - sy) / v.scale;
  const denom = sp * v.fov - S * cp;
  const y = (S * (v.fov + v.camDist)) / (Math.abs(denom) < 1e-6 ? 1e-6 : denom);
  const persp = v.fov / (v.fov + y * cp + v.camDist);
  const x = (sx - v.cx) / (v.scale * (Math.abs(persp) < 1e-6 ? 1e-6 : persp));
  return { x, y };
}

// ---- Level definition ----------------------------------------------------

export type Vec2 = { x: number; y: number };

export type Peak = { x: number; y: number; radius: number; height: number };
export type Ridge = {
  x: number;
  y: number;
  angle: number; // rad
  length: number; // sigma along the ridge
  width: number; // sigma across the ridge
  height: number;
};
/** A hazard: deep pit that also resets the marble if it falls in. */
export type Pit = { x: number; y: number; radius: number; depth: number };

export type Level = {
  name: string;
  hint: string;
  start: Vec2;
  goal: Vec2;
  peaks: Peak[];
  ridges: Ridge[];
  pits: Pit[];
};

export const GOAL_RADIUS = 0.2; // capture distance
export const BALL_RADIUS = 0.05;

const GOAL_BASIN = 0.16; // gentle pull into the goal
const GOAL_SIGMA = 0.3;
const START_BASIN = 0.1; // small dimple so the marble rests at A
const START_SIGMA = 0.22;
const EDGE_START = 1.18; // where the containment bowl begins
const EDGE_K = 2.4; // bowl steepness

function gauss(d2: number, twoSigma2: number) {
  return Math.exp(-d2 / twoSigma2);
}

/**
 * Base terrain height (everything except the live cursor well): obstacles,
 * goal basin, start dimple and the containment bowl near the edges.
 */
export function baseHeight(x: number, y: number, level: Level): number {
  let z = 0;

  for (let i = 0; i < level.peaks.length; i++) {
    const p = level.peaks[i];
    const dx = x - p.x;
    const dy = y - p.y;
    z += p.height * gauss(dx * dx + dy * dy, 2 * p.radius * p.radius);
  }

  for (let i = 0; i < level.ridges.length; i++) {
    const r = level.ridges[i];
    const ca = Math.cos(-r.angle);
    const sa = Math.sin(-r.angle);
    const dx = x - r.x;
    const dy = y - r.y;
    const u = dx * ca - dy * sa; // along ridge
    const w = dx * sa + dy * ca; // across ridge
    const e =
      (u * u) / (2 * r.length * r.length) + (w * w) / (2 * r.width * r.width);
    z += r.height * Math.exp(-e);
  }

  for (let i = 0; i < level.pits.length; i++) {
    const p = level.pits[i];
    const dx = x - p.x;
    const dy = y - p.y;
    z -= p.depth * gauss(dx * dx + dy * dy, 2 * p.radius * p.radius);
  }

  // Goal basin + start dimple.
  {
    const dx = x - level.goal.x;
    const dy = y - level.goal.y;
    z -= GOAL_BASIN * gauss(dx * dx + dy * dy, 2 * GOAL_SIGMA * GOAL_SIGMA);
  }
  {
    const dx = x - level.start.x;
    const dy = y - level.start.y;
    z -= START_BASIN * gauss(dx * dx + dy * dy, 2 * START_SIGMA * START_SIGMA);
  }

  // Soft containment bowl so the marble doesn't trivially fly off the world.
  const ox = Math.max(0, Math.abs(x) - EDGE_START);
  const oy = Math.max(0, Math.abs(y) - EDGE_START);
  z += EDGE_K * (ox * ox + oy * oy);

  return z;
}

// ---- Cursor well ---------------------------------------------------------

export type Well = {
  x: number; // eased world position
  y: number;
  strength: number; // eased 0..1 (fades in/out with pointer activity)
};

export const WELL_DEPTH = 0.62;
export const WELL_SIGMA = 0.5;

export function wellHeight(x: number, y: number, well: Well): number {
  if (well.strength <= 1e-3) return 0;
  const dx = x - well.x;
  const dy = y - well.y;
  return (
    -WELL_DEPTH *
    well.strength *
    gauss(dx * dx + dy * dy, 2 * WELL_SIGMA * WELL_SIGMA)
  );
}

/** Full surface height the marble actually rolls on. */
export function totalHeight(
  x: number,
  y: number,
  level: Level,
  well: Well,
): number {
  return baseHeight(x, y, level) + wellHeight(x, y, well);
}

// ---- Physics -------------------------------------------------------------

export type Ball = { x: number; y: number; vx: number; vy: number; z: number };

const GRAV = 3.1; // downhill acceleration gain
const FRICTION = 1.5; // linear velocity damping
const MAX_SPEED = 3.2;
const EPS = 0.012; // central-difference step for the gradient

/** Numeric gradient of the total surface at (x, y). */
function gradient(
  x: number,
  y: number,
  level: Level,
  well: Well,
): { gx: number; gy: number } {
  const hx1 = totalHeight(x + EPS, y, level, well);
  const hx0 = totalHeight(x - EPS, y, level, well);
  const hy1 = totalHeight(x, y + EPS, level, well);
  const hy0 = totalHeight(x, y - EPS, level, well);
  return {
    gx: (hx1 - hx0) / (2 * EPS),
    gy: (hy1 - hy0) / (2 * EPS),
  };
}

export type StepResult = "rolling" | "fell" | "goal";

/**
 * Advance the marble by dt seconds (caller may sub-step for stability).
 * Returns a coarse status used by the game loop for win / reset handling.
 */
export function stepBall(
  ball: Ball,
  level: Level,
  well: Well,
  dt: number,
): StepResult {
  const { gx, gy } = gradient(ball.x, ball.y, level, well);

  // Tangential gravity (small-slope approximation) + linear friction.
  const ax = -GRAV * gx - FRICTION * ball.vx;
  const ay = -GRAV * gy - FRICTION * ball.vy;

  ball.vx += ax * dt;
  ball.vy += ay * dt;

  const sp = Math.hypot(ball.vx, ball.vy);
  if (sp > MAX_SPEED) {
    const k = MAX_SPEED / sp;
    ball.vx *= k;
    ball.vy *= k;
  }

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.z = totalHeight(ball.x, ball.y, level, well);

  // Hazard pits: fall in -> reset.
  for (let i = 0; i < level.pits.length; i++) {
    const p = level.pits[i];
    const dx = ball.x - p.x;
    const dy = ball.y - p.y;
    if (dx * dx + dy * dy < p.radius * p.radius * 0.45) return "fell";
  }

  // Off the world -> reset.
  if (
    Math.abs(ball.x) > HALF + 0.35 ||
    Math.abs(ball.y) > HALF + 0.35 ||
    ball.z < -1.1
  ) {
    return "fell";
  }

  // Reached the goal ring.
  const dxg = ball.x - level.goal.x;
  const dyg = ball.y - level.goal.y;
  if (dxg * dxg + dyg * dyg < GOAL_RADIUS * GOAL_RADIUS) return "goal";

  return "rolling";
}

export function resetBall(ball: Ball, level: Level) {
  ball.x = level.start.x;
  ball.y = level.start.y;
  ball.vx = 0;
  ball.vy = 0;
  ball.z = baseHeight(level.start.x, level.start.y, level);
}

// ---- Levels --------------------------------------------------------------

export const LEVELS: Level[] = [
  {
    name: "First Roll",
    hint: "Move your cursor to bend the world — the sphere falls toward the dip you carve. Lead it into the ring.",
    start: { x: -1.05, y: -0.95 },
    goal: { x: 1.05, y: 0.95 },
    peaks: [{ x: 0, y: 0, radius: 0.5, height: 0.42 }],
    ridges: [],
    pits: [],
  },
  {
    name: "Slalom",
    hint: "Thread the sphere between the ridges. Pull it gently — overshoot and it rolls back.",
    start: { x: -1.1, y: -1.0 },
    goal: { x: 1.1, y: 1.0 },
    peaks: [],
    ridges: [
      { x: -0.25, y: 0.3, angle: 0.6, length: 0.85, width: 0.16, height: 0.5 },
      { x: 0.5, y: -0.3, angle: 0.6, length: 0.85, width: 0.16, height: 0.5 },
    ],
    pits: [{ x: 0.05, y: -0.7, radius: 0.32, depth: 0.6 }],
  },
  {
    name: "The Void",
    hint: "A chasm splits the world. Curve a path around it without letting the sphere slip in.",
    start: { x: -1.15, y: -0.15 },
    goal: { x: 1.15, y: 0.15 },
    peaks: [
      { x: -0.15, y: 0.95, radius: 0.4, height: 0.5 },
      { x: 0.15, y: -0.95, radius: 0.4, height: 0.5 },
    ],
    ridges: [],
    pits: [{ x: 0, y: 0, radius: 0.6, depth: 0.85 }],
  },
];
