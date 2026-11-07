/**
    Pure geometry for labels drawn outside a Pie or Donut's ring: which side
    of the ring a slice's label takes, the room the labels need beside the
    ring, how one side's labels stack without overlapping, and the leader
    line that joins each label to its slice. Coordinates are relative to the
    ring's center; angles are radians in d3's convention (0 at 12 o'clock,
    increasing clockwise), so a point at angle `a` and radius `r` sits at
    `(r·sin a, −r·cos a)`.
*/
import {spreadLabelPositions} from "../Plot/lineLabelSpread.js";

/** A point, `[x, y]`. */
export type Point = [number, number];

/** The label font size when the Path labelConfig sets none. */
export const OUTSIDE_LABEL_FONT_SIZE = 12;

/** How the leaders and labels sit beside the ring, in pixels. */
export interface OutsideMetrics {
  /** The label's font size. */
  fontSize: number;
  /** The height each label takes in its column. */
  lineHeight: number;
  /** How far the leader runs straight out from the ring before it bends. */
  elbow: number;
  /** The shortest horizontal run of a leader before its label. */
  tail: number;
  /** The gap between the end of a leader and its label's text. */
  gap: number;
}

/**
    The metrics for labels at `fontSize`: a column line of 1.3em, and a
    leader that runs out 10px, bends, and runs at least 8px across to a
    label 4px past its end.
    @param fontSize The label's font size.
*/
export function outsideMetrics(fontSize: number): OutsideMetrics {
  return {
    fontSize,
    lineHeight: Math.ceil(fontSize * 1.3),
    elbow: 10,
    tail: 8,
    gap: 4,
  };
}

/**
    The side of the ring a slice's label goes on: `1` (right, its text
    reading away from the ring) when the slice's middle faces right, else
    `-1` (left). A slice facing straight up or down takes the right.
    @param angle The slice's middle angle.
*/
export function outsideSide(angle: number): 1 | -1 {
  return Math.sin(angle) >= -1e-9 ? 1 : -1;
}

/**
    How far from the ring's center each side's leaders end, where the
    labels' text starts (less `gap`): past the ring by the elbow and the
    shortest horizontal run.
    @param radius The ring's outer radius.
    @param metrics The label metrics.
*/
export function outsideColumn(radius: number, metrics: OutsideMetrics): number {
  return radius + metrics.elbow + metrics.tail;
}

/**
    The room labels need beside the ring on each side: the widest label on
    that side, plus its leader and gap, or 0 for a side without labels.
    @param labels Each label's middle angle and text width.
    @param metrics The label metrics.
*/
export function outsideRoom(
  labels: {angle: number; width: number}[],
  metrics: OutsideMetrics,
): {left: number; right: number} {
  const room = {left: 0, right: 0};
  const leader = metrics.elbow + metrics.tail + metrics.gap;
  for (const {angle, width} of labels) {
    const key = outsideSide(angle) === 1 ? "right" : "left";
    room[key] = Math.max(room[key], width + leader);
  }
  return room;
}

/** One label in a side's column. */
export interface StackItem {
  /** The height it would like its middle to sit at. */
  y: number;
  /** How tall it is. */
  size: number;
  /** How much it matters: the smallest are dropped first. */
  weight: number;
}

/**
    Stacks one side's labels so none overlap and all stay between `bounds`:
    sorted by the height each would like, then spread as little as they
    must (see `spreadLabelPositions`). While they don't all fit, or `fits`
    rejects one where it lands, the label with the smallest weight is
    dropped and the rest are stacked again. Returns the height of each
    label's middle, or null for a dropped one.
    @param items The labels.
    @param bounds The top and bottom of the room they share.
    @param fits Whether label `i` may sit at height `y`.
*/
export function stackOutsideLabels(
  items: StackItem[],
  bounds: [number, number],
  fits: (i: number, y: number) => boolean = () => true,
): (number | null)[] {
  const out: (number | null)[] = items.map(() => null);
  const top = Math.min(...bounds);
  const bottom = Math.max(...bounds);
  let active = items
    .map((item, i) => ({...item, i}))
    .filter(d => d.size <= bottom - top)
    .sort((a, b) => a.y - b.y || a.i - b.i);
  while (active.length) {
    // The column's centers run from the first label's half height below the
    // top to the last label's half height above the bottom.
    const first = active[0].size / 2;
    const last = active[active.length - 1].size / 2;
    const ys = spreadLabelPositions(
      active.map(d => d.y),
      active.map(d => d.size),
      [top + first, bottom - last],
    );
    const ok = ys.every(
      (y, k) => y + active[k].size / 2 <= bottom + 0.5 && fits(active[k].i, y),
    );
    if (ok) {
      active.forEach((d, k) => (out[d.i] = ys[k]));
      break;
    }
    const smallest = active.reduce((m, d) =>
      d.weight < m.weight || (d.weight === m.weight && d.i > m.i) ? d : m,
    );
    active = active.filter(d => d !== smallest);
  }
  return out;
}

