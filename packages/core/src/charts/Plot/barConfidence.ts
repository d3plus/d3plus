/**
    Error bars for a Plot's bars. When `confidence` is set, each bar with a
    finite bound draws a stroke from its lower to its upper bound, centered
    across the bar, capped at each end. A stacked bar's bounds sit around its
    stacked end rather than its raw value (see `stackedBound`).

    The error bar is a Path stamped as part of its bar: it shares the bar's
    datum (so hover/active dimming and tooltips treat the two as one mark),
    its shape type (so `.Bar` event handlers fire on it), and its key plus a
    `::confidence` suffix (so tooltip swatches and hover snapping read the
    bar's own node).

    @module
*/

import {color} from "d3-color";

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {collectComputed, makeShape, shapeConfigFor} from "../features/emitHelpers.js";
import type {PlotAxisFn, PlotDatum} from "../features/plotPaint.js";
import type {ShapeEmitContext} from "../features/shapeEmit.js";
import type {VizInstance as Viz} from "../viz/vizTypes.js";

/** Key suffix of a bar's error-bar node. */
export const CONFIDENCE_KEY_SUFFIX = "::confidence";

/** A stack segment's `[start, end]` values, as d3-stack produces them. */
type Segment = ArrayLike<number>;

/** A plotted row's confidence bounds, in axis values. */
export interface ConfidenceBounds {
  lower?: number;
  upper?: number;
}

/** Pixel layout of one error bar. */
interface ErrorBarLayout {
  key: string | number;
  center: number;
  thickness: number;
  lower?: number;
  upper?: number;
  end: number;
}

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/**
    Moves a confidence bound from a bar's raw value onto its stacked end. The
    bound keeps its distance from the value, scaled by the stack's own ratio of
    segment length to value, so an expanded (percentage) stack shrinks the
    bound with the bar.
    @param bound The bound, in data units.
    @param value The bar's raw value.
    @param segment The bar's `[start, end]` in the stack (start nearer the baseline for a positive value).
*/
export function stackedBound(bound: number, value: number, segment: Segment): number {
  const end = value < 0 ? segment[0] : segment[1];
  const start = value < 0 ? segment[1] : segment[0];
  const ratio = value ? (end - start) / value : 1;
  return end + (bound - value) * ratio;
}

/**
    A plotted row's finite confidence bounds along `axis`, shifted onto the
    stacked end when a stack `segment` is given. Empty when the row has none.
    @param d The plotted row (carries `lci`/`hci` and the axis value).
    @param axis The continuous axis the bar's value lies on.
    @param segment The bar's stack segment, for a stacked bar.
*/
export function confidenceBounds(
  d: PlotDatum,
  axis: "x" | "y",
  segment?: Segment,
): ConfidenceBounds {
  const value = d[axis];
  const out: ConfidenceBounds = {};
  for (const [key, bound] of [["lower", d.lci], ["upper", d.hci]] as const) {
    if (!finite(bound)) continue;
    if (segment && finite(value) && finite(segment[0]) && finite(segment[1]))
      out[key] = stackedBound(bound, value, segment);
    else if (!segment) out[key] = bound;
  }
  return out;
}

/**
    Every stacked bar's confidence bounds, positioned on its stacked end, for
    widening the stacked axis's domain to fit the error bars.
    @param rows The stacked chart's plotted rows.
    @param opp The continuous axis.
    @param stackData The d3-stack output, indexed `[stackKey][discreteKey]`.
    @param stackKeys The stack's series keys (row ids).
    @param discreteKeys The discrete positions (row `discrete` values).
*/
export function stackedConfidenceValues(
  rows: PlotDatum[],
  opp: "x" | "y",
  stackData: Segment[][],
  stackKeys: unknown[],
  discreteKeys: unknown[],
): number[] {
  const values: number[] = [];
  for (const d of rows) {
    if (d.shape !== "Bar") continue;
    const series = stackData[stackKeys.indexOf(d.id)];
    const segment = series && series[discreteKeys.indexOf(d.discrete)];
    if (!segment) continue;
    const {lower, upper} = confidenceBounds(d, opp, segment);
    if (finite(lower)) values.push(lower);
    if (finite(upper)) values.push(upper);
  }
  return values;
}

/**
    The cap length in pixels: a number is pixels, a `"N%"` string is a share of
    the bar's thickness.
    @param capWidth The configured cap width.
    @param thickness The bar's thickness across the discrete axis.
*/
export function capLength(capWidth: unknown, thickness: number): number {
  if (finite(capWidth)) return Math.max(0, capWidth);
  if (typeof capWidth === "string" && capWidth.trim().endsWith("%")) {
    const pct = parseFloat(capWidth);
    if (finite(pct)) return Math.max(0, (thickness * pct) / 100);
  }
  return thickness / 2;
}

