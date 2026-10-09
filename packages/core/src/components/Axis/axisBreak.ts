/**
    Axis breaks. A linear axis can remove value ranges from itself — `break`
    takes a `[start, end]` range (or a list of them) — and each removed range
    is drawn as a fixed pixel gap marked by two short tilted lines on the tick
    side of the axis, with the axis line itself gapped between them. The
    automatic baseline break (`baselineBreak`) is the same machinery applied
    to the range between the `baseline` and a domain that stops short of it.
*/
import type {LineNode, Paint, SceneNode} from "@d3plus/render";

import type Axis from "./Axis.js";
import {brokenScale, normalizeBreaks} from "./brokenScale.js";
import type {ScaleEdgeBreak} from "./brokenScale.js";

export {brokenScaleTicks, isBrokenScale} from "./brokenScale.js";

/** The resolved geometry of an active baseline break. */
export type AxisBaselineBreak = ScaleEdgeBreak;

/** A resolved axis break, in values and pixels. */
export interface AxisBreak {
  /** The break's value edge nearest the baseline. */
  start: number;
  /** The break's other value edge. */
  end: number;
  /** Pixel position of `start`. */
  startPosition: number;
  /** Pixel position of `end`. */
  endPosition: number;
  /** Whether this is the automatic baseline break. */
  baseline: boolean;
  /** Whether shapes crossing the break get a gap cut across them (see `mask`). */
  mask: boolean;
}

/** The style of a break glyph, read from `breakConfig`/`baselineBreakConfig`. */
export interface BreakStyle {
  /** Degrees each break mark tilts away from perpendicular to the axis. */
  angle: number;
  /** Pixels between the two break marks, where the axis line is not drawn. */
  gap: number;
  /** Length of each break mark, drawn outward from the axis line on the tick side. */
  size: number;
  /** Pixels of axis each break occupies. */
  space: number;
  /** Whether a Plot cuts a gap across the shapes that cross the break. */
  mask: boolean;
  /** Whether a Plot draws the break's two lines across the plot. */
  lines: boolean;
}

const num = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

/** Reads the glyph settings from one of an axis's break configs. */
export function breakStyle(
  axis: Axis,
  key: "breakConfig" | "baselineBreakConfig" = "breakConfig",
): BreakStyle {
  const cfg = (axis.schema[key] || {}) as Record<string, unknown>;
  return {
    angle: num(cfg.angle, 30),
    gap: Math.max(0, num(cfg.gap, 5)),
    size: Math.max(0, num(cfg.size, 10)),
    space: Math.max(0, num(cfg.space, 36)),
    mask: typeof cfg.mask === "boolean" ? cfg.mask : key === "breakConfig",
    lines: cfg.lines !== false,
  };
}

/** Reads the baseline break's glyph settings (`baselineBreakConfig`). */
export const baselineBreakStyle = (axis: Axis): BreakStyle => breakStyle(axis, "baselineBreakConfig");

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
    Replaces a linear axis's scale with a broken one when it has a baseline
    break or any `break` ranges inside its domain, and records the resolved
    breaks on `axis._breaks`. Explicit breaks are dropped when the range
    can't hold them and still leave twice a break's space for the data.
*/
export function applyAxisBreaks(axis: Axis, range: number[]): void {
  axis._baselineBreak = resolveBaselineBreak(axis, range);
  axis._breaks = [];
  if (axis.schema.scale !== "linear" || !axis._d3Scale) return;
  const edge = axis._baselineBreak;
  const domain = (axis._d3Scale.domain() as number[]).map(Number);
  const inner = range.slice(0, 2).map(r => (edge && r === edge.position ? edge.edgePosition : r));
  const {space, mask} = breakStyle(axis);
  let breaks = normalizeBreaks(axis.schema.break, Math.min(...domain), Math.max(...domain));
  if (Math.abs(inner[1] - inner[0]) - breaks.length * space < space * 2) breaks = [];
  if (!edge && !breaks.length) return;

  const scale = brokenScale({domain, range: inner, breaks, space, edge});
  axis._d3Scale = scale;
  const baseline = typeof axis.schema.baseline === "number" ? axis.schema.baseline : 0;
  if (edge)
    axis._breaks.push({
      start: edge.value,
      end: edge.edge,
      startPosition: edge.position,
      endPosition: edge.edgePosition,
      baseline: true,
      mask: baselineBreakStyle(axis).mask,
    });
  breaks.forEach(([a, b]) => {
    const [start, end] = Math.abs(b - baseline) < Math.abs(a - baseline) ? [b, a] : [a, b];
    axis._breaks.push({start, end, startPosition: scale(start), endPosition: scale(end), baseline: false, mask});
  });
}

