/**
    Morphs one polygon path into another of a different make-up, such as a
    region's outline into a circle or square: each ring is paired with a
    ring of the other path, the two are given the same number of points
    (adding points along the longer segments, so every original vertex is
    kept), turned to line up, and tweened point by point.

    @module
*/

import {pathCommands} from "@d3plus/math";

import {explicitPathD, interpolatePathD} from "../paths.js";

/** A point. */
export type MorphPoint = [number, number];
/** A closed ring of points, its closing point not repeated. */
export type MorphRing = MorphPoint[];

/** The most points a pair of rings is checked at when lining them up. */
const ALIGN_SAMPLES = 96;

/**
    The closed rings of a path drawn with straight lines only (`M`, `L`,
    `H`, `V` and `Z`, absolute or relative), or null when it draws a curve,
    an arc, or a subpath left open.
    @param d The SVG path data.
*/
export function pathRings(d: string): MorphRing[] | null {
  const rings: MorphRing[] = [];
  let ring: MorphRing | null = null;
  let x = 0,
    y = 0,
    sx = 0,
    sy = 0;
  for (const {command, segments} of pathCommands(d)) {
    const lower = command.toLowerCase();
    const relative = command === lower;
    if (lower === "z") {
      if (!ring) return null;
      ring = null;
      x = sx;
      y = sy;
      continue;
    }
    if (lower !== "m" && lower !== "l" && lower !== "h" && lower !== "v")
      return null;
    for (let k = 0; k < segments.length; k++) {
      const s = segments[k];
      if (lower === "h") x = relative ? x + s[0] : s[0];
      else if (lower === "v") y = relative ? y + s[0] : s[0];
      else {
        x = relative ? x + s[0] : s[0];
        y = relative ? y + s[1] : s[1];
      }
      if (lower === "m" && k === 0) {
        if (ring) return null;
        ring = [];
        rings.push(ring);
        sx = x;
        sy = y;
      } else if (!ring) return null;
      ring.push([x, y]);
    }
  }
  if (ring) return null;
  for (const r of rings) {
    const first = r[0],
      last = r[r.length - 1];
    if (r.length > 1 && first[0] === last[0] && first[1] === last[1]) r.pop();
  }
  return rings;
}

/** A ring's signed area (positive when it turns clockwise on screen). */
function signedArea(ring: MorphRing): number {
  let sum = 0;
  for (let i = 0, n = ring.length; i < n; i++) {
    const [x0, y0] = ring[i],
      [x1, y1] = ring[(i + 1) % n];
    sum += x0 * y1 - x1 * y0;
  }
  return sum / 2;
}

/** The mean of a ring's points. */
function ringCenter(ring: MorphRing): MorphPoint {
  let x = 0,
    y = 0;
  for (const p of ring) {
    x += p[0];
    y += p[1];
  }
  return [x / ring.length, y / ring.length];
}

/**
    `ring` with `count` more points, spread over its segments by length (the
    closing segment included), every original point kept in order.
    @param ring The ring to add points to.
    @param count How many points to add.
*/
export function addRingPoints(ring: MorphRing, count: number): MorphRing {
  const n = ring.length;
  if (count <= 0 || !n) return ring.slice();
  const lengths = ring.map((p, i) => {
    const q = ring[(i + 1) % n];
    return Math.hypot(q[0] - p[0], q[1] - p[1]);
  });
  const total = lengths.reduce((a, b) => a + b, 0);
  const shares = lengths.map(l => (total ? (l / total) * count : count / n));
  const extra = shares.map(Math.floor);
  let left = count - extra.reduce((a, b) => a + b, 0);
  const order = shares
    .map((s, i) => [s - Math.floor(s), i])
    .sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let k = 0; left > 0; k = (k + 1) % n, left--) extra[order[k][1]]++;
  const out: MorphRing = [];
  ring.forEach((p, i) => {
    out.push(p);
    const q = ring[(i + 1) % n];
    const m = extra[i];
    for (let j = 1; j <= m; j++) {
      const t = j / (m + 1);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  });
  return out;
}