/**
    The SVG path for one error bar: a stroke between the bounds along the
    continuous axis, plus a cap across each given bound. A missing bound runs
    the stroke to the bar's end with no cap there.
    @param discrete The discrete axis ("x" draws vertical error bars).
    @param center The bar's center across the discrete axis, in pixels.
    @param cap The cap length, in pixels.
    @param end The bar's end along the continuous axis, in pixels.
    @param lower The lower bound's pixel position, if any.
    @param upper The upper bound's pixel position, if any.
*/
export function errorBarPath(
  discrete: "x" | "y",
  center: number,
  cap: number,
  end: number,
  lower?: number,
  upper?: number,
): string {
  const a = finite(lower) ? lower : end;
  const b = finite(upper) ? upper : end;
  const half = cap / 2;
  const point = (along: number, across: number): string =>
    discrete === "x" ? `${across},${along}` : `${along},${across}`;
  let d = `M${point(a, center)}L${point(b, center)}`;
  for (const bound of [lower, upper])
    if (finite(bound) && half > 0)
      d += `M${point(bound, center - half)}L${point(bound, center + half)}`;
  return d;
}

/**
    The library's error-bar styling, layered under the user's
    `confidenceConfig`: a stroke a shade darker than the bar's own fill.
*/
function errorBarDefaults(viz: Viz): Record<string, unknown> {
  return {
    capWidth: "50%",
    stroke: (d: DataPoint, i: number) => {
      const {Bar, fill} = viz.schema.shapeConfig;
      const f = Bar && Bar.fill !== undefined ? Bar.fill : fill;
      const c = typeof f === "function" ? f(d, i) : f;
      const col = color(c as string);
      return col ? col.darker(1.5).formatHex() : c;
    },
    strokeWidth: 1.5,
  };
}

/** Measures each painted bar that has a finite confidence bound. */
function layoutErrorBars(ctx: ShapeEmitContext, bars: SceneNode[]): Map<PlotDatum, ErrorBarLayout> {
  const {viz, stackData, stackKeyIndex, discreteKeyIndex} = ctx;
  const discrete = viz.schema.discrete === "y" ? "y" : "x";
  const opp = discrete === "x" ? "y" : "x";
  const scale: PlotAxisFn = discrete === "x" ? ctx.y : ctx.x;
  const layouts = new Map<PlotDatum, ErrorBarLayout>();
  for (const node of bars) {
    if (node.type !== "rect" || node.shapeType !== "Bar" || `${node.key}`.endsWith("::hit")) continue;
    const d = node.datum as unknown as PlotDatum | undefined;
    if (!d || layouts.has(d)) continue;
    const segment = viz.schema.stacked
      ? stackData[stackKeyIndex.get(d.id) ?? -1]?.[discreteKeyIndex.get(d.discrete) ?? -1]
      : undefined;
    if (viz.schema.stacked && !segment) continue;
    const bounds = confidenceBounds(d, opp, segment);
    if (!finite(bounds.lower) && !finite(bounds.upper)) continue;
    const axis = d[`${opp}2`] !== undefined ? `${opp}2` : undefined;
    const px = (v: number | undefined): number | undefined =>
      finite(v) ? scale(v, axis) : undefined;
    const t = node.transform ?? {};
    const value = d[opp] as number;
    layouts.set(d, {
      key: node.key,
      center: discrete === "x"
        ? (t.x ?? 0) + node.x + node.width / 2
        : (t.y ?? 0) + node.y + node.height / 2,
      thickness: discrete === "x" ? node.width : node.height,
      lower: px(bounds.lower),
      upper: px(bounds.upper),
      end: scale(segment ? (value < 0 ? segment[0] : segment[1]) : value, axis),
    });
  }
  return layouts;
}

/**
    Emits the error bars for a Plot's painted bars (`viz.confidence`), styled
    by `confidenceConfig` (its top-level keys, overlaid by any nested under
    `Bar`). Empty when `confidence` is unset or no bar has a finite bound.
    @param ctx The Plot shape-emit context the bars were drawn with.
    @param bars The bars' scene nodes.
*/
export function emitBarConfidence(ctx: ShapeEmitContext, bars: SceneNode[]): SceneNode[] {
  const {viz} = ctx;
  if (!viz._confidence) return [];
  const layouts = layoutErrorBars(ctx, bars);
  if (!layouts.size) return [];

  const config = shapeConfigFor(viz, "Bar", {
    ...errorBarDefaults(viz),
    ...(viz._confidenceConfig ?? {}),
  });
  const capWidth = config.capWidth;
  delete config.capWidth;
  delete config.tooltip;
  const discrete = viz.schema.discrete === "y" ? "y" : "x";
  const layoutOf = (d: PlotDatum): ErrorBarLayout => layouts.get(d)!;

  const path = makeShape("Path")
    .renderMode("compute")
    .config(config)
    .config({
      d: (d: PlotDatum, i: number) => {
        const l = layoutOf(d);
        const cap = typeof capWidth === "function" ? capWidth(d, i) : capWidth;
        return errorBarPath(discrete, l.center, capLength(cap, l.thickness), l.end, l.lower, l.upper);
      },
      fill: "none",
      hitArea: {"stroke-width": 10},
      id: (d: PlotDatum) => `${layoutOf(d).key}${CONFIDENCE_KEY_SUFFIX}`,
      label: false,
      x: 0,
      y: 0,
    })
    .data(Array.from(layouts.keys()));
  viz._wirePlotShapeEvents!(path, "Bar", ctx.events);

  return collectComputed(path).map(node => ({...node, shapeType: "Bar"}) as SceneNode);
}
