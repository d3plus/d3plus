/**
    Error bars for a Plot's points. When `confidence` is set, each Circle
    with a finite bound draws a stroke between its bounds, capped at each
    end: along the value axis from the `confidence` pair (or a `{x, y}`
    setting's value-axis bounds), and along the other axis from a `{x, y}`
    setting's cross bounds, so a point with both draws a cross. The bars
    follow each point where it is drawn (swarmed included) and
    paint beneath it.

    Like a bar's (see `barConfidence.ts`), a point's error bar is a Path
    stamped as part of its point: the same datum and shape type, and its key
    plus a `::confidence` suffix.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";
import {finite} from "@d3plus/math";

import {
  collectComputed,
  makeShape,
  shapeConfigFor,
} from "../features/emitHelpers.js";
import type {PlotAxisFn, PlotDatum} from "../features/plotPaint.js";
import type {ShapeEmitContext} from "../features/shapeEmit.js";
import {
  capLength,
  clampErrorBar,
  CONFIDENCE_KEY_SUFFIX,
  errorBarDefaults,
  errorBarExtent,
  errorBarPath,
} from "./barConfidence.js";
import {confidenceValueAxis} from "./confidenceAxes.js";
import type {CircleLabelBox} from "../features/circleLabelPlacement.js";

/** The pixel layout of one point's error bars. */
export interface PointBars {
  key: string | number;
  x: number;
  y: number;
  /** The point's diameter, which a percentage `capWidth` is a share of. */
  size: number;
  /** Each axis's bounds in pixels, and which get a cap. */
  bounds: Partial<
    Record<
      "x" | "y",
      {
        lower?: number;
        upper?: number;
        caps: {lower: boolean; upper: boolean};
      }
    >
  >;
}

/**
    The SVG path of a point's error bars: a capped stroke between each
    axis's bounds, through the point's center.
    @param bars The point's layout.
    @param cap The cap length, in pixels.
*/
export function pointErrorPath(bars: PointBars, cap: number): string {
  let d = "";
  const {x: bx, y: by} = bars.bounds;
  if (by)
    d += errorBarPath("x", bars.x, cap, bars.y, by.lower, by.upper, by.caps);
  if (bx)
    d += errorBarPath("y", bars.y, cap, bars.x, bx.lower, bx.upper, bx.caps);
  return d;
}

/** One axis's bounds in pixels, held inside the axis's domain. */
function axisBounds(
  ctx: ShapeEmitContext,
  axis: "x" | "y",
  lower: unknown,
  upper: unknown,
  at: number,
) {
  if (!finite(lower) && !finite(upper)) return undefined;
  const scale: PlotAxisFn = axis === "x" ? ctx.x : ctx.y;
  const px = (v: unknown) => (finite(v) ? scale(v) : undefined);
  const extent = errorBarExtent(ctx, axis, scale);
  const {
    lower: l,
    upper: u,
    caps,
  } = clampErrorBar(
    px(lower),
    px(upper),
    at,
    axis === confidenceValueAxis(ctx.viz) ? extent : undefined,
  );
  return {lower: l, upper: u, caps};
}

/**
    The error bars of the point `d` drawn at `x`, `y` with radius `r`, in
    pixels; null when it has no finite bound or the chart no `confidence`.
*/
function pointBars(
  ctx: ShapeEmitContext,
  d: PlotDatum,
  key: string | number,
  x: number,
  y: number,
  r: number,
): PointBars | null {
  const {viz} = ctx;
  if (!viz._confidence && !viz._confidenceCross) return null;
  const valueAxis = confidenceValueAxis(viz);
  const crossAxis = valueAxis === "y" ? "x" : "y";
  const at = {x, y};
  const value = axisBounds(ctx, valueAxis, d.lci, d.hci, at[valueAxis]);
  const cross = axisBounds(ctx, crossAxis, d.clci, d.chci, at[crossAxis]);
  if (!value && !cross) return null;
  return {
    key,
    x,
    y,
    size: r * 2,
    bounds: {[valueAxis]: value, [crossAxis]: cross},
  };
}

/** Measures each painted point that has a finite bound. */
function layoutPointBars(
  ctx: ShapeEmitContext,
  nodes: SceneNode[],
): Map<PlotDatum, PointBars> {
  const out = new Map<PlotDatum, PointBars>();
  for (const node of nodes) {
    if (node.type !== "circle" || `${node.key}`.endsWith("::hit")) continue;
    const d = node.datum as unknown as PlotDatum | undefined;
    if (!d || out.has(d)) continue;
    const t = node.transform ?? {};
    const x = (t.x ?? 0) + node.cx,
      y = (t.y ?? 0) + node.cy;
    const bars = pointBars(ctx, d, node.key, x, y, node.r);
    if (bars) out.set(d, bars);
  }
  return out;
}

