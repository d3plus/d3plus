/**
    `applySunburstLayout` — Sunburst's chart-specific layout stage. Lays the
    drawn rows out as concentric rings (see `partition.ts`), sized to the chart
    area, and indexes the laid-out nodes by row on `viz.ctx.sunburstNodes` for
    the hover, tooltip, and click handlers.
*/

import type {DataPoint} from "@d3plus/data";

import type {TransformStage} from "../pipeline/stages.js";
import {chartBounds} from "../features/chartGeometry.js";
import {stampShare} from "../features/shareKey.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {sunburstCollapse, sunburstRadii} from "./geometry.js";
import type {SunburstArc, SunburstRingSize} from "./geometry.js";
import {sunburstLayout} from "./partition.js";
import type {SunburstKey, SunburstNode, SunburstSort} from "./partition.js";

/** The drill-down focus: the `groupBy` level and key path of the node drawn at the center. */
export interface SunburstFocus {
  level: number;
  path: unknown[];
}

/**
    The node a click zoomed into, read from the drill-down history: the latest
    entry's `groupDepth` is the clicked node's `groupBy` level, and every drawn
    row shares that node's keys (the drill-down filtered to them). Level -1
    (an empty path) means the whole hierarchy is drawn around a hollow center.
*/
export function sunburstFocus(viz: VizInstance): SunburstFocus {
  const entry = viz._history?.[viz._history.length - 1];
  const data = (viz._filteredData ?? []) as DataPoint[];
  const groupBy = viz.schema.groupBy as SunburstKey[];
  if (!entry || entry.groupDepth === undefined || !data.length)
    return {level: -1, path: []};
  const level = Math.min(entry.groupDepth, viz._drawDepth - 1);
  if (level < 0) return {level: -1, path: []};
  const path = groupBy.slice(0, level + 1).map(g => g(data[0], 0));
  return {level, path};
}

/** An arc a zoom removed, folding away from its last drawn geometry (see `sunburstCollapse`). */
export interface SunburstGhost {
  id: string;
  datum: DataPoint;
  i: number | undefined;
  level: number;
  arc: SunburstArc;
}

/** The node a zoom-in click came from, recorded until the next layout consumes it. */
export interface SunburstZoomOrigin {
  startAngle: number;
  endAngle: number;
  depth: number;
}

/**
    The arcs of `previous` that `next` no longer draws, each collapsed the way
    the zoom from `origin` moves its neighbors.
*/
export function sunburstGhosts(
  previous: SunburstNode[],
  next: SunburstNode[],
  origin: SunburstZoomOrigin,
  radii: [number, number][],
): SunburstGhost[] {
  const kept = new Set(next.map(n => n.id));
  return previous
    .filter(n => !kept.has(n.id))
    .map(n => ({
      id: n.id,
      datum: n.datum,
      i: n.i,
      level: n.level,
      arc: sunburstCollapse(n, n.depth, origin, radii),
    }));
}

/**
    The node a zoom-out comes back through: the previous center disc, now a
    ring arc of the new layout (or, for a jump of several levels, its nearest
    drawn ancestor). Undefined for any other change of layout.
    @param previous The previous draw's nodes.
    @param next This draw's nodes.
*/
export function sunburstZoomOutFocus(
  previous: SunburstNode[],
  next: SunburstNode[],
): SunburstNode | undefined {
  const center = previous.find(n => n.depth === 0);
  if (!center) return undefined;
  const isPrefix = (n: SunburstNode) =>
    n.path.length <= center.path.length &&
    n.path.every((k, j) => k === center.path[j]);
  return next
    .filter(n => n.depth > 0 && isPrefix(n))
    .sort((a, b) => b.path.length - a.path.length)[0];
}

/**
    Gives every arc a zoom-out brings back the start it sweeps in from: the
    mirror of `sunburstGhosts`, collapsed through the zoom-out's focus (see
    `sunburstZoomOutFocus`) into the previous (zoomed) rings, so it grows out
    of 0 or 2π as the zoomed arcs shrink back into their slot. Empty for any
    other change of layout.
    @param previous The previous draw's nodes.
    @param next This draw's nodes.
    @param previousRadii The previous draw's radii per ring.
*/
export function sunburstReturning(
  previous: SunburstNode[],
  next: SunburstNode[],
  previousRadii: [number, number][],
): Map<string, SunburstArc> {
  const enter = new Map<string, SunburstArc>();
  const focus = sunburstZoomOutFocus(previous, next);
  if (!focus) return enter;
  const drawn = new Set(previous.map(n => n.id));
  const origin = {
    startAngle: focus.startAngle,
    endAngle: focus.endAngle,
    depth: focus.depth,
  };
  for (const n of next) {
    if (!drawn.has(n.id))
      enter.set(n.id, sunburstCollapse(n, n.depth, origin, previousRadii));
  }
  return enter;
}