/**
    Drops tick values that fall inside a break and, unless `addBaseline` is
    off, makes sure a baseline break's baseline is present, so the axis reads
    "baseline, break, edge, …".
*/
export function breakTickValues(breaks: AxisBreak[], values: unknown[], addBaseline = true): unknown[] {
  const kept = values.filter(v => {
    const n = Number(v);
    return !breaks.some(b => n > Math.min(b.start, b.end) && n < Math.max(b.start, b.end));
  });
  if (addBaseline) {
    breaks.forEach(b => {
      if (b.baseline && !kept.some(v => Number(v) === b.start)) kept.push(b.start);
    });
  }
  return kept;
}

/** The pixel gap (`[from, to]`, ascending) a break leaves in the axis line. */
export function breakGap(axis: Axis, brk: AxisBreak): [number, number] {
  const {gap} = breakStyle(axis, brk.baseline ? "baselineBreakConfig" : "breakConfig");
  const center = (brk.startPosition + brk.endPosition) / 2;
  return [center - gap / 2, center + gap / 2];
}

/**
    The axis's domain bar: a single line, or — on a broken axis — the bar
    split at each break plus the break glyphs. `toPaint` resolves a line-style
    config (`barConfig`, `breakConfig`, `baselineBreakConfig`) into a Paint.
*/
export function axisBarNodes(
  axis: Axis,
  points: [number, number][],
  toPaint: (cfg: Record<string, unknown>) => Paint,
): SceneNode[] {
  const barPaint = toPaint(axis.schema.barConfig as Record<string, unknown>);
  const breaks = axis._breaks || [];
  if (!breaks.length) return [{type: "line", key: "bar", points, paint: barPaint}];
  return brokenBarScene(axis, breaks, points, barPaint, toPaint);
}

/**
    The domain bar of a broken axis plus its break glyphs. The bar runs from
    the baseline (on a baseline break) or its own start to its far end, gapped
    at every break; each gap is bounded by two parallel marks drawn outward on
    the tick side of the axis line, so nothing reaches into the plot. A
    baseline break's segment is keyed `bar-baseline` and its marks
    `baseline-break-0/1`; the bar's segments are `bar`, `bar-1`, … and an
    explicit break's marks `break-<i>-0/1`. `points` is the unbroken bar.
*/
export function brokenBarScene(
  axis: Axis,
  breaks: AxisBreak[],
  points: [number, number][],
  barPaint: Paint,
  toPaint: (cfg: Record<string, unknown>) => Paint,
): SceneNode[] {
  const horizontal = axis._position.horizontal;
  const along = horizontal ? 0 : 1;
  const cross = points[0][1 - along];
  const pt = (a: number, c: number): [number, number] => (horizontal ? [a, c] : [c, a]);
  const ends = points.map(p => p[along]);
  const edge = breaks.find(b => b.baseline);
  if (edge) ends.push(edge.startPosition);
  const lo = Math.min(...ends);
  const hi = Math.max(...ends);
  const outward = ["top", "left"].includes(axis.schema.orient) ? -1 : 1;

  const gaps = breaks.map(b => breakGap(axis, b)).sort((a, b) => a[0] - b[0]);
  const spans: [number, number][] = [];
  let from = lo;
  gaps.forEach(([g0, g1]) => {
    spans.push([from, g0]);
    from = g1;
  });
  spans.push([from, hi]);
  const baselineIndex = edge ? (edge.startPosition <= lo ? 0 : spans.length - 1) : -1;
  // Segments run away from the baseline end of the axis.
  const flip = baselineIndex > 0;
  let barIndex = 0;
  const nodes: LineNode[] = spans.map(([a, b], i) => {
    const key = i === baselineIndex ? "bar-baseline" : barIndex++ ? `bar-${barIndex - 1}` : "bar";
    const ends: [number, number][] = [pt(a, cross), pt(b, cross)];
    return {type: "line", key, points: flip ? ends.reverse() : ends, paint: barPaint};
  });
  // The baseline segment leads, then the bar's own segments.
  if (baselineIndex > 0) nodes.unshift(...nodes.splice(baselineIndex, 1));

  let explicit = 0;
  breaks.forEach(brk => {
    const cfgKey = brk.baseline ? "baselineBreakConfig" : "breakConfig";
    const {angle, size} = breakStyle(axis, cfgKey);
    const paint = toPaint(axis.schema[cfgKey] as Record<string, unknown>);
    const dir = Math.sign(brk.endPosition - brk.startPosition);
    const rad = (angle * Math.PI) / 180;
    // Marks start on the axis line and run outward on the tick side (away
    // from the plot), tilting `angle` degrees from perpendicular toward the
    // baseline side of the break.
    const dAlong = Math.sin(rad) * size;
    const dCross = Math.cos(rad) * size;
    const mark = (a: number): [number, number][] => [pt(a, cross), pt(a - dir * dAlong, cross + outward * dCross)];
    const prefix = brk.baseline ? "baseline-break" : `break-${explicit++}`;
    const [g0, g1] = breakGap(axis, brk);
    const [first, second] = dir < 0 ? [g1, g0] : [g0, g1];
    nodes.push(
      {type: "line", key: `${prefix}-0`, points: mark(first), paint},
      {type: "line", key: `${prefix}-1`, points: mark(second), paint},
    );
  });
  return nodes;
}
