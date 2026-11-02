/**
    `ringsEmit` — link Paths + per-shape-type node groups using
    `ringsCtx` stashed on `viz.ctx`. Emits flat SceneNodes directly
    (no transient Shape compute pass).
*/

import type {DataPoint} from "@d3plus/data";
import type {Paint, SceneNode, Transform} from "@d3plus/render";

import {emitLabels} from "../../shapes/emitLabels.js";
import {
  edgeArrowTrims,
  straightEdgeArrows,
  straightEdgeD,
} from "../features/edgeArrows.js";
import type {ArrowValue} from "../features/edgeArrows.js";
import {
  drawNodeLabel,
  paintFromShapeConfig,
  resolveAccessor,
  shapeConfigFor,
  userLabelConfig,
} from "../features/emitHelpers.js";
import {backgroundImageNode} from "../features/backgroundImageEmit.js";
import {
  linkAriaLabel,
  linkHitPath,
  linkMeta,
} from "../features/linkInteraction.js";
import type {LinkDatum} from "../features/linkInteraction.js";
import {linkColorResolver} from "../features/linkColor.js";
import type {LinkEnds} from "../features/linkColor.js";
import {cubicMidpoint, segmentMidpoint} from "../features/linkLabelGeometry.js";
import type {LinkAnchor} from "../features/linkLabelGeometry.js";
import {emitLinkLabels, textLineBoxes} from "../features/linkLabels.js";
import {selfLoopArrows, selfLoopD} from "../features/selfLoops.js";
import {chordArrowNodes, cubicArrowEdge} from "../features/curvedArrows.js";
import type {SelfLoopGeometry} from "../features/selfLoops.js";
import type {ChartEmit} from "../definition/ChartDefinition.js";
import type {VizInstance} from "../viz/vizTypes.js";

export interface RingsEdge {
  /** The edge's index in `links`. */
  index?: number;
  source: DataPoint & {id: string; x: number; y: number};
  target: DataPoint & {id: string; x: number; y: number};
  size?: number;
  datum: LinkDatum;
  spline?: boolean;
  sourceX?: number;
  sourceY?: number;
  sourceBisectX?: number;
  sourceBisectY?: number;
  targetX?: number;
  targetY?: number;
  targetBisectX?: number;
  targetBisectY?: number;
  loop?: SelfLoopGeometry;
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
  if (edge.loop)
    return selfLoopArrows({
      arrows,
      arrowSize: viz.schema.arrowSize,
      strokeWidth,
      datum,
      i,
      keyPrefix: `rings-arrow-${baseKey}`,
      fill,
      loop: edge.loop,
    });
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
  const curve = ringsCurve(edge);
  if (!curve) return [];
  const trims = ringsTrims(viz, edge, i, strokeWidth);
  if (!trims.ends.source && !trims.ends.target) return [];
  return chordArrowNodes({
    ends: cubicArrowEdge(curve, trims),
    size: trims.size,
    datum,
    keyPrefix: "rings-arrow",
    keys: {
      source: `rings-arrow-s-${baseKey}`,
      target: `rings-arrow-t-${baseKey}`,
    },
    fill,
  });
}

/** A spline edge's curve, from its source end to its target end, or null for a straight edge. */
function ringsCurve(
  edge: RingsEdge,
):
  | [[number, number], [number, number], [number, number], [number, number]]
  | null {
  if (!edge.spline || edge.sourceX == null || edge.targetX == null) return null;
  return [
    [edge.sourceX, edge.sourceY!],
    [edge.sourceBisectX!, edge.sourceBisectY!],
    [edge.targetBisectX!, edge.targetBisectY!],
    [edge.targetX, edge.targetY!],
  ];
}

/** An edge's arrow ends, size, and stroke trims. */
const ringsTrims = (
  viz: VizInstance,
  edge: RingsEdge,
  i: number,
  strokeWidth: unknown,
) =>
  edgeArrowTrims({
    arrows: viz.schema.arrows as ArrowValue,
    arrowSize: viz.schema.arrowSize,
    strokeWidth: typeof strokeWidth === "number" ? strokeWidth : undefined,
    datum: edge.datum,
    i,
  });