/**
    The boxes a point's error bars cover: one per stroke (the line along each
    bounded axis, and each cap), widened by half the stroke's width on every
    side.
    @param bars The point's layout.
    @param cap The cap length, in pixels.
    @param strokeWidth The error bars' stroke width, in pixels.
*/
export function pointErrorBoxes(
  bars: PointBars,
  cap: number,
  strokeWidth: number,
): CircleLabelBox[] {
  const pad = Math.max(0, strokeWidth) / 2;
  const half = cap / 2;
  const boxes: CircleLabelBox[] = [];
  const segment = (x1: number, y1: number, x2: number, y2: number) =>
    boxes.push({
      x: Math.min(x1, x2) - pad,
      y: Math.min(y1, y2) - pad,
      width: Math.abs(x2 - x1) + pad * 2,
      height: Math.abs(y2 - y1) + pad * 2,
    });
  for (const axis of ["x", "y"] as const) {
    const b = bars.bounds[axis];
    if (!b) continue;
    const at = bars[axis],
      across = axis === "y" ? bars.x : bars.y;
    const a = finite(b.lower) ? b.lower : at;
    const z = finite(b.upper) ? b.upper : at;
    const line = (u1: number, v1: number, u2: number, v2: number) =>
      axis === "y" ? segment(v1, u1, v2, u2) : segment(u1, v1, u2, v2);
    line(a, across, z, across);
    for (const [bound, capped] of [
      [b.lower, b.caps.lower],
      [b.upper, b.caps.upper],
    ] as const)
      if (finite(bound) && capped && half > 0)
        line(bound, across - half, bound, across + half);
  }
  return boxes;
}

/** The point error bars' style: `confidenceConfig` over the library's, for Circles. */
function pointBarConfig(ctx: ShapeEmitContext): Record<string, unknown> {
  const {viz} = ctx;
  return shapeConfigFor(viz, "Circle", {
    ...errorBarDefaults(viz, "Circle"),
    capWidth: "100%",
    ...(viz._confidenceConfig ?? {}),
  });
}

/** A config value, or an accessor's value for a row. */
const valueFor = (v: unknown, d: PlotDatum, i: number): unknown =>
  typeof v === "function"
    ? (v as (d: PlotDatum, i: number) => unknown)(d, i)
    : v;

/**
    The boxes every point's error bars cover, for labels beside points to
    keep clear of (see `plotCircleLabels`). Empty when the chart draws none.
    @param ctx The Plot shape-emit context the points are drawn with.
    @param points Each point's row and its center and radius, in pixels.
*/
export function pointErrorObstacles(
  ctx: ShapeEmitContext,
  points: {d: PlotDatum; x: number; y: number; r: number}[],
): CircleLabelBox[] {
  const {viz} = ctx;
  if (!viz._confidence && !viz._confidenceCross) return [];
  const config = pointBarConfig(ctx);
  return points.flatMap(({d, x, y, r}, i) => {
    const bars = pointBars(ctx, d, "", x, y, r);
    if (!bars) return [];
    const cap = capLength(valueFor(config.capWidth, d, i), bars.size);
    const width = Number(valueFor(config.strokeWidth, d, i));
    return pointErrorBoxes(bars, cap, Number.isFinite(width) ? width : 1);
  });
}

/**
    Emits the error bars of a Plot's painted points, styled by
    `confidenceConfig` (its top-level keys, overlaid by any nested under
    `Circle`); a cap is as wide as its point unless `capWidth` sets it.
    Empty when no point has a finite bound.
    @param ctx The Plot shape-emit context the points were drawn with.
    @param nodes The points' scene nodes.
*/
export function emitPointConfidence(
  ctx: ShapeEmitContext,
  nodes: SceneNode[],
): SceneNode[] {
  const {viz} = ctx;
  if (!viz._confidence && !viz._confidenceCross) return [];
  const layouts = layoutPointBars(ctx, nodes);
  if (!layouts.size) return [];

  const config = pointBarConfig(ctx);
  const capWidth = config.capWidth;
  delete config.capWidth;
  delete config.tooltip;
  const layoutOf = (d: PlotDatum): PointBars => layouts.get(d)!;

  const path = makeShape("Path")
    .renderMode("compute")
    .config(config)
    .config({
      d: (d: PlotDatum, i: number) => {
        const l = layoutOf(d);
        const cap = typeof capWidth === "function" ? capWidth(d, i) : capWidth;
        return pointErrorPath(l, capLength(cap, l.size));
      },
      fill: "none",
      hitArea: {"stroke-width": 10},
      id: (d: PlotDatum) => `${layoutOf(d).key}${CONFIDENCE_KEY_SUFFIX}`,
      label: false,
      x: 0,
      y: 0,
    })
    .data(Array.from(layouts.keys()) as unknown as DataPoint[]);
  viz._wirePlotShapeEvents!(path, "Circle", ctx.events);

  return collectComputed(path).map(
    node => ({...node, shapeType: "Circle"}) as SceneNode,
  );
}