/** The turn of `b` (an index offset) that sits closest to `a`, both the same length. */
function bestOffset(a: MorphRing, b: MorphRing): number {
  const n = a.length;
  const step = Math.max(1, Math.floor(n / ALIGN_SAMPLES));
  let best = 0,
    min = Infinity;
  for (let o = 0; o < n; o += step) {
    let sum = 0;
    for (let i = 0; i < n && sum < min; i += step) {
      const p = a[i],
        q = b[(i + o) % n];
      sum += (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
    }
    if (sum < min) {
      min = sum;
      best = o;
    }
  }
  return best;
}

/**
    Two rings made ready to tween point by point: the same number of points
    (see `addRingPoints`), turning the same way, and `b` turned so each of
    its points starts near its partner in `a`.
    @param a The ring to tween from.
    @param b The ring to tween to.
*/
export function alignRings(a: MorphRing, b: MorphRing): [MorphRing, MorphRing] {
  let to = b;
  if (Math.sign(signedArea(a)) * Math.sign(signedArea(b)) < 0)
    to = b.slice().reverse();
  const n = Math.max(a.length, to.length);
  const from = addRingPoints(a, n - a.length);
  to = addRingPoints(to, n - to.length);
  const offset = bestOffset(from, to);
  if (offset) to = to.slice(offset).concat(to.slice(0, offset));
  return [from, to];
}

/**
    Pairs the rings of two paths, largest with largest by area. A ring left
    without a partner pairs with its own center, so it shrinks to (or grows
    from) a point where it stands.
    @param a The rings to tween from.
    @param b The rings to tween to.
*/
export function pairRings(
  a: MorphRing[],
  b: MorphRing[],
): [MorphRing, MorphRing][] {
  const bySize = (rings: MorphRing[]) =>
    rings
      .map(r => [Math.abs(signedArea(r)), r] as const)
      .sort((x, y) => y[0] - x[0])
      .map(d => d[1]);
  const sa = bySize(a),
    sb = bySize(b);
  const pairs: [MorphRing, MorphRing][] = [];
  for (let i = 0; i < Math.max(sa.length, sb.length); i++) {
    const p = sa[i],
      q = sb[i];
    if (p && q) pairs.push(alignRings(p, q));
    else if (p) pairs.push([p, p.map(() => ringCenter(p))]);
    else pairs.push([q.map(() => ringCenter(q)), q]);
  }
  return pairs;
}

/** The path data of tweened rings. */
function ringsD(pairs: [MorphRing, MorphRing][], t: number): string {
  let d = "";
  for (const [a, b] of pairs) {
    for (let i = 0; i < a.length; i++) {
      const x = a[i][0] + (b[i][0] - a[i][0]) * t;
      const y = a[i][1] + (b[i][1] - a[i][1]) * t;
      d += `${i ? "L" : "M"}${x},${y}`;
    }
    d += "Z";
  }
  return d;
}

/** The commands of a path, one letter per segment. */
function commandLetters(d: string): string {
  return explicitPathD(d).replace(/[^a-zA-Z]/g, "");
}

/**
    Tweens one polygon path's `d` into another's, ending on `b` as given
    (or on an empty path when `b` is missing).
    Two paths with the same commands tween point by point (see
    `interpolatePathD`); polygons that differ pair their rings and resample
    them (see `pairRings`), so an outline turns into a circle or square, or
    back, without folding over itself. Anything else, such as a path with
    curves, falls back to `interpolatePathD`.
    @param a The path data to tween from.
    @param b The path data to tween to.
*/
export function morphPathD(a: string, b: string): (t: number) => string {
  if (a === b) return () => b || "";
  if (!a || !b || commandLetters(a) === commandLetters(b))
    return interpolatePathD(a, b);
  const ra = pathRings(a),
    rb = pathRings(b);
  if (!ra?.length || !rb?.length) return interpolatePathD(a, b);
  const pairs = pairRings(ra, rb);
  return t => (t >= 1 ? b : ringsD(pairs, t));
}