/**
    An edge's visible stroke: `d`, cut short inside its arrowheads (see
    `edgeArrowTrims`). A spline edge or a loop follows its curve up to each
    head's base, then runs along the head's axis (see `cubicArrowEdge`); a
    spline's arrow tips sit on the node's edge, where the curve ends.
*/
export function ringsVisibleD(
  viz: VizInstance,
  edge: RingsEdge,
  i: number,
  strokeWidth: unknown,
  d: string,
): string {
  const trims = ringsTrims(viz, edge, i, strokeWidth);
  if (!trims.source && !trims.target) return d;
  if (edge.loop) return selfLoopD(edge.loop, trims);
  const curve = ringsCurve(edge);
  if (curve) return cubicArrowEdge(curve, trims).d;
  return straightEdgeD(
    edge.source as unknown as {x: number; y: number; r?: number},
    edge.target as unknown as {x: number; y: number; r?: number},
    trims,
  );
}

/** An edge's scene key (a loop's names its index, as a node can have several). */
const ringsLinkKey = (edge: RingsEdge): string =>
  `rings-link-${edge.source.id}-${edge.target.id}${edge.loop ? `-${linkMeta(edge.datum)?.index ?? 0}` : ""}`;

/**
    Where an edge's label goes: halfway along a spline edge's curve, along
    a straight edge's run between its nodes, or at a loop's far point.
*/
export function ringsEdgeAnchor(edge: RingsEdge): LinkAnchor {
  if (edge.loop) return edge.loop.apex;
  if (edge.spline && edge.sourceX != null && edge.targetX != null)
    return cubicMidpoint(
      [edge.sourceX, edge.sourceY!],
      [edge.sourceBisectX!, edge.sourceBisectY!],
      [edge.targetBisectX!, edge.targetBisectY!],
      [edge.targetX, edge.targetY!],
    );
  const r = (n: DataPoint) => (typeof n.r === "number" ? n.r : 0);
  return segmentMidpoint(
    [edge.source.x, edge.source.y],
    [edge.target.x, edge.target.y],
    r(edge.source),
    r(edge.target),
  );
}

/** How Rings draws its node labels. */
interface RingsNodeConfig {
  label?: (d: RingsNode, i: number) => unknown;
  labelBounds?: (d: RingsNode) => Record<string, number>;
  labelConfig?: Record<string, unknown>;
  rotate?: (d: RingsNode) => number;
}

/** One node group's labels, each rotated out from the center along its ring. */
function ringsNodeLabels(
  viz: VizInstance,
  c: RingsCtx,
  shapeKind: string,
  values: RingsNode[],
): SceneNode[] {
  const nodeCfg = c.nodeShapeConfig as RingsNodeConfig;
  if (!values.length || !nodeCfg.label || !nodeCfg.labelBounds) return [];
  const labelFn = nodeCfg.label;
  const boundsFn = nodeCfg.labelBounds;
  return emitLabels({
    data: values as DataPoint[],
    label: (d, i) => labelFn(d as RingsNode, i),
    x: d => (d as RingsNode).x,
    y: d => (d as RingsNode).y,
    aes: d => ({r: (d as RingsNode).r}),
    rotate: d => (nodeCfg.rotate ? nodeCfg.rotate(d as RingsNode) : 0),
    id: d => `rings-label-${(d as RingsNode).id}`,
    labelBounds: (d, _i) => boundsFn(d as RingsNode),
    labelConfig: {
      ...userLabelConfig(viz, shapeKind),
      ...nodeCfg.labelConfig,
    },
  });
}

/** The edge labels, clear of every node and node label. */
function ringsLinkLabels(
  viz: VizInstance,
  c: RingsCtx,
  nodeLabels: SceneNode[],
): SceneNode[] {
  return emitLinkLabels(
    viz,
    c.edges.map((edge, i) => ({
      key: ringsLinkKey(edge),
      link: edge,
      i,
      anchor: ringsEdgeAnchor(edge),
      priority: edge.size,
    })),
    {
      circles: c.nodeGroups.flatMap(([, values]) =>
        values.map(n => ({x: n.x, y: n.y, r: n.r})),
      ),
      labels: textLineBoxes(nodeLabels),
    },
  );
}

