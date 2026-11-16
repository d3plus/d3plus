/**
    Paints a Plot's outliers (see `outlierDetect.ts`): a ring around each
    flagged mark (a point, a bar, or a line or area's point), styled by
    `outlierConfig`, and a short label naming it and its value (see
    `outlierLabels.ts`).
*/
import type {DataPoint} from "@d3plus/data";
import type {Bounds} from "@d3plus/math";
import type {Paint, SceneNode, Transform} from "@d3plus/render";

import type {OutlierConfig} from "../../utils/D3plusConfig.js";
import type {PlotAxisFn} from "../features/plotPaint.js";
import type {Edges} from "../features/pathLabelGeometry.js";
import {mapBox, mapper, ownBoxes} from "../features/sceneBounds.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import {vizDiscrete} from "../viz/discrete.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {PlotOutlier} from "./outlierDetect.js";
import {emitOutlierLabels} from "./outlierLabels.js";
import type {OutlierRing} from "./outlierLabels.js";

type Accessor<T> = T | ((d: DataPoint, i: number) => T);

/** `outlierConfig`'s defaults. */
export function outlierDefaults(): OutlierConfig {
  return {gap: 2, label: true, labelConfig: {}, r: 6, strokeWidth: 2};
}

/** The chart's `outlierConfig`. */
export const outlierConfig = (viz: VizInstance): OutlierConfig =>
  (viz.schema.outlierConfig ?? {}) as OutlierConfig;

/**
    The outlier a scene datum stands for, following its `data` chain (a
    mark's datum wraps its source row once, a label's twice).
    @param outliers The chart's outliers, by source row.
    @param datum A scene node's datum.
*/
export function outlierOf(
  outliers: Map<DataPoint, PlotOutlier> | undefined,
  datum: unknown,
): [DataPoint, PlotOutlier] | null {
  if (!outliers || !outliers.size) return null;
  let d = datum as (DataPoint & {data?: DataPoint}) | undefined;
  for (let n = 0; d && n < 3; n++, d = d.data as typeof d) {
    const hit = outliers.get(d);
    if (hit) return [d, hit];
  }
  return null;
}

/**
    The radius of a ring around a circle: `width` wide, its inner edge `gap`
    pixels clear of the circle.
*/
export const outlierRingRadius = (
  r: number,
  gap: number,
  width: number,
): number => r + gap + width / 2;

/** A box grown by `by` on every side. */
export const growBox = (b: Bounds, by: number): Bounds => ({
  x: b.x - by,
  y: b.y - by,
  width: b.width + by * 2,
  height: b.height + by * 2,
});

/**
    A box cut to the plot area, less `inset` on each side, so a ring around
    a bar that reaches an edge (or its baseline) keeps all four sides in view.
    @param b The box.
    @param edges The plot area.
    @param inset How far inside the plot area the box must stay.
*/
export function clampRingBox(b: Bounds, edges: Edges, inset: number): Bounds {
  const x0 = Math.max(b.x, edges.x0 + inset);
  const y0 = Math.max(b.y, edges.y0 + inset);
  const x1 = Math.min(b.x + b.width, edges.x1 - inset);
  const y1 = Math.min(b.y + b.height, edges.y1 - inset);
  return {
    x: x0,
    y: y0,
    width: Math.max(0, x1 - x0),
    height: Math.max(0, y1 - y0),
  };
}

/**
    Whether a bar's value end is the high edge of its box on screen (its
    right or bottom edge), being the edge nearer its value's position.
    @param box The bar's box.
    @param along The value axis.
    @param at The value's pixel position along it.
*/
export function barEndHigh(box: Bounds, along: "x" | "y", at: number): boolean {
  const lo = along === "y" ? box.y : box.x;
  const hi = lo + (along === "y" ? box.height : box.width);
  return Math.abs(at - hi) < Math.abs(at - lo);
}