/** The distance from the origin to the segment from `p` to `q`. */
export function segmentDistance(p: Point, q: Point): number {
  const dx = q[0] - p[0];
  const dy = q[1] - p[1];
  const len2 = dx * dx + dy * dy;
  const t = len2
    ? Math.max(0, Math.min(1, -(p[0] * dx + p[1] * dy) / len2))
    : 0;
  return Math.hypot(p[0] + t * dx, p[1] + t * dy);
}

/** A leader: from the slice's outer edge, through two bends, to the label's column. */
export type Leader = [Point, Point, Point, Point];

/**
    The ways a leader can run from a slice to its label at height `y`, best
    first. The first runs straight out from the middle of the slice's outer
    edge by the elbow, across to the label's height, and level for the last
    `tail` pixels into the label's column, when its run across keeps half an
    elbow clear of the ring. The second leaves the ring leaning only as far
    as it must to stay outside it, reaching the label's height before it
    runs level into the column, when that is short of the column. Empty when
    the label's height can't be reached without crossing the ring.
    @param angle The slice's middle angle.
    @param radius The ring's outer radius.
    @param y The label's height.
    @param metrics The label metrics.
*/
export function leaderRoutes(
  angle: number,
  radius: number,
  y: number,
  metrics: OutsideMetrics,
): Leader[] {
  const side = outsideSide(angle);
  const column = outsideColumn(radius, metrics);
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const a: Point = [radius * sin, -radius * cos];
  const end: Point = [side * column, y];
  const knee: Point = [side * (column - metrics.tail), y];
  const elbow: Point = [
    (radius + metrics.elbow) * sin,
    -(radius + metrics.elbow) * cos,
  ];
  const routes: Leader[] = [];
  if (segmentDistance(elbow, knee) >= radius + metrics.elbow / 2 - 1e-9)
    routes.push([a, elbow, knee, end]);
  // The run from the ring stays outside it while it heads away from the
  // ring's center: (B − A) · A ≥ 0.
  let bx = Math.abs(elbow[0]);
  const need = radius * radius - a[1] * y;
  const along = Math.abs(a[0]);
  if (bx * along < need) bx = along < 1e-9 ? Infinity : need / along;
  if (bx <= column - metrics.tail / 2 + 1e-9) {
    const b: Point = [side * bx, y];
    routes.push([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], b, end]);
  }
  return routes;
}

/**
    The leader from a slice to its label at height `y`: the best of
    `leaderRoutes`, or null when there is none.
    @param angle The slice's middle angle.
    @param radius The ring's outer radius.
    @param y The label's height.
    @param metrics The label metrics.
*/
export function leaderPoints(
  angle: number,
  radius: number,
  y: number,
  metrics: OutsideMetrics,
): Leader | null {
  return leaderRoutes(angle, radius, y, metrics)[0] ?? null;
}

/**
    Whether two polylines cross: some segment of one passes through some
    segment of the other more than `tolerance` pixels from either segment's
    ends (merely touching, or meeting where two leaders leave neighboring
    slivers together, doesn't count).
    @param a One polyline.
    @param b The other.
    @param tolerance How far from a segment's ends a crossing must be.
*/
export function polylinesCross(a: Point[], b: Point[], tolerance = 2): boolean {
  for (let i = 1; i < a.length; i++)
    for (let j = 1; j < b.length; j++) {
      const [p, q, r, s] = [a[i - 1], a[i], b[j - 1], b[j]];
      const d1: Point = [q[0] - p[0], q[1] - p[1]];
      const d2: Point = [s[0] - r[0], s[1] - r[1]];
      const denom = d1[0] * d2[1] - d1[1] * d2[0];
      if (Math.abs(denom) < 1e-12) continue;
      const e: Point = [r[0] - p[0], r[1] - p[1]];
      const t = (e[0] * d2[1] - e[1] * d2[0]) / denom;
      const u = (e[0] * d1[1] - e[1] * d1[0]) / denom;
      const l1 = Math.hypot(...d1);
      const l2 = Math.hypot(...d2);
      const inside = (v: number, len: number) =>
        v * len > tolerance && (1 - v) * len > tolerance;
      if (inside(t, l1) && inside(u, l2)) return true;
    }
  return false;
}

/**
    The height a slice's label would like: level with the middle of the
    slice's outer edge, pushed out by the leader's elbow.
    @param angle The slice's middle angle.
    @param radius The ring's outer radius.
    @param metrics The label metrics.
*/
export function outsideIdealY(
  angle: number,
  radius: number,
  metrics: OutsideMetrics,
): number {
  return -(radius + metrics.elbow) * Math.cos(angle);
}
