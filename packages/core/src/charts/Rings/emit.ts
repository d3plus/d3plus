/**
    `ringsEmit` — link Paths + per-shape-type node groups using
    `ringsCtx` stashed on `viz.ctx`. Emits flat SceneNodes directly
    (no transient Shape compute pass).
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {emitLabels} from "../../shapes/emitLabels.js";
import {arrowEnds, arrowNode, arrowSizeFor, straightEdgeArrows} from "../features/edgeArrows.js";
import type {ArrowValue} from "../features/edgeArrows.js";
import {drawNodeLabel, paintFromShapeConfig, resolveAccessor, shapeConfigFor} from "../features/emitHelpers.js";
import type {ChartEmit} from "../definition/ChartDefinition.js";
import type {VizInstance} from "../viz/vizTypes.js";

interface RingsEdge {
  source: DataPoint & {id: string; x: number; y: number};
  target: DataPoint & {id: string; x: number; y: number};
  size?: number;
  spline?: boolean;
  sourceX?: number;
  sourceY?: number;
  sourceBisectX?: number;
  sourceBisectY?: number;
  targetX?: number;
  targetY?: number;
  targetBisectX?: number;
  targetBisectY?: number;
}
type RingsNode = DataPoint & {
  __d3plus__?: true;
  data?: DataPoint;
  i?: number;
  id: string;
  shape: string;
  x: number;
  y: number;
  r: number;
  rotate?: number;
  textAnchor?: string;
  labelBounds?: {x: number; y: number; width: number; height: number};
};
interface RingsCtx {
  edges: RingsEdge[];
  nodeGroups: [string, RingsNode[]][];
  linkConfig: Record<string, unknown>;
  linkD: (d: RingsEdge) => string;
  nodeShapeConfig: Record<string, unknown>;
}

/**
    Arrowheads for one Rings edge. Spline edges already terminate at the node
    boundary, so the tangent comes from the bezier's end control point; straight
    center-links run center-to-center and inset by the node radius.
*/
function ringsEdgeArrows(
  viz: VizInstance,
  edge: RingsEdge,
  datum: DataPoint,
  stroke: string | undefined,
  strokeWidth: number | undefined,
  i: number,
): SceneNode[] {
  const arrows = viz.schema.arrows as ArrowValue;
  const baseKey = `${edge.source.id}-${edge.target.id}-${i}`;
  const fill = typeof stroke === "string" ? stroke : undefined;
  if (!edge.spline) {
    return straightEdgeArrows({
      arrows,
      arrowSize: viz.schema.arrowSize,
      strokeWidth,
      datum,
      i,
      keyPrefix: `rings-arrow-${baseKey}`,
      fill,
      source: edge.source as unknown as {x: number; y: number; r?: number},
      target: edge.target as unknown as {x: number; y: number; r?: number},
    });
  }
  const ends = arrowEnds(arrows, datum, i);
  if (!ends.source && !ends.target) return [];
  const size = arrowSizeFor(viz.schema.arrowSize, datum, i, typeof strokeWidth === "number" ? strokeWidth : 1);
  const out: SceneNode[] = [];
  if (ends.target && edge.targetX != null) {
    const angle = Math.atan2(edge.targetY! - edge.targetBisectY!, edge.targetX - edge.targetBisectX!);
    out.push(arrowNode({key: `rings-arrow-t-${baseKey}`, datum, x: edge.targetX, y: edge.targetY!, angle, size, fill}));
  }
  if (ends.source && edge.sourceX != null) {
    const angle = Math.atan2(edge.sourceY! - edge.sourceBisectY!, edge.sourceX - edge.sourceBisectX!);
    out.push(arrowNode({key: `rings-arrow-s-${baseKey}`, datum, x: edge.sourceX, y: edge.sourceY!, angle, size, fill}));
  }
  return out;
}

