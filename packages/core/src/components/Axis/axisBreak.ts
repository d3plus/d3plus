/**
    Baseline axis breaks. When a linear axis has `baselineBreak` on and its
    domain stops short of `baseline` (e.g. a value axis set to [1100, 2100]
    with a baseline of 0), the axis becomes piecewise: the baseline sits at
    the axis end, a short fixed-length segment holds a break glyph, and the
    domain maps linearly over the rest of the range.
*/
import type {LineNode, Paint, SceneNode} from "@d3plus/render";

import type Axis from "./Axis.js";

/** The resolved geometry of an active baseline break. */
export interface AxisBaselineBreak {
  /** The baseline value, drawn at the axis end. */
  value: number;
  /** Pixel position of the baseline (the axis end). */
  position: number;
  /** The domain bound nearest the baseline: the first value after the break. */
  edge: number;
  /** Pixel position of `edge`. */
  edgePosition: number;
}

/** The style of the break glyph, read from `baselineBreakConfig`. */
export interface BaselineBreakStyle {
  /** Degrees each break mark tilts away from perpendicular to the axis. */
  angle: number;
  /** Pixels between the two break marks, where the axis line is not drawn. */
  gap: number;
  /** Length of each break mark, drawn outward from the axis line on the tick side. */
  size: number;
  /** Pixels of axis between the baseline tick and the first tick after the break. */
  space: number;
}

const num = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

/** Reads the numeric glyph settings from an axis's `baselineBreakConfig`. */
export function baselineBreakStyle(axis: Axis): BaselineBreakStyle {
  const cfg = (axis.schema.baselineBreakConfig || {}) as Record<string, unknown>;
  return {
    angle: num(cfg.angle, 30),
    gap: Math.max(0, num(cfg.gap, 5)),
    size: Math.max(0, num(cfg.size, 10)),
    space: Math.max(0, num(cfg.space, 36)),
  };
}

/**
    Resolves whether `axis` needs a baseline break for its current domain and
    `range`, returning the break geometry (or `null`). The break only applies
    to linear scales whose domain lies entirely on one side of the baseline,
    and only when the range is long enough to hold it.
*/
export function resolveBaselineBreak(
  axis: Axis,
  range: number[],
): AxisBaselineBreak | null {
  const {baseline, baselineBreak, scale} = axis.schema;
  if (!baselineBreak || scale !== "linear" || !axis._d3Scale) return null;
  if (typeof baseline !== "number" || !Number.isFinite(baseline)) return null;
  const domain = (axis._d3Scale.domain() as number[]).map(Number);
  if (domain.length !== 2 || domain.some(d => !Number.isFinite(d))) return null;
  const lo = Math.min(domain[0], domain[1]);
  const hi = Math.max(domain[0], domain[1]);
  if (lo === hi || (baseline >= lo && baseline <= hi)) return null;
  const edge = baseline < lo ? lo : hi;
  const edgeIndex = domain[0] === edge ? 0 : 1;
  const position = range[edgeIndex];
  const other = range[1 - edgeIndex];
  const {space} = baselineBreakStyle(axis);
  // Leave at least as much room for the domain as the break itself takes.
  if (!space || Math.abs(other - position) <= space * 2) return null;
  const edgePosition = position + Math.sign(other - position) * space;
  return {value: baseline, position, edge, edgePosition};
}

/**
    Maps `d` through the break's baseline segment: the baseline (and anything
    beyond it) pins to the axis end, and values between the baseline and the
    domain edge interpolate across the break. Returns `undefined` for values
    inside the domain, which the linear scale maps.
*/
export function breakPosition(brk: AxisBaselineBreak, d: number): number | undefined {
  const t = (d - brk.value) / (brk.edge - brk.value);
  if (!(t < 1)) return undefined;
  if (t <= 0) return brk.position;
  return brk.position + t * (brk.edgePosition - brk.position);
}

/**
    Drops tick values that fall inside the break (strictly between the
    baseline and the domain edge) and makes sure the baseline itself is
    present, so the axis reads "baseline, break, edge, …".
*/
export function breakTickValues(brk: AxisBaselineBreak, values: unknown[]): unknown[] {
  const lo = Math.min(brk.value, brk.edge);
  const hi = Math.max(brk.value, brk.edge);
  const kept = values.filter(v => {
    const n = Number(v);
    return !(n > lo && n < hi);
  });
  if (!kept.some(v => Number(v) === brk.value)) kept.push(brk.value);
  return kept;
}

/**
    The axis's domain bar: a single line, or — with an active baseline break —
    the split bar plus its break glyph. `toPaint` resolves a line-style config
    (`barConfig`, `baselineBreakConfig`) into a Paint.
*/
export function axisBarNodes(
  axis: Axis,
  points: [number, number][],
  toPaint: (cfg: Record<string, unknown>) => Paint,
): SceneNode[] {
  const barPaint = toPaint(axis.schema.barConfig as Record<string, unknown>);
  const brk = axis._baselineBreak;
  if (!brk) return [{type: "line", key: "bar", points, paint: barPaint}];
  const markPaint = toPaint(axis.schema.baselineBreakConfig as Record<string, unknown>);
  return baselineBreakScene(axis, brk, points, barPaint, markPaint);
}

/**
    The domain bar of a broken axis plus its break glyph: the bar is split
    into a short baseline segment and the main segment, with the gap between
    them bounded by two parallel, tilted marks drawn on the tick side of the
    axis line, so nothing reaches into the plot. `points` is the unbroken bar.
*/
export function baselineBreakScene(
  axis: Axis,
  brk: AxisBaselineBreak,
  points: [number, number][],
  barPaint: Paint,
  markPaint: Paint,
): SceneNode[] {
  const horizontal = axis._position.horizontal;
  const along = horizontal ? 0 : 1;
  const cross = points[0][1 - along];
  const ends = points.map(p => p[along]);
  const far = Math.abs(ends[0] - brk.position) > Math.abs(ends[1] - brk.position) ? ends[0] : ends[1];
  const dir = Math.sign(brk.edgePosition - brk.position);
  const {angle, gap, size} = baselineBreakStyle(axis);
  const center = (brk.position + brk.edgePosition) / 2;
  const gapStart = center - (dir * gap) / 2;
  const gapEnd = center + (dir * gap) / 2;

  const pt = (a: number, c: number): [number, number] => (horizontal ? [a, c] : [c, a]);
  const rad = (angle * Math.PI) / 180;
  // Marks start on the axis line and run outward on the tick side (away from
  // the plot), tilting `angle` degrees from perpendicular toward the baseline.
  const outward = ["top", "left"].includes(axis.schema.orient) ? -1 : 1;
  const dAlong = Math.sin(rad) * size;
  const dCross = Math.cos(rad) * size;
  const mark = (a: number): [number, number][] => [
    pt(a, cross),
    pt(a - dir * dAlong, cross + outward * dCross),
  ];

  const nodes: LineNode[] = [
    {type: "line", key: "bar-baseline", points: [pt(brk.position, cross), pt(gapStart, cross)], paint: barPaint},
    {type: "line", key: "bar", points: [pt(gapEnd, cross), pt(far, cross)], paint: barPaint},
    {type: "line", key: "baseline-break-0", points: mark(gapStart), paint: markPaint},
    {type: "line", key: "baseline-break-1", points: mark(gapEnd), paint: markPaint},
  ];
  return nodes;
}
