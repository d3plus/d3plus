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

/** The pixel layout of one point's error bars. */
interface PointBars {
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

/** Measures each painted point that has a finite bound. */
function layoutPointBars(
  ctx: ShapeEmitContext,
  nodes: SceneNode[],
): Map<PlotDatum, PointBars> {
  const valueAxis = confidenceValueAxis(ctx.viz);
  const crossAxis = valueAxis === "y" ? "x" : "y";
  const out = new Map<PlotDatum, PointBars>();
  for (const node of nodes) {
    if (node.type !== "circle" || `${node.key}`.endsWith("::hit")) continue;
    const d = node.datum as unknown as PlotDatum | undefined;
    if (!d || out.has(d)) continue;
    const t = node.transform ?? {};
    const x = (t.x ?? 0) + node.cx,
      y = (t.y ?? 0) + node.cy;
    const at = {x, y};
    const value = axisBounds(ctx, valueAxis, d.lci, d.hci, at[valueAxis]);
    const cross = axisBounds(ctx, crossAxis, d.clci, d.chci, at[crossAxis]);
    if (!value && !cross) continue;
    out.set(d, {
      key: node.key,
      x,
      y,
      size: node.r * 2,
      bounds: {[valueAxis]: value, [crossAxis]: cross},
    });
  }
  return out;
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

  const config = shapeConfigFor(viz, "Circle", {
    ...errorBarDefaults(viz, "Circle"),
    capWidth: "100%",
    ...(viz._confidenceConfig ?? {}),
  });
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
