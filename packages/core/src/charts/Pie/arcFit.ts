/**
    Pure geometry for a Pie's sweep: the angular range its slices fill, the
    bounding box of the ring they draw, and where that ring sits in the chart
    area. Angles are radians in d3's convention (0 at 12 o'clock, increasing
    clockwise), so a point at angle `a` and radius `r` sits at
    `(r·sin a, −r·cos a)`.
*/

const TAU = Math.PI * 2;
const EPSILON = 1e-9;

/** The angular range a Pie's slices fill, in radians. `end` may be less than `start` (a counter-clockwise sweep). */
export interface PieSweep {
  start: number;
  end: number;
}

/** An axis-aligned box around the ring's center. */
export interface ArcBox {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** Where the ring sits in the chart area, how large it is, and its footprint in pixels around its center. */
export interface RingFit {
  cx: number;
  cy: number;
  radius: number;
  box: ArcBox;
}

/**
    Resolves the `startAngle` and `endAngle` settings (degrees clockwise from
    12 o'clock) to a sweep in radians. An unset `endAngle` makes a full turn
    from `startAngle`, and the sweep never exceeds one turn in either direction.
*/
export function pieSweep(startAngle: unknown, endAngle: unknown): PieSweep {
  const finite = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v);
  const start = finite(startAngle) ? (startAngle * Math.PI) / 180 : 0;
  const end = finite(endAngle) ? (endAngle * Math.PI) / 180 : start + TAU;
  const span = Math.max(-TAU, Math.min(TAU, end - start));
  return {start, end: start + span};
}

/** Whether a sweep goes all the way around. */
export function isFullTurn(start: number, end: number): boolean {
  return Math.abs(end - start) >= TAU - EPSILON;
}

/** Where `angle` falls within the sweep, from 0 at its start to 1 at its end, wrapping around the circle. */
export function sweepFraction(angle: number, sweep: PieSweep): number {
  const span = sweep.end - sweep.start;
  if (!span) return 0;
  let rel = ((angle - sweep.start) * Math.sign(span)) % TAU;
  if (rel < 0) rel += TAU;
  return rel / Math.abs(span);
}

const clean = (v: number) => (Math.abs(v) < EPSILON ? 0 : v);

/**
    The bounding box of a ring's slice from `start` to `end`, in units of its
    outer radius: the outer arc's ends, every 12, 3, 6 and 9 o'clock extreme
    it passes, and the inner arc's ends at `inner` (a fraction of the outer
    radius; 0 puts them at the center).
*/
export function ringExtent(start: number, end: number, inner = 0): ArcBox {
  if (isFullTurn(start, end)) return {x0: -1, x1: 1, y0: -1, y1: 1};
  const a0 = Math.min(start, end);
  const a1 = Math.max(start, end);
  const r = Math.max(0, Math.min(1, inner));
  const xs: number[] = [];
  const ys: number[] = [];
  const add = (a: number, radius: number) => {
    xs.push(clean(radius * Math.sin(a)));
    ys.push(clean(-radius * Math.cos(a)));
  };
  add(a0, 1);
  add(a1, 1);
  const quarter = Math.PI / 2;
  for (
    let q = Math.ceil(a0 / quarter - EPSILON);
    q * quarter <= a1 + EPSILON;
    q++
  )
    add(q * quarter, 1);
  add(a0, r);
  add(a1, r);
  return {
    x0: Math.min(...xs),
    x1: Math.max(...xs),
    y0: Math.min(...ys),
    y1: Math.max(...ys),
  };
}

/** The ring's footprint in pixels at outer radius `radius`, with its inner arc at `innerRadius` pixels. */
function pixelBox(
  start: number,
  end: number,
  radius: number,
  innerRadius: number,
): ArcBox {
  const b = ringExtent(start, end, radius > 0 ? innerRadius / radius : 0);
  return {
    x0: b.x0 * radius,
    x1: b.x1 * radius,
    y0: b.y0 * radius,
    y1: b.y1 * radius,
  };
}

/** The largest radius at which `box` (in units of the radius) fits `width` × `height`. */
function boxRadius(width: number, height: number, box: ArcBox): number {
  const w = box.x1 - box.x0;
  const h = box.y1 - box.y0;
  return Math.max(
    0,
    Math.min(w > 0 ? width / w : Infinity, h > 0 ? height / h : Infinity),
  );
}

/**
    Fits a ring sweeping from `start` to `end` (radians) into `width` ×
    `height`, inset by `pad` on every side: the largest outer radius at which
    the ring's own footprint fits, with an inner radius of `innerRadius`
    pixels. The footprint is centered in any room left over.
*/
export function fitRing(
  width: number,
  height: number,
  start: number,
  end: number,
  innerRadius = 0,
  pad = 0,
): RingFit {
  if (isFullTurn(start, end)) {
    const radius = Math.max(0, Math.min(width, height) / 2 - pad);
    return {
      cx: width / 2,
      cy: height / 2,
      radius,
      box: {x0: -radius, x1: radius, y0: -radius, y1: radius},
    };
  }
  const w = Math.max(0, width - pad * 2);
  const h = Math.max(0, height - pad * 2);
  const inner = Math.max(0, innerRadius);
  // The hole-less footprint is the largest, so its radius always fits; a hole
  // can only shrink the footprint, letting the ring grow toward the radius
  // that fits its outer arc alone.
  let lo = boxRadius(w, h, ringExtent(start, end, 0));
  if (inner > 0 && Number.isFinite(lo)) {
    let hi = boxRadius(w, h, ringExtent(start, end, 1));
    if (!Number.isFinite(hi)) hi = lo;
    const fits = (r: number) => {
      const b = pixelBox(start, end, r, inner);
      return b.x1 - b.x0 <= w + EPSILON && b.y1 - b.y0 <= h + EPSILON;
    };
    for (let k = 0; k < 40 && hi - lo > 1e-6; k++) {
      const mid = (lo + hi) / 2;
      if (fits(mid)) lo = mid;
      else hi = mid;
    }
  }
  const radius = Number.isFinite(lo) ? lo : 0;
  const box = pixelBox(start, end, radius, inner);
  const bw = box.x1 - box.x0;
  const bh = box.y1 - box.y0;
  return {
    cx: pad + (w - bw) / 2 - box.x0,
    cy: pad + (h - bh) / 2 - box.y0,
    radius,
    box,
  };
}