/** The layout a render animates from: the last one drawn before it, plus a pending zoom-in origin. */
interface SunburstRenderBase {
  laid?: SunburstNode[];
  radii?: [number, number][];
  origin?: SunburstZoomOrigin;
}

/**
    The layout this render animates from. A render can lay the chart out more
    than once (placing the legend inside the chart redraws it), so the base is
    taken on the first pass — recognized by a fresh `_filteredData` — and
    every later pass of the same render reuses it, instead of animating from
    the pass before it.
*/
export function renderBase(viz: VizInstance): SunburstRenderBase {
  const pass = viz.ctx.sunburstPass as
    {data: unknown; base: SunburstRenderBase} | undefined;
  if (pass && pass.data === viz._filteredData) return pass.base;
  const base: SunburstRenderBase = {
    laid: viz.ctx.sunburstLaid as SunburstNode[] | undefined,
    radii: viz.ctx.sunburstRadii as [number, number][] | undefined,
    origin: viz.ctx.sunburstZoomOrigin as SunburstZoomOrigin | undefined,
  };
  viz.ctx.sunburstZoomOrigin = undefined;
  viz.ctx.sunburstPass = {data: viz._filteredData, base};
  return base;
}

/** The center slot's radius from the `innerRadius` config: a pixel value, or a function of the outer radius. */
function centerRadius(
  viz: VizInstance,
  outerRadius: number,
): number | undefined {
  const inner = viz.schema.innerRadius as
    number | ((outerRadius: number) => number) | undefined;
  const value = typeof inner === "function" ? inner(outerRadius) : inner;
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

export const applySunburstLayout: TransformStage = ({viz}) => {
  const {width, height} = chartBounds(viz);
  viz.ctx.sunburstWidth = width;
  viz.ctx.sunburstHeight = height;
  viz.ctx.sunburstNodes = new Map<DataPoint, SunburstNode>();
  viz.ctx.sunburstGhosts = [];

  const base = renderBase(viz);
  const data = (viz._filteredData ?? []) as DataPoint[];
  if (!data.length) {
    viz.ctx.sunburstLaid = [];
    viz.ctx.sunburstRadii = undefined;
    viz.ctx.sunburstEnterArcs = new Map<string, SunburstArc>();
    viz.ctx.sunburstOuterRadius = 0;
    return {shapeData: []};
  }

  // Leaves room for the hovered/active stroke emphasis (×3 the base width,
  // centered on the outline) so the outer ring's stroke is never clipped.
  const sc = (viz.schema.shapeConfig ?? {}) as Record<string, unknown>;
  const baseStrokeWidth =
    typeof sc.strokeWidth === "number" ? sc.strokeWidth : 1;
  const outerRadius = Math.max(
    0,
    Math.min(width, height) / 2 - (baseStrokeWidth * 3) / 2,
  );

  const focus = sunburstFocus(viz);
  const groupBy = viz.schema.groupBy as SunburstKey[];
  const keys = groupBy.slice(focus.level + 1, viz._drawDepth + 1);
  const radii = sunburstRadii(
    outerRadius,
    keys.length,
    viz.schema.ringSize as SunburstRingSize,
    centerRadius(viz, outerRadius),
  );

  const nodes = sunburstLayout({
    data,
    keys,
    firstLevel: focus.level + 1,
    focusPath: focus.path,
    sum: viz.schema.sum as (d: DataPoint) => number,
    sort: viz.schema.sort as SunburstSort | undefined,
    aggs: viz.schema.aggs as Parameters<typeof sunburstLayout>[0]["aggs"],
    radii,
  });

  const {laid: previous, radii: previousRadii, origin} = base;
  viz.ctx.sunburstGhosts =
    origin && previous ? sunburstGhosts(previous, nodes, origin, radii) : [];
  viz.ctx.sunburstEnterArcs =
    previous && previousRadii
      ? sunburstReturning(previous, nodes, previousRadii)
      : new Map<string, SunburstArc>();
  viz.ctx.sunburstLaid = nodes;
  viz.ctx.sunburstRadii = radii;

  const lookup = viz.ctx.sunburstNodes as Map<DataPoint, SunburstNode>;
  for (const node of nodes) {
    // The tooltip and legend read a row's share off the row (see shareKey.ts).
    stampShare(node.datum, node.share);
    lookup.set(node.datum, node);
  }
  viz.ctx.sunburstOuterRadius = outerRadius;

  return {shapeData: nodes as unknown as DataPoint[]};
};