/**
    The point of a drawn edge nearest `at` along the discrete axis: where an
    area's top edge passes a point, which its `interactionPoints` (placed
    on its base) don't give.
    @param edge The edge's points, in plot space.
    @param at The point's position.
    @param along The axis to match on: `"x"` for upright areas.
*/
export function edgePoint(
  edge: [number, number][],
  at: [number, number],
  along: "x" | "y",
): [number, number] {
  const k = along === "x" ? 0 : 1;
  let best = at;
  let gap = Infinity;
  for (const p of edge) {
    const d = Math.abs(p[k] - at[k]);
    if (d < gap) [best, gap] = [p, d];
  }
  return best;
}

/** Resolves a style value against a row. */
function resolve<T>(value: Accessor<T> | undefined, d: DataPoint, i: number) {
  return typeof value === "function"
    ? (value as (d: DataPoint, i: number) => T)(d, i)
    : value;
}

/**
    A ring's paint: unfilled, stroked in `outlierConfig`'s style, in the
    chart's text color by default.
    @param viz The chart.
    @param config The chart's `outlierConfig`.
    @param d The outlier's source row.
    @param i Its index.
*/
export function ringPaint(
  viz: VizInstance,
  config: OutlierConfig,
  d: DataPoint,
  i: number,
): Paint & {strokeWidth: number} {
  const dash = resolve(config.strokeDasharray, d, i);
  const width = resolve(config.strokeWidth, d, i);
  const opacity = resolve(config.strokeOpacity, d, i);
  return {
    fill: "none",
    stroke: resolve(config.stroke, d, i) ?? backgroundInk(viz),
    strokeWidth: typeof width === "number" && width >= 0 ? width : 2,
    ...(typeof opacity === "number" ? {strokeOpacity: opacity} : {}),
    ...(dash
      ? {
          strokeDasharray: (typeof dash === "string"
            ? dash.trim().split(/[\s,]+/)
            : dash
          ).map(Number),
        }
      : {}),
  };
}

/**
    A data mark found in the scene: `map` takes its geometry into plot space,
    and `pointMap` its `interactionPoints`, which sit outside its own
    transform.
*/
interface Mark {
  node: SceneNode;
  map: (p: [number, number]) => [number, number];
  pointMap: (p: [number, number]) => [number, number];
  scale: number;
}

/** Every data mark under `nodes`: no hit areas, chrome, or labels. */
function marksOf(nodes: SceneNode[]): Mark[] {
  const out: Mark[] = [];
  const walk = (list: SceneNode[], chain: Transform[]) => {
    for (const node of list) {
      if (String(node.key).endsWith("::hit")) continue;
      if (node.interactionGroup || node.interactive === false) continue;
      const next = node.transform ? [...chain, node.transform] : chain;
      if (node.type === "group") walk(node.children, next);
      else if (node.type !== "text")
        out.push({
          node,
          map: mapper(next),
          pointMap: mapper(chain),
          scale: next.reduce((s, t) => s * (t.scale ?? 1), 1),
        });
    }
  };
  walk(nodes, []);
  return out;
}

/** A ring node's shared fields: inert, hidden from assistive tech, and carrying its mark's datum so it dims and lights with it. */
const ringBase = (key: string, datum: unknown, index: number | undefined) => ({
  key: `outlier-ring-${key}`,
  datum: datum as DataPoint,
  index,
  interactive: false,
  aria: {hidden: true},
});

