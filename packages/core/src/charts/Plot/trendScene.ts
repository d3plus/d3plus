/**
    Paints the fitted trend lines (`viz._trendFits`) behind the plot's marks:
    per fit, an optional confidence band and the line itself, in one
    stably-keyed group so frames tween rather than re-enter.
*/
import type {SceneNode} from "@d3plus/render";

import {collectComputed, makeShape} from "../features/emitHelpers.js";
import type {PlotAxisFn} from "../features/plotPaint.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {TrendFit, TrendSample} from "./trendLines.js";

/** Scene-node fields the trend line stamps for hover routing. */
export type TrendNode = SceneNode & {
  interactive?: boolean;
  interactionGroup?: string;
  trendFit?: TrendFit;
  children?: SceneNode[];
};

/** `trendLineConfig` keys that drive the fit or band; the rest style the Line. */
const FIT_KEYS = ["group", "order", "confidence", "confidenceLevel", "confidenceConfig", "tooltip", "stroke"];

/**
    Stamps a subtree as trend chrome: pickable only when it carries a tooltip
    (`trendFit`), and dimmed with its series on hover via the series' row.
*/
function stamp(node: SceneNode, fit: TrendFit, pickable: boolean): SceneNode {
  const n = node as TrendNode;
  n.interactive = pickable;
  n.interactionGroup = "trend";
  if (pickable) n.trendFit = fit;
  n.datum = fit.row;
  if (n.children) n.children.forEach(c => stamp(c, fit, pickable));
  return node;
}

/** The band's Area accessors: independent axis along the samples, bounds across. */
function bandAccessors(fit: TrendFit, x: PlotAxisFn, y: PlotAxisFn) {
  const along = (d: TrendSample) => (fit.axis === "x" ? x(d.x) : y(d.y));
  const lo = (d: TrendSample) => (fit.axis === "x" ? y(d.lci) : x(d.lci));
  const hi = (d: TrendSample) => (fit.axis === "x" ? y(d.hci) : x(d.hci));
  return fit.axis === "x"
    ? {x: along, x0: along, x1: null, y: lo, y0: lo, y1: hi}
    : {y: along, y0: along, y1: null, x: lo, x0: lo, x1: hi};
}

/** Renders one fit's band (when computed) and line as a keyed group. */
function trendGroup(viz: VizInstance, fit: TrendFit, x: PlotAxisFn, y: PlotAxisFn): SceneNode | null {
  const config = viz._trendLineConfig || {};
  const children: SceneNode[] = [];
  const id = () => `trend-${fit.id}`;
  if (fit.samples[0].lci !== undefined) {
    const band = makeShape("Area")
      .renderMode("compute")
      .duration(viz.schema.duration)
      .data(fit.samples)
      .config({id, label: false, fill: fit.color, stroke: "none", strokeWidth: 0})
      .config((config.confidenceConfig || {}) as Record<string, unknown>)
      .config(bandAccessors(fit, x, y));
    children.push(...collectComputed(band).map(n => stamp(n, fit, false)));
  }
  const paint = Object.fromEntries(
    Object.entries(config).filter(([key]) => !FIT_KEYS.includes(key)),
  );
  const line = makeShape("Line")
    .renderMode("compute")
    .duration(viz.schema.duration)
    .data(fit.samples)
    .config({...paint, id, label: false, stroke: fit.color})
    .config({x: (d: TrendSample) => x(d.x), y: (d: TrendSample) => y(d.y)});
  children.push(...collectComputed(line).map(n => stamp(n, fit, config.tooltip !== false)));
  if (!children.length) return null;
  return {type: "group", key: `plot-trend-${fit.id}`, children} as SceneNode;
}

/** The scene groups for every fitted trend line, painted behind the marks. */
export function emitTrendLines(viz: VizInstance, x: PlotAxisFn, y: PlotAxisFn): SceneNode[] {
  const fits = viz._trendFits || [];
  return fits
    .map(fit => trendGroup(viz, fit, x, y))
    .filter((g): g is SceneNode => g !== null);
}
