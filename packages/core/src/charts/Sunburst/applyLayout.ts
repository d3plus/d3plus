/**
    `applySunburstLayout` — Sunburst's chart-specific layout stage. Lays the
    drawn rows out as concentric rings (see `partition.ts`), sized to the chart
    area, and indexes the laid-out nodes by row on `viz.ctx.sunburstNodes` for
    the hover, tooltip, and click handlers.
*/

import type {DataPoint} from "@d3plus/data";

import type {TransformStage} from "../pipeline/stages.js";
import {chartBounds} from "../features/chartGeometry.js";
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

  const data = (viz._filteredData ?? []) as DataPoint[];
  if (!data.length) {
    viz.ctx.sunburstLaid = [];
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

  const origin = viz.ctx.sunburstZoomOrigin as SunburstZoomOrigin | undefined;
  const previous = viz.ctx.sunburstLaid as SunburstNode[] | undefined;
  viz.ctx.sunburstGhosts =
    origin && previous ? sunburstGhosts(previous, nodes, origin, radii) : [];
  viz.ctx.sunburstZoomOrigin = undefined;
  viz.ctx.sunburstLaid = nodes;

  const lookup = viz.ctx.sunburstNodes as Map<DataPoint, SunburstNode>;
  for (const node of nodes) {
    // The tooltip and legend read a row's share straight off the row.
    (node.datum as DataPoint & {share?: number}).share = node.share;
    lookup.set(node.datum, node);
  }
  viz.ctx.sunburstOuterRadius = outerRadius;

  return {shapeData: nodes as unknown as DataPoint[]};
};