/**
    The rings around the outliers among `nodes`: a circle around each
    flagged point, a box around each flagged bar or square, and a circle `r`
    across around each flagged point of a line or area that no marker of its
    own already rings.
    @param viz The chart.
    @param nodes The plot's data marks.
    @param frame The plot's axis position functions, to find each bar's end,
    and the plot area, which a bar's or square's ring stays inside.
*/
export function outlierRings(
  viz: VizInstance,
  nodes: SceneNode[],
  frame: {x: PlotAxisFn; y: PlotAxisFn; edges: Edges},
): OutlierRing[] {
  const outliers = viz._plotOutliers;
  if (!outliers || !outliers.size) return [];
  const config = outlierConfig(viz);
  const gap = typeof config.gap === "number" ? config.gap : 2;
  const rings: OutlierRing[] = [];
  const ringed = new Set<DataPoint>();
  const marks = marksOf(nodes);
  for (const {node, map, scale} of marks) {
    if (node.type !== "circle" && node.type !== "rect") continue;
    const hit = outlierOf(outliers, node.datum);
    if (!hit || ringed.has(hit[0])) continue;
    const [source, outlier] = hit;
    const paint = ringPaint(viz, config, source, outlier.row.i as number);
    const base = ringBase(String(node.key), node.datum, node.index);
    const outer = paint.strokeWidth / 2;
    if (node.type === "circle") {
      const [cx, cy] = map([node.cx, node.cy]);
      const r = outlierRingRadius(node.r * scale, gap, paint.strokeWidth);
      rings.push({
        node: {type: "circle", cx, cy, r, paint, ...base} as SceneNode,
        circle: {x: cx, y: cy, r: r + outer},
        source,
        outlier,
      });
    } else {
      const box = clampRingBox(
        growBox(mapBox(ownBoxes(node)[0], map), gap + outer),
        frame.edges,
        outer,
      );
      const along = outlier.axis.charAt(0) as "x" | "y";
      const value = outlier.row[outlier.axis];
      const at = frame[along](value, outlier.axis);
      rings.push({
        node: {type: "rect", ...box, paint, ...base} as SceneNode,
        box: growBox(box, outer),
        ...(outlier.row.shape === "Bar"
          ? {endHigh: barEndHigh(box, along, at), inset: gap + 2 * outer}
          : {}),
        source,
        outlier,
      });
    }
    ringed.add(source);
  }
  const radius = typeof config.r === "number" ? config.r : 6;
  const along = vizDiscrete(viz) === "y" ? "y" : "x";
  for (const {node, map, pointMap} of marks) {
    const top =
      node.type === "path" && node.series?.base
        ? node.series.top.map(map)
        : null;
    for (const p of node.interactionPoints ?? []) {
      const hit = outlierOf(outliers, p.datum);
      if (!hit || ringed.has(hit[0])) continue;
      const [source, outlier] = hit;
      const paint = ringPaint(viz, config, source, outlier.row.i as number);
      const at = pointMap([p.x, p.y]);
      const [cx, cy] = top ? edgePoint(top, at, along) : at;
      const base = ringBase(`${String(node.key)}-${p.index}`, p.datum, p.index);
      rings.push({
        node: {type: "circle", cx, cy, r: radius, paint, ...base} as SceneNode,
        circle: {x: cx, y: cy, r: radius + paint.strokeWidth / 2},
        source,
        outlier,
      });
      ringed.add(source);
    }
  }
  return rings;
}

/**
    `nodes` without the labels of the marks in `sources`, at any depth.
    @param nodes Scene nodes.
    @param sources The source rows whose marks' labels go.
*/
export function dropMarkLabels(
  nodes: SceneNode[],
  sources: Set<DataPoint>,
): SceneNode[] {
  if (!sources.size) return nodes;
  const map = new Map([...sources].map(d => [d, {} as PlotOutlier]));
  return nodes.flatMap((node): SceneNode[] => {
    if (node.type === "text") return outlierOf(map, node.datum) ? [] : [node];
    if (node.type !== "group") return [node];
    return [{...node, children: dropMarkLabels(node.children, sources)}];
  });
}

/**
    A plot's marks with its outliers painted over them: each ring, then each
    label that finds room beside its ring, which stands in for the mark's
    own label.
    @param viz The chart.
    @param nodes The plot's data marks and their labels.
    @param frame The axis position functions and the plot area's edges.
*/
export function withOutliers(
  viz: VizInstance,
  nodes: SceneNode[],
  frame: {x: PlotAxisFn; y: PlotAxisFn; edges: Edges},
): SceneNode[] {
  const rings = outlierRings(viz, nodes, frame);
  if (!rings.length) return nodes;
  const config = outlierConfig(viz);
  const labels = emitOutlierLabels(viz, rings, nodes, frame.edges, {
    label: config.label,
    labelConfig: config.labelConfig,
  });
  return [
    ...dropMarkLabels(nodes, labels.sources),
    ...rings.map(r => r.node),
    ...labels.nodes,
  ];
}