export const ringsEmit: ChartEmit = ({viz}) => {
  const c = viz.ctx.ringsCtx as RingsCtx | undefined;
  if (!c) return [];
  const out: SceneNode[] = [];

  if (c.edges && c.edges.length) {
    for (let i = 0; i < c.edges.length; i++) {
      const edge = c.edges[i];
      const datum = edge as unknown as DataPoint;
      const paint = paintFromShapeConfig(c.linkConfig, datum, i);
      if (typeof edge.size === "number") paint.strokeWidth = edge.size;
      const sizeLabel = typeof edge.size === "number" ? `, ${edge.size}` : "";
      out.push({
        type: "path",
        key: `rings-link-${edge.source.id}-${edge.target.id}`,
        d: c.linkD(edge),
        datum,
        paint,
        aria: {
          label: `${drawNodeLabel(viz, edge.source, 0)} to ${drawNodeLabel(viz, edge.target, 0)}${sizeLabel}.`,
        },
      } as SceneNode);

      // Optional directional arrowheads.
      out.push(...ringsEdgeArrows(viz, edge, datum, paint.stroke, paint.strokeWidth, i));
    }
  }

  if (c.nodeGroups && c.nodeGroups.length) {
    const nodeCfg = c.nodeShapeConfig as {
      label?: (d: RingsNode, i: number) => unknown;
      labelBounds?: (d: RingsNode) => Record<string, number>;
      labelConfig?: Record<string, unknown>;
      rotate?: (d: RingsNode) => number;
    };
    for (const [shapeKind, values] of c.nodeGroups) {
      if (!values.length) continue;
      const vizCfg = shapeConfigFor(viz, shapeKind);
      const merged = {...vizCfg, ...c.nodeShapeConfig};

      for (let i = 0; i < values.length; i++) {
        const d = values[i];
        const datum = (d.data ?? d) as DataPoint;
        const paint = paintFromShapeConfig(merged, datum, d.i ?? i);
        // Nodes are data shapes: keep their stroke a constant screen width as the
        // diagram zooms (the edges above deliberately scale with the zoom).
        if (paint.vectorEffect === undefined) paint.vectorEffect = "non-scaling-stroke";
        const rotate = nodeCfg.rotate ? nodeCfg.rotate(d) : 0;
        const transform = rotate ? {x: d.x, y: d.y, rotate} : {x: d.x, y: d.y};
        const sizeFn = viz._size as ((d: DataPoint, i: number) => unknown) | undefined;
        const validSize = sizeFn ? `, ${sizeFn(datum, d.i ?? i)}` : "";
        const aria = {label: `${drawNodeLabel(viz, d, i)}${validSize}.`};
        if (shapeKind === "Circle") {
          out.push({
            type: "circle",
            key: `rings-${shapeKind}-${d.id}`,
            cx: 0,
            cy: 0,
            r: d.r,
            datum,
            paint,
            transform,
            aria,
          } as SceneNode);
        } else if (shapeKind === "Rect") {
          const w = Number(resolveAccessor<number>(merged.width, datum, d.i ?? i) ?? d.r * 2);
          const h = Number(resolveAccessor<number>(merged.height, datum, d.i ?? i) ?? d.r * 2);
          out.push({
            type: "rect",
            key: `rings-${shapeKind}-${d.id}`,
            x: -w / 2,
            y: -h / 2,
            width: w,
            height: h,
            datum,
            paint,
            transform,
            aria,
          } as SceneNode);
        }
        // Other shape kinds: skipped (Rings's default is Circle).
      }

      if (nodeCfg.label && nodeCfg.labelBounds) {
        const labelFn = nodeCfg.label;
        const boundsFn = nodeCfg.labelBounds;
        const labelNodes = emitLabels({
          data: values as DataPoint[],
          label: (d, i) => labelFn(d as RingsNode, i),
          x: d => (d as RingsNode).x,
          y: d => (d as RingsNode).y,
          aes: d => ({r: (d as RingsNode).r}),
          rotate: d => (nodeCfg.rotate ? nodeCfg.rotate(d as RingsNode) : 0),
          id: d => `rings-label-${(d as RingsNode).id}`,
          labelBounds: (d, _i) => boundsFn(d as RingsNode),
          labelConfig: nodeCfg.labelConfig ?? {},
        });
        out.push(...labelNodes);
      }
    }
  }

  return out;
};