/** One node's Circle or Rect SceneNode (origin-centered, placed by `transform`), or null for any other shape kind. */
function ringsNode(
  shapeKind: string,
  d: RingsNode,
  merged: Record<string, unknown>,
  base: {
    datum: DataPoint;
    paint: Paint;
    transform: Transform;
    aria: {label: string};
  },
  i: number,
): SceneNode | null {
  const key = `rings-${shapeKind}-${d.id}`;
  if (shapeKind === "Circle")
    return {type: "circle", key, cx: 0, cy: 0, r: d.r, ...base};
  if (shapeKind === "Rect") {
    const w = Number(
      resolveAccessor<number>(merged.width, base.datum, i) ?? d.r * 2,
    );
    const h = Number(
      resolveAccessor<number>(merged.height, base.datum, i) ?? d.r * 2,
    );
    return {
      type: "rect",
      key,
      x: -w / 2,
      y: -h / 2,
      width: w,
      height: h,
      ...base,
    };
  }
  return null;
}

export const ringsEmit: ChartEmit = ({viz}) => {
  const c = viz.ctx.ringsCtx as RingsCtx | undefined;
  if (!c) return [];
  const out: SceneNode[] = [];
  // Node labels first, so link labels can keep clear of them.
  const nodeLabels = new Map(
    (c.nodeGroups ?? []).map(([shapeKind, values]) => [
      shapeKind,
      ringsNodeLabels(viz, c, shapeKind, values),
    ]),
  );

  if (c.edges && c.edges.length) {
    const linkColor = linkColorResolver(viz);
    for (const edge of c.edges) {
      const datum = edge.datum;
      const i = linkMeta(datum)?.index ?? 0;
      const paint = paintFromShapeConfig(c.linkConfig, datum, i);
      if (typeof edge.size === "number") paint.strokeWidth = edge.size;
      const stroke = linkColor(datum, edge as unknown as LinkEnds);
      if (stroke) paint.stroke = stroke;
      const key = ringsLinkKey(edge);
      const d = c.linkD(edge);
      out.push({
        type: "path",
        key,
        d: ringsVisibleD(viz, edge, i, paint.strokeWidth, d),
        datum,
        index: i,
        paint,
        aria: {label: linkAriaLabel(viz, datum)},
      } as SceneNode);
      out.push(linkHitPath(key, d, datum, paint.strokeWidth) as SceneNode);

      // Optional directional arrowheads.
      out.push(
        ...ringsEdgeArrows(
          viz,
          edge,
          datum,
          paint.stroke,
          paint.strokeWidth,
          i,
        ),
      );
    }
    out.push(...ringsLinkLabels(viz, c, [...nodeLabels.values()].flat()));
  }

  if (c.nodeGroups && c.nodeGroups.length) {
    const nodeCfg = c.nodeShapeConfig as RingsNodeConfig;
    for (const [shapeKind, values] of c.nodeGroups) {
      if (!values.length) continue;
      const vizCfg = shapeConfigFor(viz, shapeKind);
      const merged = {...vizCfg, ...c.nodeShapeConfig};
      const images: SceneNode[] = [];

      for (let i = 0; i < values.length; i++) {
        const d = values[i];
        const datum = (d.data ?? d) as DataPoint;
        const paint = paintFromShapeConfig(merged, datum, d.i ?? i);
        // Nodes are data shapes: keep their stroke a constant screen width as the
        // diagram zooms (the edges above deliberately scale with the zoom).
        if (paint.vectorEffect === undefined)
          paint.vectorEffect = "non-scaling-stroke";
        const rotate = nodeCfg.rotate ? nodeCfg.rotate(d) : 0;
        const transform = rotate ? {x: d.x, y: d.y, rotate} : {x: d.x, y: d.y};
        const sizeFn = viz._size as
          ((d: DataPoint, i: number) => unknown) | undefined;
        const validSize = sizeFn ? `, ${sizeFn(datum, d.i ?? i)}` : "";
        const aria = {label: `${drawNodeLabel(viz, d, i)}${validSize}.`};
        const node = ringsNode(
          shapeKind,
          d,
          merged,
          {datum, paint, transform, aria},
          d.i ?? i,
        );
        // Other shape kinds: skipped (Rings's default is Circle).
        if (!node) continue;
        out.push(node);
        const image = backgroundImageNode(merged, node, datum, d.i ?? i);
        if (image) images.push(image);
      }
      out.push(...images);

      out.push(...(nodeLabels.get(shapeKind) ?? []));
    }
  }

  return out;
};
